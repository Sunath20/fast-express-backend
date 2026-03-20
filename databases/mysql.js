// import the libraries
const mysql = require("mysql2")
const { Database } = require("./database")
const {functionToPromise} = require("../utils")
const uuid = require("uuid")
const {DataClass,DataClassFactory}= require("../dataclasses")
const { ModelWithIdNotFound, InternalServerError } = require("../actions")
const { DATABASE_TYPES } = require(".")
const {dataClassToName} = require("../utils/dataclassToName");
const {isValueValid} = require("../utils/valueCheckings");

/**
 * Turns the database callback function into a promise
 * Especially can be used to do things async
 * @param {MysqlConnection} connection - connection to mysql database
 * @param {String} queryString - query you want to perform
 * @param {Array<object>} values - a list of parameter values if parameters exist
 * @returns 
 */
function queryToPromise(connection,queryString,values=null){
    return new Promise (( resolve,reject) => 
    {
        connection.query(queryString,values ? values : null,function(error,result){
        if(error){
            reject(error)
        }
        resolve(result)
        
    }
    )})
}

/**
 * Validators that are unique to mysql
 */
const MY_SQL_VALIDATORS = {
    /**
     * Creates a validator to limit the maximum number of characters the field can take
     * @param {Number} maxValue - Max number of characters the string can hold
     * @param {String} error - error you want to return to the user
     * @returns 
     */
    VARCHAR_MAX_VALIDATOR(maxValue,error="This field exceeds the number of characters it can have"){
        function validator(resolve,reject,value){
            if(value.length >= maxValue){
                reject({okay:false,error})
            }
        }

        return functionToPromise(validator)
    }
}

// Define the types
const types = {
    VARCHAR:"VARCHAR",
    TEXT:"TEXT",
    LONG_TEXT:"LONG_TEXT",
    INT:"INT",
    FLOAT:"FLOAT",
    DOUBLE:"DOUBLE",
    BOOLEAN:"BOOLEAN",
    DATE_TIME:"DATETIME"
}

/**
 * Create a data class field and at the same time make it compatible with mysql database
 * @param {sql.type} type  - a type in mysql 
 * @param {Boolean} unique - whether the field should be unique or not
 * @param {Boolean} notNull  - whether the field should be not nullable or not
 * @param {Array<Func>} validators - a list of validator functions
 * @param {Function} before_validation - runs before validations 
 * @param {Function} after_validation - runs after validations
 * @param {Object} metaData - meta data for the field
 * @returns 
 */
function createField(type,unique,notNull=true,validators=[],before_validation=null,after_validation=null,metaData={}){
    if(type == types.VARCHAR){
        return createVARCHARField(unique,notNull,validators,before_validation,after_validation,metaData)
    }else if(type == types.TEXT || types.LONG_TEXT == type){
        return {type:String,notNull,sqlType:type,unique,validators,before_validation,after_validation,metaData}
    }else if(type == types.INT || type == types.FLOAT || type == types.DOUBLE){
        return {type:Number,notNull,sqlType:type,unique,validators,before_validation,after_validation,metaData}
    }else if(type == types.BOOLEAN){
        return {type:Boolean,notNull,sqlType:type,unique,validators,before_validation,after_validation,metaData}
    }else{
        return {type:Date,notNull,sqlType:type,unique,validators,before_validation,after_validation,metaData}
    }
}

/**
 * A especial function for the creating of varchar field
 * @param {Boolean} unique 
 * @param {Boolean} notNull 
 * @param {Array<function>} validators 
 * @param {Function} before_validation 
 * @param {Function} after_validation 
 * @param {Object} metaData 
 * @returns 
 */
function createVARCHARField(unique,notNull=true,validators=[],before_validation=null,after_validation=null,metaData={'max':65000,maxCharactersError:"This field exceeds the number of characters it should have"}){
    return {type:String,notNull,sqlType:`VARCHAR(${metaData['max']})`,unique,validators:[MY_SQL_VALIDATORS.VARCHAR_MAX_VALIDATOR(metaData['max'],metaData['maxCharactersError']),...validators],before_validation,after_validation}
}

/**
 * Turns the data class field into a table field
 * the query string for creating specific field will be return
 * @param {String} name - name of the field
 * @param {Object} data  - data class attributes
 * @returns 
 */
function createFieldQuery(name,data){
   console.log(data)
    return `${name} ${data.sqlType == "VARCHAR" ? "VARCHAR("+data.metaData['max']+")" : data.sqlType} ${data.unique ? "UNIQUE" : ""} ${data.notNull ? "NOT NULL" : ""} `
}

const cachedDataClassNames = {}
/**
 * get the name from the data class
 * made for less typing
 * @param {DataClass} dataClass 
 * @returns 
 */
function getNamesFromDataClasses(dataClass){
    if(!cachedDataClassNames[dataClass]){
        cachedDataClassNames[dataClass] =  (new dataClass()).getName()
    }
    return cachedDataClassNames[dataClass]
}

/**
 * Database representation for the mysql
 */
class MySqlDatabase extends Database{

    /**
     * Initialize the database connection with the server
     * @param {String} database - name of the database
     * @param {String} user - name of the user
     * @param {String} password  - password of the user
     * @param {String} host  - host of the server
     * @param {Number} port  - port number
     * @param {*} metaData 
     */
    async connect(database,user,password,host,port=null,metaData={}){
        // initialize the connection using "mysql2" library
        this.connection = mysql.createConnection({user,password,database,host,...metaData})
        // wait till the callback of the connection establishment
         await new Promise( (resolve,reject) => {
            // run the connect function
            this.connection.connect((error) => {
                if(error){
                    // if an error happens log it and throw the error via promise reject callback
                    console.error(error)
                    reject(error)
                }else{
                    // otherwise resolve with a god response 😁
                    resolve("Database connected")
                }
            })
         }) 
    }

    async onConnectViaURL(url){
        // initialize the connection using "mysql2" library
        this.connection = mysql.createConnection(url)
        // wait till the callback of the connection establishment
        await new Promise( (resolve,reject) => {
            // run the connect function
            this.connection.connect((error) => {
                if(error){
                    // if an error happens log it and throw the error via promise reject callback
                    console.error(error)
                    reject(error)
                }else{
                    // otherwise resolve with a god response 😁
                    resolve("Database connected")
                }
            })
        })
    }

    /**
     * Creates the table in the database
     * Data class will be turn into a table and save a table in the database
     * @param {DataClass} dataClass 
     */
    async createTable(dataClass){
        // create a new instance grab data
        const instance = new dataClass()
        // get the name of the table
        const tableName = instance.getName()

        // Get the user defined fields
        // That means we remove the `createdAt` and `updatedAt` fields since they are added by the our default table creation
        let {columns,relationalFields,manyToManyFields} = DataClass.getColumnsAndRelationFields(dataClass)
        const foreignFields = columns.filter(e => instance[e].isRelation && instance[e].createColumn).map(e => {
            const parentClass = instance[e].parentDataClass
            const parentTableName  = dataClassToName(parentClass)
            return ` FOREIGN KEY (${e}) REFERENCES ${parentTableName}(${instance[e].column}) ON DELETE ${instance[e].onDeletion} `
        }).join(",") || ""
        // create the template
        let tableTemplate = `CREATE TABLE IF NOT EXISTS \`${tableName}\` (_id VARCHAR(250) UNIQUE NOT NULL, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, ${columns.map(e => createFieldQuery(e,instance[e])).join(",") } ,PRIMARY KEY(\`_id\`) ${foreignFields && ","+foreignFields}  ) ENGINE=InnoDB`
        // wait till the table creation is done
        console.log(tableTemplate)
        await queryToPromise(this.connection,tableTemplate)
    }

    /**
     * Create an object in the table (regards to the data class table)
     * @param {DataClass} dClass - Data Class
     * @param {Object} data - validated data
     * @returns 
     */
    async createObject(dClass,data){
        // get the class name from a helper function
        const className = getNamesFromDataClasses(dClass)
        // get the keys from the data class
        const dataKeys = Object.keys(data)
        // generate a new id
        const id = uuid.v4()
        // define the insert query
        let tableTemplate = `INSERT INTO ${className} (${["_id",...dataKeys].join(",")}) VALUES (${["id",...dataKeys].map(e => "?").join(",")})`
        // wait till the saving is done
        const response = await queryToPromise(this.connection,tableTemplate,[id,...(dataKeys.map(e => data[e]))])
        // refresh the object via our friendly method and return the created object
        return this.findById(dClass,id)
    }

    /**
     * Finds an object in a table using it's id
     * @param {DataClass} dClass - Data class 
     * @param {String} id - id of the object
     * @returns {Object}
     */
    async findById(dClass,id){
        try{
            // since mysql send a list of objects even when we want single one they send a list
           const object = await queryToPromise(this.connection,`SELECT * FROM ${getNamesFromDataClasses(dClass)} where _id='${id}'`)
            // if the object length is zero , it means sql query did not found any object with that id
            if(object.length == 0){ 
                throw new ModelWithIdNotFound(`${getNamesFromDataClasses(dClass)} does not have a object with the given id`)
            }else{
                // otherwise we send the first object in the list
                // since there can be only one object with that id as long as the id is unique
                return object[0]
            }
        }catch(error){
           if(error instanceof ModelWithIdNotFound){
                throw error
           }
            // if an error happens we just throw an error 
            throw new InternalServerError("Could not perform the query.An error happened.")
        }
       
    }

    /**
     * Update an object in the table
     * id must be specify to update 
     * @param {DataClass} dClass - 
     * @param {String} id  - id of the object
     * @param {Object} data - data you want to change
     * @returns 
     */
    async updateById(dClass,id,data){
        
        try{
            // get the object from the database
            // this will automatically throw 404 error if the object isn't there 😉😉
            const object = await this.findById(dClass,id)
            // get the field that has we need to update
            const keys = Object.keys(data)
            // get the table
            const tableName = getNamesFromDataClasses(dClass)
            // all right . It's time to create the query
            const query = `UPDATE ${tableName} SET ${keys.map(e => `${e}=?`).join(",")} where _id='${id}'`
            // runs the query
            return await queryToPromise(this.connection,query,[keys.map(e => data[e])])
        }catch(error){
            // id does not match throw the same error
            if(error instanceof ModelWithIdNotFound){
                throw error
            }
            // otherwise throw the common error InternalSeverError 🤣🤣😂
            throw new InternalServerError("Could not perform the query well.")
        }
    }



    async update(dClass,query,payload,limit=10,skip=0){

        try{
            const keys = Object.keys(payload)
            // get the table
            const tableName = getNamesFromDataClasses(dClass)
            // all right . It's time to create the query
            const queryString = Object.keys(query).map(e => `${e}=?`).join(",")
            const queryScheme = `UPDATE ${tableName} SET ${keys.map(e => `${e}=?`).join(",")} where ${queryString}`
            // runs the query
            return await queryToPromise(this.connection,queryScheme,[...Object.values(payload),...Object.values(query)])
        }catch(error){
            console.log(error)
            // id does not match throw the same error
            if(error instanceof ModelWithIdNotFound){
                throw error
            }
            // otherwise throw the common error InternalSeverError 🤣🤣😂
            throw new InternalServerError("Could not perform the query well.")
        }
    }

    /**
     * Delete an object from the table
     * @param {DataClass} dataClass  - 
     * @param {String} id  - id of the object
     * @returns 
     */
    async deleteByID(dataClass,id){
        try{
            // get the object
            // it will automatically throw the 404 error if the object does not appear
            const model = await this.findById(dataClass,id)
            // return the response of delete query .of course it will be null or undefined 😂😂😂
            return await queryToPromise(this.connection,`DELETE FROM ${getNamesFromDataClasses(dataClass)} where _id='${id}'`)
        }catch(error){
            // send the model with id not found if error is that
            if(error instanceof ModelWithIdNotFound){
                throw error
            }
            console.error(error)
            // otherwise send the common error saying internal server error
            throw new InternalServerError("Delete query could not perform")
           
        }
    }

    async delete(dClass,query,returnLimit=10,returnSkip=0){
        const limitConstraints = `limit ${returnLimit} offset ${returnSkip}`
        const filterString = Object.keys(query).map(e => `${e}=?`).join(",")
        const name = getNamesFromDataClasses(dClass);
        const queryScheme = `DELETE FROM ${name} where ${filterString}`
        const objects = await this.find(dClass,query,true,returnLimit,returnSkip);
        const response = await queryToPromise(this.connection,queryScheme,[...Object.values(query)])
        return objects;
    }


    async find(dClass,query,getOBJ,limit=10,skip=0){
        let objects;
        const tName =getNamesFromDataClasses(dClass);
        const limitSkipConstraints = `limit ${limit} offset ${skip}`;
        if(query){
            const queryString = Object.keys(query).map(e => `${e}=?`);
            objects =  await queryToPromise(this.connection,`SELECT * FROM ${tName} where ${queryString} ${limitSkipConstraints}`,Object.keys(query).map(e => query[e]))
        }else{
            objects = await queryToPromise(this.connection,`SELECT * FROM ${tName} ${limitSkipConstraints}`)
        }

        return objects.length === 1 ? objects[0] : objects

    }

    toString(){
        return "mysql"
    }

    async runQuery(query,values){
        const response = await queryToPromise(this.connection,query,values)
        return response;
    }


    async getTableInfo(dataClass){
        const name = getNamesFromDataClasses(dataClass)
        const template = `SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = ?
        AND table_schema = DATABASE()
        AND column_name NOT IN ('_id', 'createdat', 'updatedat')`
        return this.runQuery(template, [name])
    }



    /**
     *
     * @param dataClass  {DataClass}
     * @returns {Promise<void>}
     */
    async migrate(dataClass){
        const tableInfo = await this.getTableInfo(dataClass)
        const tableName = dataClassToName(dataClass)
        const instance = new dataClass()

        const dbFields = new Map()
        const dcFields = new Map()
        const newColumns = new Map()
        const removeColumns  = new Map()
        const changedColumns = new Map()

        for(const column of tableInfo){
            dbFields.set(column['COLUMN_NAME'],column);
        }

        DataClass.getOwnPropertyNames(instance).forEach((key)=>{
            dcFields.set(key,instance[key]);
        });

        for(const column of dcFields.keys()){
            const dcColumn = dcFields.get(column);
            if(!dbFields.has(column)){
                newColumns.set(column, dcColumn);
            }else{
                const dbColumn = dbFields.get(column)
                const nullableChanged = equalNullable(dbColumn,dcColumn);
                const typeChanged = !stringComparison(dbColumn['DATA_TYPE'],dcColumn['sqlType']);

                if(typeChanged){
                    console.error("Changing type may cause issues.So do it at database level.Then change the type here so it will work along.")
                    return false;
                }
                if(nullableChanged){
                    const metaData = dcColumn['metaData']
                    const validDefault = isValueValid(metaData['defaultValue'])
                    if( dcColumn.notNull &&  !validDefault){
                        console.error("Can't migrate if the field upgrate from null to not null without a default value")
                        return false;
                    }

                    if(dbColumn.unique && validDefault){
                        console.error("Can't migrate when the field is unique and have a default value.")
                        return false;
                    }


                    const noDefaultAllowed = ['TEXT', 'LONG_TEXT', 'BLOB', 'JSON']
                    if(noDefaultAllowed.includes(dcColumn.sqlType) && isValueValid(dcColumn.metaData?.defaultValue)){
                        console.error(`Can't set default value on ${dcColumn.sqlType} column '${column}' in MySQL`)
                        return false
                    }

                    changedColumns.set(column,{dbColumn,dcColumn,nullableChanged});
                }
                dbFields.delete(column);
            }
        }


        for(const column of dbFields.keys()){
            const value = dbFields.get(column);
            if(!dcFields.has(column)){
                removeColumns.set(column,value)
            }
        }

        if(newColumns.size > 0){
            const addingColumn = Array.from(newColumns.entries()).map(([key,column]) => {
                const notNull = column.notNull ? " NOT NULL " : ""
                const defaultValue = isValueValid(column.metaData?.defaultValue) ? `DEFAULT ${column.metaData.defaultValue}` : ""
                const unique = column.unique ? " UNIQUE " : ""
                return ` ADD COLUMN ${key} ${column.sqlType} ${unique} ${notNull} ${defaultValue}`
            }).join(",")

            const addingQuery = `ALTER TABLE ${tableName} ${addingColumn}`
            try{
                const response = await this.runQuery(addingQuery,[])
                console.log(`MIGRATED: Added New columns to the ${tableName}`)
            }catch(error){
                console.error(`MIGRATION FAILED: FAILED TO ADD NEW COLUMNS to the ${tableName}`)
                console.log(error)
                return false;
            }


        }

        if(removeColumns.size > 0){
            const removingColumns = Array.from(removeColumns.entries()).map(([key,column]) => {
                return ` DROP COLUMN ${key.toLowerCase()}`
            }).join(",")

            const template = `ALTER TABLE ${tableName} ${removingColumns}`
            try{
                const response = await this.runQuery(template,[])
                console.log(`MIGRATED: Removed ${Array.from(removeColumns.keys()).join(",")} columns from ${tableName}`)
            }catch(error){
                console.error(`MIGRATION FAILED: FAILED TO Remove columns to the ${tableName}`)
                console.log(error)
                return false;
            }
        }


        if(changedColumns.size > 0){
            const updatingNullables = []
            const updatingDefaultValues = []

                Array.from(changedColumns.entries()).forEach(([key,column]) => {
                const {dcColumn} = column
                const changedNullable = dcColumn.notNull ? `  NOT NULL ` : " NULL "
                let columnTemplate = `MODIFY COLUMN ${key}  ${dcColumn.sqlType}  ${changedNullable}`
                if(isValueValid(dcColumn.metaData?.defaultValue)){
                    const defaultValue = (types.TEXT ===  dcColumn.sqlType) ? `'${dcColumn.metaData?.defaultValue}'` : dcColumn.metaData?.defaultValue
                    updatingDefaultValues.push(` ALTER COLUMN ${key} SET DEFAULT ${defaultValue} `)
                }


                updatingNullables.push(columnTemplate)

            })

            const updateNullableQuery = `ALTER TABLE ${tableName} ${updatingNullables.join(",")}`
            try{
                const response = await this.runQuery(updateNullableQuery,[])
                console.log(`MIGRATED: Modified ${Array.from(changedColumns.keys()).join(",")} columns nullable  in ${tableName}`)
            }catch(error){
                console.error(`MIGRATION FAILED: FAILED TO update columns nullable in the ${tableName}`)
                console.log(error)
                return false;
            }

            if (updatingDefaultValues.length > 0){
                const updateDefaultValuesTemplate = `ALTER TABLE ${tableName} ${updatingDefaultValues.join(",")}`
                try{
                    const response = await this.runQuery(updateDefaultValuesTemplate,[])
                    console.log(`MIGRATING : UPDATED default values `)
                }catch(error){
                    console.error("MIGRATE FAILED : Could not update the default values")
                    console.log(error)
                }

            }
        }

        console.log(`MIGRATION COMPLETED: ${tableName} is fully migrated`)
        return true;
    }

    async createTables(...dataClasses){
        const creatableAtOnce = []
        let manyToManyTables = new Map()
        const createAfter = new Map()
        const tableCreated = new Map()

        for(const dataClass of dataClasses){

            const instance = new dataClass();
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

        const template = `CREATE TABLE IF NOT EXISTS ${tableName}(${firstColumnName} VARCHAR(250) NOT NULL , ${secondColumnName} VARCHAR(250) NOT NULL , PRIMARY KEY (${firstColumnName} , ${secondColumnName} )  ,
FOREIGN KEY (${firstColumnName}) REFERENCES ${classOneName}(_id) ON DELETE CASCADE,
FOREIGN KEY (${secondColumnName}) REFERENCES ${classTwoName}(_id) ON DELETE CASCADE  )`
        return  this.runQuery(template,[])
    }




}


/**
 * Since postgres put every string to lower case but sometimes YES NO for booleans
 * So this helper function put both strings to lower case
 * Them run the comparison
 * @param string1 {String}
 * @param string2 {String}
 */
function stringComparison(string1,string2){
    return string1.toLocaleLowerCase() === string2.toLocaleLowerCase()
}

function equalNullable(dbField,dcField){
    const dbNullable = dbField['IS_NULLABLE'] === "NO"
    return dbNullable !== dcField['notNull']
}


module.exports = {MySqlDatabase,types,createField}