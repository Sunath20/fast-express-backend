const { Document } = require("mongoose");
const { ModelWithIdNotFound, InternalServerError } = require("./errors");
const {getModelObjectWithId} = require("./getActions")




/**
 * update a model with the payload
 * id , model , class factory and payload must be given
 * model object will be updated according to the payload
 * return null if no error ocurred
 * @param {String} id 
 * @param {Document} model 
 * @param {DataClassFactory} class Factory 
 * 
 * @returns {null} 
 */
async function updateTheModelWithTheId(id,model,classFactory,payload){
    // get the object if its exist
    // if an error thrown it's has to be handle by the high order function
    const obj = await getModelObjectWithId(model,id);
    await classFactory.getModel().updateOne({_id:id},payload)
    return null;
    
}

async function updateModelObjects(query,payload,model){
    await model.updateMany(query,payload)
}

module.exports = {updateTheModelWithTheId,updateModelObjects}