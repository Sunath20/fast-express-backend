



function dataClassToName(dClass){
    if(!this[dClass]){
        const instance = new dClass()
        this[dClass] = instance.getName()
    }
    return this[dClass]
}


const {DataClass} = require("../dataclasses")




module.exports = {dataClassToName}