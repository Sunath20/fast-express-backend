
const argon2 = require("argon2")
const { InternalServerError } = require("../actions/errors")
const { InvalidArgumentError } = require("../errors")

let DEFAULT_SECURITY_KEY_MINIMUM_LENGTH = 20

/**
 * create two functions to encode an verify password 
 * security key is will be used in both functions
 * so make it a little bit strong
 * returns an object which has two attributes(functions actually)
 * one 'createPassword' which is a function takes a plain password and turn it into a hashed password
 * second 'verifyPassword' which is a function takes a hashed password and a plain password, returns true if they match otherwise false.
 * @param {String} securityKey 
 * @returns {Object}
 */
function createPasswordHashing(securityKey){
    if(typeof(securityKey) != "string"){
        throw new InvalidArgumentError("security key must be a string")
    }else if(securityKey.length < DEFAULT_SECURITY_KEY_MINIMUM_LENGTH){
        throw new InvalidArgumentError(`seuciry key must have ${DEFAULT_SECURITY_KEY_MINIMUM_LENGTH} charaters`)
    }

    /**
     * takes a string and hash it with the password given to the high order function(createPasswordHashing)
     * returns a string which is hashed by the argon3
     * @param {String} plainPassword 
     * @returns {String}
     */
    async function create(plainPassword){
        const newPassword = await argon2.hash(plainPassword)
        return newPassword
    }

    /**
     * verify the plain password and hashed password will match or not 
     * password will be security key given by the user
     * @param {String} hashedPassword 
     * @param {String} plainPassword 
     * @returns {Boolean}
     */
    async function verifyPassword(hashedPassword,plainPassword){
        try{
            return (await argon2.verify(hashedPassword,plainPassword))
        }catch(error){
            throw new InternalServerError("internal server error")
        }
        
       
    }

    return {createPassword:create,verifyPassword}
}


/**
 * takes a string and hash it with the password given to the high order function(createPasswordHashing)
 * returns a string which is hashed by the argon3
 * @param {String} plainPassword 
 * @returns {String}
 */
async function hashPassword(plainPassword){
    const newPassword = await argon2.hash(plainPassword)
    return newPassword
}

/**
 * verify the plain password and hashed password will match or not 
 * password will be security key given by the user
 * @param {String} hashedPassword 
 * @param {String} plainPassword 
 * @returns {Boolean}
 */
async function verifyHashedPassword(hashedPassword,plainPassword){
try{
    return (await argon2.verify(hashedPassword,plainPassword))
}catch(error){
    throw new InternalServerError("internal server error")
}


}

module.exports = {createPasswordHashing,createPasswordHashing,hashPassword,verifyHashedPassword}