const { createSecurityAccessMiddleware, SecurityAccessMiddleware } = require("./seucrityAccessMiddleware");
const {DataClassFactory: DataClassFactory} = require("./../dataclasses/base");
const { quickCheckOfRequiredFields } = require("../utils/quickCheckOfRequiredFields");
const { verifyHashedPassword } = require("../utils/password_hashing");



/**
 * A especial class to handle user bearer token, if the user want to use bearer token for security
 * this offers three methods to handle with user token
 * 
 * @function createUserToken - create new user token from the given payload
 * @function decodeUserToken  - decode the token 
 */
class UserBearerTokenHandler {

    constructor(classFactory,usernameField,passwordField,secret,passwordHashed=true,expireTime=60*60){
        this.classFactory = classFactory
        this.usernameField = usernameField
        this.passwordField = passwordField
        this.secret = secret
        this.passwordHashed = passwordField
        this.expireTime = expireTime

        // const [create,decode]  = createSecurityAccessMiddleware(secret)
        // this.create = create
        // this.decode = decode

        this.securityAccessMiddleware = new SecurityAccessMiddleware(secret)
    }

    async createUserToken(payload){
        return this.securityAccessMiddleware.createToken(payload,this.expireTime) 
    };


    decodeUserToken(){
        return this.securityAccessMiddleware.decode
    };

    async checkUserExist(req){
        let error = quickCheckOfRequiredFields(req.body,[this.usernameField,this.passwordField])
        if(error){
           return {error:`${error} is required`,'okay':false } 
        }
        const [username,password] = [req.body[this.usernameField],req.body[this.passwordField]];

       const user =  await this.classFactory.getModelWithPayload({[this.usernameField]:username})
        if(user){
           const passwordMatches = await verifyHashedPassword(user[this.passwordField],password)
           return {'okay':passwordMatches,error:passwordMatches ? null : "Invalid Credentials",user:passwordMatches ? JSON.parse(JSON.stringify(user)) : null};
        }

        return {'error':"no user found",'okay':false}
    }
}


module.exports = {UserBearerTokenHandler}