const { getModelObjectWithId } = require("./getActions");


async function deleteObjectFromCollection(model,id){
    try{

        const modelExist = await getModelObjectWithId(model,id)
        const response = await model.deleteOne({_id:id})
        // console.log(response)
    }catch(error){
        throw error;
    }
}

async function deleteManyFromCollection(model,payload){
    await model.deleteMany(payload)
}

module.exports = {deleteObjectFromCollection,deleteManyFromCollection}