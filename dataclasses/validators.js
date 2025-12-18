const { Model } = require("mongoose");
const { functionToPromise } = require("../utils/functionToPromise");

/**
 * A validator function which takes an error message
 * check weather the is field is given by the user
 * if the property is null or undefined throws the error message to the backend service
 * else continue to execute next validation
 * @param {String} errorMSG  : Error message when the field is empty
 * @returns {Promise}
 */
function isRequired(errorMSG){

    const requiredFunction = (resolve,reject,value ) => {
        if(value ==null || value == undefined)resolve({okay:false,error:errorMSG});
        resolve({okay:true});
    }
    return functionToPromise(requiredFunction)
}

/**
 * A function which validates the minimum length of a string is enough or not
 * @param {Number} length - minimum length of the string
 * @param {String} errorMsg  - error message you want to return
 * @returns {Promise}
 */
function minLength(length,errorMsg){
    function minLengthFunction(resolve,reject,value){
        if(value.length < length)resolve({okay:false,error:errorMsg})
        resolve({okay:true})
    }
    return functionToPromise(minLengthFunction)
}

/**
 * A function which validates the maximum length of a string 
 * @param {Number} length - minimum length of the string
 * @param {String} errorMsg  - error message you want to return
 * @returns {Promise}
 */
function maxLength(length,errorMsg){
    function maxLengthFunction(resolve,reject,value){
        if(value.length > length)resolve({okay:false,error:errorMsg})
        resolve({okay:true})
    }

    return functionToPromise(maxLengthFunction)
}


/**
 * A default function added by base class
 * Check if the class types and types of the data matches
 * if not return an error object just like every other one
 * @param {Type} type 
 * @param {String} field 
 * @returns {ValidatorFunc}
 */
function typeChecking(type,field){
    return functionToPromise((resolve,reject,value) => {
        // console.log(typeof(value) , type.name.toLowerCase())
        // Only when the type is Date
        if(type.name.toLowerCase() == "date"){
            dateTypeChecking(type,field,value,resolve)
        }
        if(typeof(value) == type.name.toLowerCase())resolve({okay:true})
        resolve({okay:false,error:`${field} must be a ${type.name}`})
    })
}

/**
 * a function to use in special occasion.
 * date type checking is something different than normal type checking
 * Since we recive dates in String we have to convert them into Date
 * then check weather that day is valid or not
 * that's what this function does
 * @param {Type} type 
 * @param {String} field 
 */
function dateTypeChecking(type,field,value,resolve,reject){
    const response = Date.parse(value)
    if(!response){
        resolve({okay:false,error:`${field} must be a date`})
    }

    resolve({okay:true})
}


/**
 * Validates the uniqueness of a field
 * @example
 * const validator = uniuqeValidator('username',userDataClass.model)
 * const data = await validator("your_name")
 * if(!data.okay){
 *  // already found a user in this name
 *  throw new Error() 
 * }else{
 *      // no user found
 *      return "okay"
 *  }
 * @param {String} field 
 * @param {Model} model 
 */
function unqiueValidator(field,model){

    function unique(resolve,reject,value){
   
        model.findOne({[field]:value}).then(e => {

            // console.log({[field]:value})
            // console.log(field,model,e)
            if(e){
                resolve({error:field+" is already used. try a different one",okay:false})
            }
            resolve({okay:true})
        }).catch(error => {
            // console.log("erro happned")
        })
    }

    return functionToPromise(unique)
        
}

module.exports = {is_required: isRequired,minLength,maxLength,typeChecking,unqiueValidator}