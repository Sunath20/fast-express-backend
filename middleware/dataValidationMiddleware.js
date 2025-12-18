const { DataClassFactory } = require("../dataclasses/base");

/**
 * valiate data in request body with the data class valiation
 * if data is not okay we return the error given by the valiation function
 * 
 * @param {DataClassFactory} modelFactory 
 */
function modelDataValidationMiddleware(modelFactory){
    async function middleware(req,res){
        const object = modelFactory.createObject(req.body)
        // object.init(req.body);
        try{
            const response = await object.validate()
            if(response.data.okay){
                return;
            }else{
                return res.status(403).send(response)
            }
        }catch(error){
            return res.status(500).send("Internal Server Error")
        }   
    }

    return middleware
}

module.exports = {modelDataValidationMiddleware}