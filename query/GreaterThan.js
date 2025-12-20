const {DATABASE_TYPES} = require("../databases");

function greaterThanMongodb(fieldName,valueIndex){
    return {[fieldName]: {$gt: fieldName}};
}

function greaterMySql(fieldName,valueIndex){
    return `${fieldName}>?`
}

const GREATER_THAN_FUNCTIONS = {
   [DATABASE_TYPES.MYSQL] : greaterMySql
}

function greaterThan(value){
    return function (dbType,fieldName,valueIndex){
            const response = GREATER_THAN_FUNCTIONS[dbType](fieldName,valueIndex);
            return {value,queryString:response, valueIndex:valueIndex}
    }
}





module.exports = {greaterThan}