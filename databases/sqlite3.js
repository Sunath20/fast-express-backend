
// const { rejects } = require("assert");
const fs = require("fs")
const uuid = require("uuid")
const {Database} = require("./database")
const {DataClass, DataClassFactory} = require("../dataclasses")
const { InternalServerError, ModelWithIdNotFound } = require("../actions")
const { InvalidIdGiven } = require("./errors")
const { Databases, DATABASE_TYPES } = require(".")
const { InvalidArgumentError } = require("../errors")
const dataclasses = require("../dataclasses")
const {ACTION_TYPES} = require("../query/sqliteQuery");
const { dataClassToName } = require("../utils/dataclassToName")
const {isValueValid} = require("../utils/valueCheckings");
const {query} = require("express");

/**
 * Create a new database in the given url (should be local )
 * Don't call it on your Own.
 * This will overwrite the database you have
 * So make sure to go with the class definition
 * So you won't get any unique problems
 * @param {url} - url 
 */
function createDatabase(url){
    return new Promise((resolve,rejects) => {
        fs.writeFile(url,"",function(e){
            if(e){
                rejects("Could not create the database")
            }else{
                resolve("Database created successfully")
            }
        })
    
    })   
}

// define the validators that are limited sqlite database
// these are going to be similar to validators in other databases too
// but since we are using different libraries we are gonna make validators for every database
const SQLITE_VALIDATORS = {

    /**
     * Validate the relation field database rules
     * Means we check weather that value regards to column exist in the table 
     * @param {String} lookup_table 
     * @param {String} column_name 
     * @returns {Function}
     */
    RELATIONAL_DATABASE_VALIDATOR(lookup_table,column_name){
        // create the validator 
        return  function(value){
            // return the promise in order to not to break the architecture
            return new Promise(async (resolve,reject) => {
                // run the query to get the record with that
                const val = (await Databases.connections[DATABASE_TYPES.SQLITE].find(lookup_table,{[column_name]:value})) || []
                // console.log(value , " this is the query of the relation field check ")
                if(val.length == 0){
                    resolve({okay:false,error:`The ${column_name} is not valid.Please input a right one`})
                }else{
                    resolve({okay:true})
                }
            }) 
       
       }

    }
}

/**
 * runs a database function without call back
 * instead we use promises since we can await in express
 * @param {sqlite3.Database} database 
 * @param  {...any} args - arguments for the execution(should include which function gonna run first .Means ('run','create table') or ('get','select *  from some_Table') )  
 * @returns {Object | null}
 */
function databaseFunctionToPromise(...args){
    return new Promise((resolve,reject) => {
        this.database.serialize(() => {
            this.database[args[0]](...args.splice(1,args.length),(error,data) => {
                if(error){
                    console.log(error)
                    reject(error.message)
                }else{
                    resolve(data)
                }
            })
        })
    })
}


/**
 * converts a dataclass field into a table column text in sqlite3 
 * @param {Object} fieldObj 
 */
function convertFieldToColumn(name,fieldObj){
    return `${name} ${fieldObj.type} ${fieldObj.unique ? "UNIQUE" : ""}`
}


/**
 * Create a field compatible with both dataclass and sqlite database
 * @param {SQLite Type} type - Database type 
 * @param {Boolean} unique - whether the field is unique or not
 * @param {Boolean} nullable - whether the field is nullable or not  
 * @param {Array<ValidationFn>} validations - a list of validators
 * @param {MapFunc} beforeValidation - a map function to run before validation 
 * @param {*} afterValidation - a map function to run after validation
 * @param {*} metaData 
 * @returns 
 */
function createField(type,unique=false,nullable=false,validations=null,beforeValidation=null,afterValidation=null,metaData={relational:false}){
    let jsType = Number;
    switch(type){
        case types.DATE:
            jsType = Date
            break
        case types.BOOLEAN:
            jsType = Boolean
            break;
        case types.TEXT:
            jsType = String
            break;
    }
    return {type:jsType,sqlType:type,unique,nullable,validations,beforeValidation,afterValidation,...metaData}
}
/**
 * Create a relational field in the database
 * @param {DataClass} dClass - Data class as an argument 
 * @param {String} fieldName  - Name of the field in the database or _id
 * @param {Boolean} unique 
 * @param {Array<Func>} validations - validator functions 
 * @param {MapFunc} beforeValidation - a function to run before validation 
 * @param {MapFunc} afterValidation - a function to run after validation
 * @param {*} metaData 
 * @returns 
 */
function createRelationField(dClass,fieldName,unique,validations=[],beforeValidation=null,afterValidation=null,metaData={}){
    const tempInstance = new dClass()
    let type;
    if(fieldName == "_id"){
        type = types.TEXT
    }else{
        try{
            type = tempInstance[fieldName].sqlType
        }catch(error){
            if(error instanceof TypeError){
                throw new InvalidArgumentError("relational field name must be in data class.Only property you can give without declaring it in the dataclass is the _id field name.")
            }
        }
    
    }
    const defaultOptions = createField(type,unique)
    return {...defaultOptions,validations:[SQLITE_VALIDATORS.RELATIONAL_DATABASE_VALIDATOR(tempInstance.getName(),fieldName),...validations],afterValidation,beforeValidation,relational:true,relationalTable:tempInstance.getName(),relationalField:fieldName}
}

// types that database can handle
const types = {
    INTEGER:"INTEGER",
    TEXT:"TEXT",
    BOOLEAN:"BOOLEAN",
    DATE:"DATE",
    REAL:"REAL",
    FLOAT:"NUMERIC"
}

// 
const DEFAULT_TABLE_CREATION = "_id TEXT NOT NULL UNIQUE, createdAt TEXT default current_timestamp, updatedAt TEXT default current_timestamp"
const  DEFAULT_COPYING_TABLE_COLUMNS = ["_id","createdAt","updatedAt"]
/**
 * turns the dataclass field into table created field in string version.(can use for creating table queries)
 * @param {String} name 
 * @param {Object} field 
 * @returns 
 */
function databaseFieldIntoQueryField(name,field){
    // console.log(name,field)
    return `${name} ${field.sqlType} ${field.unique ? "UNIQUE" : ""} ${!field.nullable ? "NOT NULL" : ""}`
}

// importing sqlite library
const sqlite = require("sqlite3").verbose()

/**
 * A class which handles the executions regards to sqlite database
 * This class can create tables,insert data,and many more.
 * But this should be used to handle things with sqlite database(not mysql)
 */
class SQLiteDatabase extends Database{

    database;
    currentTables = [];
    queries = []

    static instances = new Map()

    constructor(URL){
        super()
        this.URL = URL
    }

    /**
     * More like the constructor function
     * Initialize the connection between sqlite and the node js server
     * after running this function you are free to call any function (except this function again)
     */
    async connect(){
        // wait until the database connection is successful 

       this.database = await  new Promise((resolve,reject) => {
        const database = new  sqlite.Database(this.URL,function(error){
            if(error){
                // throw an error if we can't connect to the database
                reject(error.message)
            }else{
                // return the database connection if no error occurred
                resolve(database)
            }
        })
    })    

        Databases.connections[DATABASE_TYPES.SQLITE] = this
        // bind the databaseFunctionToPromise function to our existing database
        this.databaseFunctionToPromise = databaseFunctionToPromise.bind({database:this.database})
        // get the existing table names from the database
        this.existingTableNames = (await this.getTablesOfDatabase()).map(e => e['name'])
    }

    /**
     * Creates a table in the database to the class given
     * if the table is already created no errors will occur
     * @param {DataClass} dataClass 
     */
    async createTable(dataClass){
        //Initiate a empty data class from the given data class
        const dataClassInstance = new dataClass();
        // Create a factory and retrieve the fields
        // We can do it with data class too.But in this way we are to write less code 😉😉
        const {columns,relationalFields,manyToManyFields} = DataClass.getColumnsAndRelationFields(dataClass)
        // Get the user defined fields
        // That means we remove the `createdAt` and `updatedAt` fields since they are added by the our default table creation
        let userDefinedFields = columns
        // if the table dose not exist in the database 
        if( this.existingTableNames.indexOf(dataClassInstance.getName()) == -1){
            // create the template
            // first default table creation
            // console.log(dataClassInstance)
            // then add the user defined fields
            let tableTemplate = `CREATE TABLE "${dataClassInstance.getName()}" (${DEFAULT_TABLE_CREATION},${ userDefinedFields.map((e) => databaseFieldIntoQueryField(e,dataClassInstance[e])).join(",") },PRIMARY KEY ("_id") ${userDefinedFields.length == 0 ? '' : userDefinedFields.filter(e => dataClassInstance[e].isRelation && dataClassInstance[e].createColumn).map(e => ` FOREIGN KEY (${e}) REFERENCES ${dataClassToName(dataClassInstance[e].parentDataClass)}(${dataClassInstance[e].column}) ON DELETE ${dataClassInstance[e].onDeletion} `).join(",")}) `
            // run the table query and return it's response
            // console.log(tableTemplate)
            return this.databaseFunctionToPromise('run',tableTemplate)
            // console.log(tableTemplate)
        }
        // Otherwise return a common response like a constant String
        return "Table is already created";
    }

    /**
     * get the tables name like a list object
     * @returns {Array<Object>}
     */
    async getTablesOfDatabase(){
        // run the query to retrieve all the tables from the database
        return this.databaseFunctionToPromise('all',`SELECT name FROM sqlite_master WHERE type='table'`)
    }


    /**
     * Get detailed version of a table
     * @param {table} - name of the table you want to get details
     * @returns 
     */
    async getTableInfo(dataClass){
        // get all the details of the table
        return this.databaseFunctionToPromise('all',`PRAGMA table_info(${dataClassToName(dataClass)});`)
    }

    /**
     * Generate a new id for the a table new item
     * @param {table} - name of the table 
     * @returns {String}
     */
    async generateNewUniqueID(table){
        // generate a id
        const newID = uuid.v4()
        
        try{
            // check whether we have user with the same id
            const users = await this.databaseFunctionToPromise('get',`select * from ${table} where _id=?`,[newID])
            // if not return the id
            if(!users){
                return newID
            }else{
                // if we have one wait till generating a new one
                return (await this.generateNewUniqueID(table))
            }
        }catch(error){
            // if a error occurred throw an internal server error
            console.log(error)
            throw new InternalServerError("Internal server error")
        }
       
    }

    /**
     * Create a new object in the table with the given data
     * @param {String} table - name of the table 
     * @param {Object} data - data validated through data class 
     */
    async createObject(table,data){
        const tableName = dataClassToName(table)
        // generate a new id for the table
        const id = await this.generateNewUniqueID(tableName)
        // get the table columns through data object
        const keys = Object.keys(data)
        // console.log("Table Name Is ",table)
        // create the object in the database
         await this.databaseFunctionToPromise(`run`,`INSERT INTO ${tableName} (_id,${keys.join(",")}) VALUES (${"?,"+keys.map(e => "?").join(",")})`,[id,...keys.map(e => data[e])])
        //  get the new user from the database  with that id
       const newUser = await this.databaseFunctionToPromise('get',`SELECT * FROM ${tableName} where _id=?`,[id])
        // return the user    
       return newUser
    }

    /**
     * finds a object in the table
     * if the object is not to be found throw an  ModelWithIdNotFound error
     * @param {String} table - name of the table 
     * @param {String} id - id of the object
     * @returns {Object}
     */
    async findById(table,id){
        // first check whether given id is valid or not
        if(!uuid.validate(id)){
            // if it isn't valid throw an InvalidIdGive error
           throw new  InvalidIdGiven("Id isn't valid.")
        }
        // perform the query to get the user with the id
        const value = await this.databaseFunctionToPromise(`get`,`SELECT * FROM ${table} where _id=?`,[id])
        // if we can't find the object
        if(!value){
            // throw an error called ModelWithIdNotFound
            throw new ModelWithIdNotFound("Object with that could not be found/")
        }
        // Otherwise return the value
        return value;
    }


    /**
     * perform the a search with the query given
     * if the data to be found return the data 
     * @param {String | DataClass} table - name of the table
     * @param {Object} data - data that contains the query
     * @param {Number} limit - record limit
     * @param {Number} skip - how much to skip
     * @returns {Array<Object>}
     */
    async find(table,data=null,getOBJ=false,limit=10,skip=0){
        // console.log(table,"finding in this via data ", data)
        // get the query fields
        const parameters = Object.keys(data || {})
        // create a variable to store the response of the query
        let value;
        // initialize the query 
        let  query = `SELECT * FROM ${table} `
        // if the data is given
        if(data !=null){
            // add the where clause to the query
           query += ' where ' + parameters.map(e => `${e}=?`).join(" and ") + " "
            if(getOBJ){
                query += "limit " + limit + " offset " + skip
            }




            try{
               // console.log(query," formated by" ,parameters.map(e => data[e]))
                // perform the query with the where clause
                value = await this.databaseFunctionToPromise('all',query,parameters.map(e => data[e]))
                // console.log(value, "found something")
            }catch (e){
               console.log(e)
            }

        }else{
            if(getOBJ){
                query += "limit " + limit + " offset " + skip

            }
            // perform the query without anything
            // just get the data of the table
            value = await this.databaseFunctionToPromise('all',query)
        } 
        // return the response of the database
        return value;
    }


    /**
     * Update object data with the data given 
     * Object will be queried by the id of object and the table
     * @param {String} table - name of the table 
     * @param {String} id  - id of the object
     * @param {Object} data - fields and values you wanna update
     * @returns 
     */
    async updateById(table,id,data){
        // Get the columns we wanna update
        const keys = Object.keys(data)
        // write the update query 
        const updateQuery = `UPDATE ${table} SET ${keys.map(e => `${e}=?`).join(",")} WHERE _id=?;`
        // perform the query
        const response = await this.databaseFunctionToPromise('run',updateQuery,[...keys.map(e => data[e]),id])
        // refresh and get the object
        const object = await this.findById(table,id)
        // return the object
        return object
    }


    /**
     * Update object data with the data given
     * Object will be queried by the id of object and the table
     * @param {String} table - name of the table
     * @param {String} id  - id of the object
     * @param {Object} data - fields and values you wanna update
     * @returns
     */
    async update(table,query,data){
        // Get the columns we wanna update
        const keys = Object.keys(data)
        const queryKeys = Object.keys(query)
        // write the update query
        const updateQuery = `UPDATE ${table} SET ${keys.map(e => `${e}=?`).join(",")} WHERE ${queryKeys.map(e => `${e}=?`).join(",")} ;`
        // perform the query
        const response = await this.databaseFunctionToPromise('run',updateQuery,[...keys.map(e => data[e]),...queryKeys.map(e => query[e])])
        // refresh and get the object
        const object = await this.find(table,query,true)
        // return the object
        return object
    }

    /**
     * Delete an object of a table
     * Object id has to be given in order to delete the object
     * @param {String} table - name of the table 
     * @param {String} id - id of the object 
     * @returns {null}
     */
    async deleteByID(table,id){
        const query = `DELETE FROM ${table} WHERE _id=?`
        await this.databaseFunctionToPromise('run', query,[id])
        return null
    }

    async delete(table,query,returnLimit=10,returnSkip=0){
        const keys = Object.keys(query);
        const deletedObjects = await this.find(table,query,true,returnLimit,returnSkip);
        let queryStr = 'DELETE FROM ' + table + ' WHERE ' + keys.map(e => `${e}=?`).join(",") + " ;";
        await this.databaseFunctionToPromise(`run`,queryStr,[...keys.map(e => query[e])])
        return deletedObjects;
    }

    async runQuery(type,query,values){
            if(type === ACTION_TYPES.SELECT){
                const r = await this.databaseFunctionToPromise('all',query,values)
                return r;
            }
          await this.databaseFunctionToPromise('run',query,values)
        }

    /**
     * close the connection with the database 
     * @returns {null}
     */
    async close(){
        return new Promise((resolve,reject) => {
            this.database.close(function(error){
                resolve("closed")
            })
        })
    }






    /**
 * 
 * @param {SQLiteDatabase} db
 * @param {DataClass} dataClass 
 * @param {Map} newFieldsMap 
 * @param {Map} removeFieldsMap 
 * @param {Map} changedFieldsMap 
 */
    async migrate(dataClass){
    const tableName = dataClassToName(dataClass)

    const dbFields = new Map()
    const dataClassFields = new Map()
    const changedFields = new Map()
    const newFieldsSet = new Map()
    const removeFieldsSet = new Map()
    const createdTables = new Map()

    const databaseReturnedInfo =  (await this.getTableInfo(dataClass))

    databaseReturnedInfo.forEach(e => {
        const name = e['name']
        const isColumn =  name !== "_id" && name !== "createdAt" && name !== "updatedAt"
        if(isColumn){
            dbFields.set(name,e)
        }
    })

    const instance = new dataClass()
    const properties = DataClass.getOwnPropertyNames(instance)
    
    properties.forEach(e => {
            dataClassFields.set(e,instance[e])
    })


    for(const field of dataClassFields.keys()){
        if(!dbFields.has(field)){
            newFieldsSet.set(field,dataClassFields.get(field))
        }else{
            const dcField = dataClassFields.get(field)
            const dbField = dbFields.get(field)

            const typeChanged = dcField.sqlType !== dbField.type
            const nullableChanged = dcField.nullable !== (dbField.notnull === 0)

            if (typeChanged || nullableChanged){
                changedFields.set(field,{dbField,dcField,typeChanged,nullableChanged})
            }
            
            dbFields.delete(field)
        }
    }

    for(const field of dbFields.keys()){
        if(!dataClassFields.has(field)){
            removeFieldsSet.set(field,dbFields.get(field))
        }
    }



        for(const field of newFieldsSet.keys()){
            const info  = newFieldsSet.get(field)
            const defaultVal = info.defaultValue
            if ( (!info.nullable && !isValueValid(defaultVal))){
                console.error("Can't Add a not nullable field with non default value")
                return false
            }

            if (info.unique && isValueValid(defaultVal)){
                console.error("Field can't be unique and have a default value too")
                return false
            }
        
        }

        for(const field of changedFields.keys()){
            const info = changedFields.get(field)
            if(info.nullableChanged){
                if(!info.dcField.nullable && !isValueValid(info.dcField.defaultValue)){
                    console.error("Can't change null to not null if defaultValue not defined")
                    return false;
                }
            }

            if(info.typeChanged){
                console.error("Can't change types since copying data may cause errors.In order to do so you gonna have to change the database manually.And set the field type to the new type in the dataclass")
                return false;
            }
        }

        const onlyAddingField = (removeFieldsSet.size + changedFields.size === 0)
        if (onlyAddingField){
            

            for(let field of newFieldsSet.keys()){
                    const info = newFieldsSet.get(field)
                    const notNull = info.nullable ? '' :" NOT NULL "
                    const defaultValue = isValueValid(info.defaultValue) ? `DEFAULT ${info.defaultValue}` : ""
                    const unique = info.unique ? "UNIQUE" : ""
                    const addingColumnsTemplate = `ALTER TABLE ${tableName} ADD COLUMN ${field} ${info.sqlType} ${unique} ${notNull} ${defaultValue}`
                    try{
                            const responseData = await this.databaseFunctionToPromise('run',addingColumnsTemplate)
                            console.log(`Migrated : ADDED ${field} to ${tableName}`)
                    }catch (error){
                            console.error(`Migration failed : Could not add ${field} to ${tableName}`)
                            console.error(error)
                            return false
                    }
                }
            
        }else{
            const userDefinedFields = Array.from(dataClassFields.keys())
            let tableTemplate = `CREATE TABLE "tmp_${tableName}" (${DEFAULT_TABLE_CREATION},${ userDefinedFields.map((e) => databaseFieldIntoQueryField(e,instance[e])).join(",") },PRIMARY KEY ("_id")${this.hasRelationalFields(userDefinedFields,instance) ? ',' : ''}${this.hasRelationalFields(userDefinedFields,instance) ? userDefinedFields.filter(e => instance[e].relational).map(e => ` FOREIGN KEY (${e}) REFERENCES ${instance[e].relationalTable}(${instance[e].relationalField}) `).join(",") : ''}) `
            const copyingFields = [...DEFAULT_COPYING_TABLE_COLUMNS,...userDefinedFields.filter(e => !newFieldsSet.has(e))]
            let copyingDataTemplate = `INSERT INTO ${"tmp_"+tableName} (${copyingFields.join(",")}) SELECT ${copyingFields.join(",")} FROM ${tableName}`
            let tableDropTemplate = `DROP TABLE ${tableName}`
            let renameTemplate = `ALTER TABLE tmp_${tableName} RENAME TO ${tableName}`

            try{
                let response = await this.databaseFunctionToPromise('run',tableTemplate)
                console.log("MIGRATING: CREATING NEW DATABASE TABLE FOR COPYING DATA")
                response = await this.databaseFunctionToPromise('run',copyingDataTemplate)
                console.log("MIGRATING : COPIED THE DATA FROM THE TABLE "+tableName)
                response = await this.databaseFunctionToPromise('run',tableDropTemplate)
                console.log('MIGRATING : DROP THE CURRENT TABLE '+tableName)
                response = await this.databaseFunctionToPromise('run',renameTemplate)
                console.log(`MIGRATED : ${tableName} successfully updated `)
            }catch(error){
                console.error("Migration failed for " + tableName)
                console.error("You may need to manually drop tmp_" + tableName)
                console.error(error)
                return false
            }
        }

        return true;
    }


    hasRelationalFields(userDefinedFields, instance) {
        for(const userDefineField of userDefinedFields){
            if(instance[userDefineField].relational){
                return true;
            }
        }

        return false;
    }

    async createTables(...dataClasses){
        const creatableAtOnce = []
        let manyToManyTables = new Map()
        const createAfter = new Map()
        const tableCreated = new Map()

        for(const dataClass of dataClasses){
            if(!SQLiteDatabase.instances.get(dataClass)){
                SQLiteDatabase.instances.set(dataClass, new dataClass());
            }

            const instance = SQLiteDatabase.instances.get(dataClass);
            const {manyToManyFields,columns,relationalFields} = DataClass.getColumnsAndRelationFields(dataClass)
            const shouldTableCreateAfter = columns.filter(e => {
                return instance[e].isRelation
            }).map(e => instance[e].parentDataClass)

            manyToManyFields.forEach(e => {
                const column = instance[e]
                const table1_name = instance.getName()
                const table_2_name = dataClassToName(column.dataClass)
                const table_name = [table1_name,table_2_name].sort((a,b) => {
                    if(a > b) return 1;
                    return -1;
                }).join("_");
                if(!manyToManyTables.has(table_name)){
                    manyToManyTables.set(table_name,{classOne:dataClass,classTwo:column.dataClass})
                }
            })

            if(shouldTableCreateAfter.length > 0){
                createAfter.set(dataClass,shouldTableCreateAfter)
            }else{
                creatableAtOnce.push(dataClass)
            }
        }

        for(const dataClass of creatableAtOnce){
            await this.createTable(dataClass)
            console.log("Created : ",dataClass)
            tableCreated.set(dataClass,true)
        }

        let tablesToCreate = Array.from(createAfter.keys())
        const maximumIterations  = 100;
        let currentIteration = 0 ;
        while(tablesToCreate.length > 0){
            currentIteration++;

            for(const dataClass of tablesToCreate){
                let shouldCreateTable = true;
                for(const shouldHaveCreated of createAfter.get(dataClass)){
                    if(!tableCreated.has(shouldHaveCreated)){
                        shouldCreateTable = false;
                        break;
                    }
                }
                if(!shouldCreateTable){continue;}
                await this.createTable(dataClass)
                tableCreated.set(dataClass,true)
                tablesToCreate = tablesToCreate.filter(e => e !== dataClass)
            }



            if(currentIteration > 100){
                throw new Error("Could not create some tables may have other table connected with a foreign key while the other tables also may has a foreign key for the table without many to many")
            }


        }

        for(const tableName of manyToManyTables.keys()){
            await this._manyToManyTable(tableName,manyToManyTables.get(tableName))
            console.log("Created table: ",tableName)
        }

    }

    async _manyToManyTable(tableName,{classOne,classTwo}){
        const classOneName = dataClassToName(classOne)
        const classTwoName = dataClassToName(classTwo)
        const firstColumnName = `${classOneName}_id`
        const secondColumnName = `${classTwoName}_id`

        const template = `CREATE TABLE IF NOT EXISTS ${tableName}(${firstColumnName} TEXT NOT NULL , ${secondColumnName} TEXT NOT NULL , PRIMARY KEY (${firstColumnName} , ${secondColumnName} )  ,
FOREIGN KEY (${firstColumnName}) REFERENCES ${classOneName}(_id) ON DELETE CASCADE,
FOREIGN KEY (${secondColumnName}) REFERENCES ${classTwoName}(_id) ON DELETE CASCADE  )`
        return  this.runQuery('run',template)
    }


    async addRelation(classOne, classTwo, idOne, idTwo){
        const nameOne = dataClassToName(classOne)
        const nameTwo = dataClassToName(classTwo)
        const tableName = [nameOne, nameTwo].sort().join("_")
        const columnOne = `${nameOne}_id`
        const columnTwo = `${nameTwo}_id`
        const template = `INSERT INTO ${tableName} (${columnOne}, ${columnTwo}) VALUES (?, ?)`
        return this.databaseFunctionToPromise('run', template, [idOne, idTwo])
    }
}

module.exports = {createDatabase,SQLiteDatabase,types,createField,createRelationField}