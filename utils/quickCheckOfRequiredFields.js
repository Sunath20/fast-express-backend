
/**
 * 
 * @param {Object} object 
 * @param {Array<String>} fields 
 */
function quickCheckOfRequiredFields(object,fields){
   // console.log(object,fields," this is quick check")
    const keys = Object.keys(object)
     const errorFields = fields.filter((e) => {
      // console.log(keys.indexOf(e) , keys.indexOf(e) == -1 , keys.indexOf(e) === -1)
      return keys.indexOf(e) == -1
   })

   // console.log(errorFields)
     if(errorFields.length >= 1){
        return errorFields[0]
     }
     return null;  
}


module.exports = {quickCheckOfRequiredFields}