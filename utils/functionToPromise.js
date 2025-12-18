
/**
 * A function turns into a promise
 * It has three arguments
 * resolve - promise resolve function
 * reject - promise reject function
 * value - value of the field
 * Especially made for validator function
 * @param {Function} func - A function which takes tree arguments (resolve,reject,value)
 * 
 * @example
 * function isValid(resolve,reject,value){
 *      if(value == null || value == undefined)return "this field is required"
 * };
 * const validator = functionToPromise(isValid);
 * const data = await validator(val);
 * console.log(data.okay)
 * 
 * @returns {Function} - In a shape of a validator function
 */
function  functionToPromise(func){
    return function(value){
        return new Promise((resolve,reject) => {
            return func(resolve,reject,value)
        })
    }
}

module.exports = {functionToPromise}