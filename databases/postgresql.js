
const { Client } = require("pg")
const {Database} = require("./database")
const uuid = require('uuid')

const {dataClassToName} = require("../utils/dataclassToName")
const { DataClassFactory } = require("../dataclasses")
const { DATABASE_TYPES } = require(".")


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
        data.type == Number
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

    const dataClass = field.relationalClass
    const tableName = (new dataClass).getName()

    if(name == "_id"){
        return `CONSTRAINT fk_${tableName} FOREIGN KEY (${name}) REFERENCES ${tableName} (${field.relationalField}) `  
    }
    return `CONSTRAINT fk_${tableName} FOREIGN KEY (${name}) REFERENCES ${tableName} (${field.relationalField}) `
}

class PostgresDatabase  extends Database{


    constructor(){
        super()
        this.dataClassToName = dataClassToName.bind({})
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
        const name = this.dataClassToName(dataClass)
        const instance = new dataClass()
        
        const keys = DataClassFactory.createFactory(dataClass,{'DATABASE':DATABASE_TYPES.POSTGRES}).getModelFieldsExpect(['_id','createdAt','updatedAt'])
        const uniqueFields = keys.filter(e => instance[e].unique)
        const foreignKeys = keys.filter(e => instance[e]['relational'])
        let tableTemplate = `CREATE TABLE IF NOT EXISTS ${name} (_id TEXT NOT NULL ,createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP ,updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,${keys.map(e => fieldToQueryString(e,instance[e])).join(",") }, ${uniqueFields.length > 0 ? `UNIQUE(${uniqueFields.join(",")}),`  : ""} PRIMARY KEY (_id) ${foreignKeys.length > 0 ?"," : ''} ${foreignKeys.map(e => relationFieldToString(e,instance[e] || null)).join(",")});`
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


    async createObject(dataClass,data){
        const name = this.dataClassToName(dataClass)
        const keys = ["_id",...DataClassFactory.createFactory(dataClass,{'DATABASE':DATABASE_TYPES.POSTGRES}).getModelFieldsExpect(['createdAt','updatedAt'])]
        const query  = `INSERT INTO ${name} (${keys.join(",")}) VALUES (${keys.map((e,i) => `$${i+1}`).join(",")}) RETURNING *`
        const id = await uuid.v4()
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

    async runQuery(query,values){
       const r =  (await (this.connection.query(query,values))).rows;
       return r;
    }
}

module.exports = {PostgresDatabase,createField,types,createRelationalField}