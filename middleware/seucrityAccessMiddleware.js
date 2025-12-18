const { InternalServerError } = require("../actions");
const { functionToPromise } = require("../utils/functionToPromise");
const {sign,verify, JsonWebTokenError,TokenExpiredError,VerifyError} = require("jsonwebtoken")


class CreateSecurityAccessTokenError extends Error{}
class SecurityKeyMustDefineError extends Error{}
class SecurityKeyLengthMustBeIncreased extends Error{}

const SECURITY_MINIMUM_LENGTH = 20

/**
 * This will create two function.
 * 1. create function -  to create token with expire date and payload
 * 2. validate function- can be run as a middleware to check access
 * @param {String} secret - secret of the token regarding the middleware 
 * @param {Function} securityAccessTokenValidation - validation function if you want to validate the data before the token creation done 
 * @param {Function} payloadDecodeValidation - when we recive the function run this function to check data is in the correct shape
 * @returns  [create,verify] - two functions First one create the token,second one veirfy the token
 */
function createSecurityAccessMiddleware(secret,securityAccessTokenValidation=(data) => null,payloadDecodeValidation=(data) => null){

    // if the secret isn't a string throw an error
    // also user secret must have 20 or more characters
    if(typeof(secret) != "string"){
        throw new SecurityKeyMustDefineError("security key must be given to create the token.")
    }else if(secret.length < SECURITY_MINIMUM_LENGTH){
        throw new SecurityKeyLengthMustBeIncreased(`seucrity key at least have ${SECURITY_MINIMUM_LENGTH} or many characters.`)
    }

    // token are created through this function
    // expire seconds can be changed
    /**
     * create the security token according to the data provided
     * secret will be the secret user pass to the high order function
     * when the token will expire must be define in seconds
     * @param {Object} data 
     * @param {Number} tokenexpiresInSecond 
     * @returns {String}
     */
    async function createSecurityAccessToken(data,tokenexpiresInSecond=60*60){
        // run the validation function
        const response = await securityAccessTokenValidation(data);
        // throw the error according to the response of error
        if(response instanceof InternalServerError){
            throw response;
        }
        if(response){
            const error = new CreateSecurityAccessTokenError(response);
            error.errorDetails = response
            throw error
        }

        // if no error ouccred then sign the token and return it
        const token = sign(data,secret,{
            expiresIn:tokenexpiresInSecond
        });
        return token;
    }

    /**
     * validate the security token given by the user
     * if we can't verify the token with the given secret we throw the error which is thrown by the jsob web token libary
     * @param {Express.Request} req 
     * @param {Express.Response} res 
     * @param {Express.Next} next 
     */
    async function validateSecurityAccessToken(req,res,next){
        // get the token
        const securityKey = req.headers.authorization
        // basic checks about the token
        if(!securityKey || typeof(securityKey) != "string"){
            // if the checks fail throw the error
            return res.status(400).send("security key must be defined and it should be a string")
        }
        const [tokenIdentifier,token] = securityKey.split("Bearer ")
        
        try{
            // veirfy the token
            const verfication = await verify(token,secret);
            req.verifyDetails = verfication
        }catch(error){
            // if it belongs to json web token we send the message given by them
                if(error instanceof JsonWebTokenError){
                    return res.status(400).send(error.message)
                }
                // otherwise we expect an internal server error to happen
                return res.status(500).send("internal server error")
        }

        // call next function
        if(next){
            next()
        }
        
    }


    return [createSecurityAccessToken,validateSecurityAccessToken]

}




class SecurityAccessMiddleware{


    constructor(secret,securityAccessTokenValidation=(data) => null,payloadDecodeValidation=(data) => null){
       const [create,decode] =  createSecurityAccessMiddleware(secret,securityAccessTokenValidation,payloadDecodeValidation)
        this.create = create
        this.decode = decode
    }

    // token are created through this function
    // expire seconds can be changed
    /**
     * create the security token according to the data provided
     * secret will be the secret user pass to the high order function
     * when the token will expire must be define in seconds
     * @param {Object} data 
     * @param {Number} tokenexpiresInSecond 
     * @returns {String}
     */
    createToken(data,tokenexpiresInSecond){
        return this.create(data,tokenexpiresInSecond)
    }

    decodeToken(token){
        return this.decode(token)
    }

}

module.exports = {createSecurityAccessMiddleware,CreateSecurityAccessTokenError,SecurityAccessMiddleware}