const {createMongoDBField} = require("./createFields")
const responses = require("./basic_returns")
const passwordHashing = require('./password_hashing')
const {removeFieldsAndReturnTheObject} = require("./removeFieldsAndGetTheObject")
const {functionToPromise} = require("./functionToPromise")
const checkTheObjectPromiseOrNot = require("./promiseChecking")
const {quickCheckOfRequiredFields} = require("./quickCheckOfRequiredFields")
const {findValueInObject} = require("./findValueInObjectTree")

module.exports = {createMongoDBField,
    ...responses,
    ...passwordHashing,
    removeFieldsAndReturnTheObject,
    functionToPromise,
    checkTheObjectPromiseOrNot,
    quickCheckOfRequiredFields,
    findValueInObject
}
