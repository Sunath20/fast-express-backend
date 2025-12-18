// const { ERROR_CODES } = require("../routers/basic_crud");
const ERROR_CODES = {
    ID_NOT_FOUND : 1,
    ID_IS_INVALID: 2,
    INTERNAL_SERVER_ERROR:3
}
/**
 * send an internal server error response to the user
 * 
 * espcially when the database connection failing 
 * @param {Response} res 
 * @returns {Response}
 */
function sendInternalServerError(res){
    return res.status(500).send({'error':"Internal Server error occured.Please try again later.",'errorId':3})
}



/**
 * send data with status code 200
 * 
 * especially for get requests with simple data 
 * 
 * @param {Response} res - express Response Object
 * @param {Object} data - json like object
 * @returns 
 */
function sendGetItemsResponse(res,data){
    return res.status(200).send(data)
}


/**
 * a shortcut method for sending response for bad data request in data class
 * simply get the field and the error , send it to the user as a Object
 * @param {Express.Response} res 
 * @param {Object} validationResponse - Validation response of the data class object
 */
function sendErrorWithValidationErrorResponse(res,validationResponse){
    res.status(400).send({'error':validationResponse.data.error,'field':validationResponse.field})
}


/**
 * A shortcut function to send 404 error message
 * @param {Express.Response} res 
 */
function sendObjectWithQueryNotFoundErrorResponse(res,message=null){
    res.status(404).send({'error':message || "Object with that specification not found.Please check your inputs."})
}

/**
 * return a bad request response with 400 error message
 * @param {Express.Response} res 
 * @param {String} message 
 */
function sendBadRequest(res,message="The data given is invalid."){
    res.status(400).send(message)
}
module.exports = {sendInternalServerError,sendObjectWithQueryNotFoundErrorResponse,sendBadRequest,sendGetItemsResponse,sendErrorWithValidationErrorResponse}