
const { Client } = require("pg")
const {Database} = require("./database")
const uuid = require('uuid')

const {dataClassToName} = require("../utils/dataclassToName")
const { DataClassFactory } = require("../dataclasses")
const { DATABASE_TYPES } = require(".")
const {DataClass} = require("../index");
const {query} = require("express");
const {isValueValid} = require("../utils/valueCheckings");
const {add} = require("nodemon/lib/rules");


const types = {
    "INTEGER":"BIGINT",
    "TEXT":"TEXT",
    "FLOAT":"DOUBLE PRECISION",
    "BOOLEAN":"BOOLEAN",
    "DATE":"DATE",
    "DATETIME":" TIMESTAMP WITH TIME ZONE "
}


/**
 * 
 * @param {*} type 
 * @param {*} unique 
 * @param {*} notNull 
 * @param {*} validators 
 * @param {*} before_validation 
 * @param {*} after_validation 
 * @param {*} metaData 
 * @returns 
 */
function createField(type,unique,notNull=true,validators=[],before_validation=null,after_validation=null,metaData={}){
    let data = {type:null}
    if(type == types.TEXT){
        data.type = String
    }else if(type == types.DATE){
        data.type = Date
    }else if(type == types.BOOLEAN){
        data.type = Boolean
    }else if(type == types.FLOAT || type == types.INTEGER){
        data.type = Number
    }

    return {...data,sqlType:type,unique,notNull,validators,before_validation,after_validation,metaData}
}

function createRelationalField(type,unique,notNull,relationalClass,relationalField,metaData={}){
    const basicObject = createField(type,unique,notNull)
    return {...basicObject,relationalClass,relationalField,metaData,relational:true}
}

function fieldToQueryString(name,field){
    return `${name} ${field.sqlType} ${field.notNull ? "NOT NULL" : ""}`
}

function relationFieldToString(name,field){
    const dataClass = field.parentDataClass
    const tableName = (new dataClass).getName()

    if(name === "_id"){
        return `CONSTRAINT fk_${tableName} FOREIGN KEY (${name}) REFERENCES ${tableName}(_id) ON DELETE  ${field.onDeletion}`
    }
    return `CONSTRAINT fk_${tableName} FOREIGN KEY (${name}) REFERENCES ${tableName}(_id) ON DELETE ${field.onDeletion}`
}

class PostgresDatabase  extends Database{


    constructor(){
        super()

    }



    async connect(host,user,password,database,port=5432,metaData){
        const client = new Client({host,user,password,database,port,...metaData})
        try{
            await client.connect()
            this.connection = client
        }catch(error){
            console.error(error)
            throw new Error("could not connect the database.")    
        }
        
        
    }

    async createTable(dataClass){
        const name = dataClassToName(dataClass)
        const instance = new dataClass()
        
        const {columns} = DataClass.getColumnsAndRelationFields(dataClass)
        const uniqueFields = columns.filter(e => instance[e].unique)
        const foreignKeys = columns.filter(e => instance[e]['isRelation'] && instance[e]['createColumn'])
        let tableTemplate = `CREATE TABLE IF NOT EXISTS ${name} (_id TEXT NOT NULL ,createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP ,updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,${columns.map(e => fieldToQueryString(e,instance[e])).join(",") }, ${uniqueFields.length > 0 ? `UNIQUE(${uniqueFields.join(",")}),`  : ""} PRIMARY KEY (_id) ${foreignKeys.length > 0 ?"," : ''} ${foreignKeys.map(e => relationFieldToString(e,instance[e] || null)).join(",")});`
        tableTemplate += `
CREATE OR REPLACE FUNCTION update_changetimestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedAt = now();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';



DROP TRIGGER IF EXISTS ${name}_update_updated_at ON ${name};
CREATE TRIGGER ${name}_update_updated_at
    BEFORE UPDATE ON ${name}
    FOR EACH ROW
    EXECUTE PROCEDURE update_changetimestamp_column(updateAt)        
`

    return await this.connection.query(tableTemplate)
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
        return  this.runQuery(template,[])
    }

    async createObject(dataClass,data){
        const name = dataClassToName(dataClass)
        const keys = ["_id",...Object.keys(data)]
        const query  = `INSERT INTO ${name} (${keys.join(",")}) VALUES (${keys.map((e,i) => `$${i+1}`).join(",")}) RETURNING *`
        const id = uuid.v4()
        data['_id'] = id
        const response = await this.connection.query(query,keys.map(e => data[e]))
        return response.rows;
    }


    async disconnect(){
        await this.connection.end();
    }


    async findById(table,id){
        const name = this.dataClassToName(table)
        const query = `SELECT * FROM ${name} WHERE _id=$1`
        return await this.connection.query(query,[id])
    }

    async find(table,query,getOBJ,limit=10,skip=0){
        const name = this.dataClassToName(table)
        let queryString = `SELECT  * FROM ${name} `
        if(query){
            const newPart =` WHERE ${Object.keys(query).map((e,i) => `${e}=$${i+1}`).join(" and ")} `
            queryString  = queryString + newPart;
        }
        queryString += `limit ${limit} offset ${skip}`

        let result = '';
        if(query){
            result =  (await this.connection.query(queryString,Object.keys(query).map(e => query[e]))).rows
        }else{
            result = (await this.connection.query(queryString)).rows
        }

        return result.length == 1 ? result[0] : result
    }

    async deleteByID(dataClass,id){
        const name = this.dataClassToName(dataClass)
        const queryString = `DELETE FROM ${name} WHERE _id=$1`
        return await this.connection.query(queryString,[id])
    }

    async updateById(dataClass,id,changes){
        const name = this.dataClassToName(dataClass)
        const queryString = `UPDATE ${name} SET ${Object.keys(changes).map((e,i) => `${e}=$${i+1}`).join(",")} WHERE _id=$${Object.keys(changes).length+1}`
        return await this.connection.query(queryString,[...Object.keys(changes).map(e => changes[e]),id])
    }

    async update(dataClass,query,payload){
        const name = this.dataClassToName(dataClass)
        const payloadKeyCount = Object.keys(payload).length;
        const filterString = Object.keys(query).map((e,i) => `${e}=$${i+1+payloadKeyCount}`).join(" AND ");
        const payloadString = Object.keys(payload).map((e,i) => `${e}=$${i+1}`).join(",")
        const queryString = `UPDATE ${name} SET ${payloadString} WHERE ${filterString} `
        const response = await this.connection.query(queryString,[...Object.values(payload),...Object.values(query)]).rows
        return response;
    }

    toString(){
        return "postgresql"
    }

    async delete(dClass,query,returnLimit=10,returnSkip=0){
        const objects = await this.find(dClass,query,true,returnLimit,returnSkip);
        const name = this.dataClassToName(dClass)
        const filterString = Object.keys(query).map((e,i) => `${e}=$${i+1}`).join(",");
        let queryString = `DELETE FROM ${name} where ${filterString}`
        await this.connection.query(queryString,[...Object.values(query)]);
        return objects;
    }

    /**
     * Get the table columns info
     * @param dataClass {DataClass}
     * @returns {Promise<void>}
     */
    async getTableInfo(dataClass){
        const name = dataClassToName(dataClass)
        const template = `SELECT column_name,data_type,is_nullable FROM information_schema.columns WHERE table_name = $1 AND column_name NOT IN ('_id','createdat','updatedat')`
        return this.runQuery(template,[name])
    }

    async runQuery(query,values){
       const r =  (await (this.connection.query(query,values))).rows;
       return r;
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
            dbFields.set(column['column_name'],column);
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
                const typeChanged = !stringComparison(dbColumn['data_type'],dcColumn['sqlType']);

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
            const updatingColumns = Array.from(changedColumns.entries()).map(([key,column]) => {
                const {dcColumn} = column
                const changedNullable = dcColumn.notNull ? " SET NOT NULL " : " DROP NOT NULL "
                let columnTemplate = `ALTER COLUMN ${key} ${changedNullable}`
                if(isValueValid(dcColumn.metaData?.defaultValue)){
                    const defaultValue = (types.TEXT ===  dcColumn.sqlType) ? `'${dcColumn.metaData?.defaultValue}'` : dcColumn.metaData?.defaultValue
                    return ` ${columnTemplate} , ALTER COLUMN ${key} SET DEFAULT ${defaultValue} `
                }


                return columnTemplate

            }).join(",")

            const template = `ALTER TABLE ${tableName} ${updatingColumns}`
            try{
                console.log("Update template ",template)
                const response = await this.runQuery(template,[])
                console.log(`MIGRATED: Updated ${Array.from(changedColumns.keys()).join(",")} columns in ${tableName}`)
            }catch(error){
                console.error(`MIGRATION FAILED: FAILED TO update columns in the ${tableName}`)
                console.log(error)
                return false;
            }
        }

        console.log(`MIGRATION COMPLETED: ${tableName} is fully migrated`)
        return true;
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
    const dbNullable = dbField['is_nullable'] === "NO"
    return dbNullable !== dcField['notNull']
}

module.exports = {PostgresDatabase,createField,types,createRelationalField}