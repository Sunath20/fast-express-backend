const { DataClassFactory } = require("../dataclasses/subFactory")
const {UserDataClassFactory, UserDataClass} = require("./dataclassTest")

const userSubFactory =new  DataClassFactory(UserDataClassFactory.buildDataClassFromModel(['username','age']),UserDataClass)
const classInstance = userSubFactory.createObject()
// console.log(classInstance)
// console.log(userSubFactory.dataClass)
// console.log(classInstance.username)
// console.log(userSubFactory.dataClass.username)