
const {Model} = require("mongoose")

/**
 * Usually called when the post request happens
 * basically create the object and save it
 * then return the object given by the mongodb
 * @param {Model} model
 * @param {Object} validatedData 
 * @returns {Promise<Object>}
 */
async function addNewObjectToCollection(model,validatedData){
    try{

        // create the object
        const modelObject = model(validatedData)
        // wait until it saved
        return await modelObject.save();
    }catch(error){
        throw error
    }
    
}

module.exports = {addNewObjectToCollection}