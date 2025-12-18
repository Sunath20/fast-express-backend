const { default: mongoose } = require("mongoose");
const { Database } = require("./database");

const {getModelObjectWithId, getModelObjectWithPayload,updateModelObjects,updateTheModelWithTheId, deleteObjectFromCollection, addNewObjectToCollection, ModelWithQueryNotFound} = require("../actions");
const { DataClassFactory } = require("../dataclasses");
const {createMongoDBField} = require("../utils");
const { DATABASE_TYPES } = require(".");
const {deleteManyFromCollection} = require("../actions/deleteActions");

// Data classes models will be saved here
const savedClasses = {}

/**
 * converts data class into the mongoose model
 * Also does little a bit of caching the mongoose model
 * @param {DataClass} dataClass 
 * @returns 
 */
function dataClassToModel(dataClass){
    // create a new empty instance 
    const name = (new dataClass()).getName()
    // check if we have already have one
    // if we don't have one
    if(!savedClasses[name]){
        // create the model
        const model = DataClassFactory.createFactory(dataClass,{'DATABASE':DATABASE_TYPES.MONGODB}).getModel()
        // save it in our class
        savedClasses[name] = model
        // returns it
        return model
    }
    // returns right away if we have the model
    return savedClasses[name]
}

/**
 * Database representation for MongoDb
 * Just like all the classes most method will be similar.
 * But since mongodb is well connected with javascript we need less method do most things
 */
class MongoDBDatabase extends Database {



    /**
     * Connect the mongodb database with the given url
     * @param {String} url - url for the mongodb database 
     */
    async connect(url){
        await mongoose.connect(url)
    }


    /**
     * Disconnect the connection
     * @returns {Promise<void>}
     */
    async disconnect(){
        await mongoose.connection.close()
    }

    /**
     * Find an object in a collection (data class saved objects) with the given id
     * @param {DataClass} dClass - Dataclass 
     * @param {String} id - id of a object
     * @returns {Object | null}
     */
    async findById(dClass,id){
        return getModelObjectWithId(dataClassToModel(dClass),id)
    }

    /**
     * perform the query with many fields.
     * @param {DataClass} dClass - Dataclass 
     * @param {Object} query - field you wanna query 
     * @returns {Array<Object> | null}
     */
    async find(dClass,query,getOBJ,limit=10,skip=0,throwError=false){
    
        const model = dataClassToModel(dClass)
        const response = await model.find(query,null,{limit,skip})
        if(response && response.length === 1){return response[0]}
        return response
    }

    /**
     * Update an object in a collection 
     * Object will be chosen with the id 
     * @param {DataClass} dClass - Data class 
     * @param {String} id -  id of the object 
     * @param {Object} data - data you wanna update 
     * @returns 
     */
    async updateById(dClass,id,data){
        return updateTheModelWithTheId(id,dataClassToModel(dClass),DataClassFactory.createFactory(dClass),data)
    }

    async update(dclass,query,payload){
        return await updateModelObjects(query,payload,dataClassToModel(dclass))
    }



    /**
     * Delete an object with the given id
     * @param {DataClass} dClass 
     * @param {String} id - id of the object 
     * @returns 
     */
    async deleteByID(dClass,id){
        return deleteObjectFromCollection(dataClassToModel(dClass),id)
    }


    async delete(dClass,query,returnLimit,returnSkip){
          const users=   await this.find(dClass,query,returnLimit,returnSkip)
           await deleteManyFromCollection(dataClassToModel(dClass),query)
        return users
    }

    /**
     * Create an object in the data class
     * @param {DataClass} dClass - DataClass 
     * @param {Object} data - data for the object
     * @returns 
     */
    async createObject(dClass,data){
        return await addNewObjectToCollection(dataClassToModel(dClass),data)
    }

    toString(){
        return "mongodb"
    }

}

const types = {
    BOOLEAN:Boolean,
    TEXT:String,
    NUMBER:Number,
    DATE:Date
}

module.exports = {types,createField:createMongoDBField,MongoDBDatabase}