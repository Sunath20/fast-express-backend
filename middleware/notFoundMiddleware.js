const { Mongoose } = require("mongoose");
const { getModelObjectWithPayload, InternalServerError, ModelWithQueryNotFound } = require("../actions");

/**
 * Check a record available in the database with data provided in user request body
 * if a record did not found we return an 404 error
 * user can customize it to any kind of response error
 * @param {Mongoose.Model} model - model you want to run your query 
 * @param {Function} bodyFilter - a function that run through your data to make your query.(you can remove fields or add fields)
 * @param {Number} statusCode - status code when there's no object matching the query
 * @param {String} errorMSG  - erorr message when there's no object matching the query
 * @returns 
 */
function addNotFoundMiddleware(model,bodyFilter,statusCode,errorMSG) {

    async function middleware(req,res) {
        try{
            const response = await getModelObjectWithPayload(model,bodyFilter(req.body))
             req.headers.modelObject = response
             return null;
        }catch(error){
            // console.log(error)
            if(error instanceof InternalServerError){
                return res.status(500).send("internal server error")
            }else if(error instanceof ModelWithQueryNotFound){
                return res.status(statusCode).send(errorMSG)
            }
        }

        return null;

    }

    return middleware
    
}

module.exports = {addNotFoundMiddleware}