/**
 * change the object and return a new one
 * delete the fields user does not want to
 * @param {Object} object 
 * @param {Array<String>} removeFields 
 * @returns 
 */
function removeFieldsAndReturnTheObject(object,removeFields){
    const o = Object.assign({},object)
    for(let i = 0 ; i < removeFields.length;i++){
        delete o[removeFields[i]]
    }
    return o;
}

module.exports = {removeFieldsAndReturnTheObject}