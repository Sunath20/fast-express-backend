
/**
 * define the field with data provided.
 * shortcut method to define fields
 * @param {Type} type  - String,Boolean,Number 
 * @param {Boolean} unique  - wether the field is unique or not (default is false)
 * @param {Array<ValidationFunc>} validations - validation functions (default is empty list)
 * @param {MapFunc} beforeValidation - before validation function (default is null)
 * @param {MapFunc} afterValidation - after validation function (default is null)
 * @param {Object} metaData - an object which has meta data for mongoose model class
 * @returns 
 */
function createMongoDBField(type,unique=false,validations=null,beforeValidation=null,afterValidation=null,metaData={}){
    return {type,unique,validations,beforeValidation,afterValidation,...metaData}
}

module.exports = {createMongoDBField}