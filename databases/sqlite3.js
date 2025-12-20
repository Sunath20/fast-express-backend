
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
    return {type:jsType,sqlType:type,unique,validations,beforeValidation,afterValidation,...metaData}
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

/**
 * turns the dataclass field into table created field in string version.(can use for creating table queries)
 * @param {String} name 
 * @param {Object} field 
 * @returns 
 */
function databaseFieldIntoQueryField(name,field){
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
        const allFields = DataClassFactory.createFactory(dataClass,{'DATABASE':DATABASE_TYPES.SQLITE}).getModelFields();
        // Get the user defined fields
        // That means we remove the `createdAt` and `updatedAt` fields since they are added by the our default table creation
        let userDefinedFields = allFields.splice(0,allFields.length-2)
        // if the table dose not exist in the database 
        if( this.existingTableNames.indexOf(dataClassInstance.getName()) == -1){
            // create the template
            // first default table creation
            // then add the user defined fields
            let tableTemplate = `CREATE TABLE "${dataClassInstance.getName()}" (${DEFAULT_TABLE_CREATION},${ userDefinedFields.map((e) => databaseFieldIntoQueryField(e,dataClassInstance[e])).join(",") },PRIMARY KEY ("_id") ${userDefinedFields.length == 0 ? '' : userDefinedFields.filter(e => dataClassInstance[e].relational).map(e => ` FOREIGN KEY (${e}) REFERENCES ${dataClassInstance[e].relationalTable}(${dataClassInstance[e].relationalField}) `).join(",")}) `
            // run the table query and return it's response
            // console.log(tableTemplate)
            return this.databaseFunctionToPromise('run',tableTemplate)
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
    async getTableInfo(table){
        // get all the details of the table
        return this.databaseFunctionToPromise('all',`PRAGMA table_info(${table});`)
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
        // generate a new id for the table
        const id = await this.generateNewUniqueID(table)
        // get the table columns through data object
        const keys = Object.keys(data)
        // console.log("Table Name Is ",table)
        // create the object in the database
         await this.databaseFunctionToPromise(`run`,`INSERT INTO ${table} (_id,${keys.join(",")}) VALUES (${"?,"+keys.map(e => "?").join(",")})`,[id,...keys.map(e => data[e])])
        //  get the new user from the database  with that id
       const newUser = await this.databaseFunctionToPromise('get',`SELECT * FROM ${table} where _id=?`,[id])
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
           query += ' where ' + parameters.map(e => `${e}=?`).join("and") + " "
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

}

module.exports = {createDatabase,SQLiteDatabase,types,createField,createRelationField}