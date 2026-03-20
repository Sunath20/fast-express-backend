


const dataClassMapper = new Map()
function dataClassToName(dClass){
    if(!dataClassMapper.has(dClass)){
        const instance = new dClass()
        dataClassMapper.set(dClass,instance.getName())
    }
    return dataClassMapper.get(dClass)
}


const {DataClass} = require("../dataclasses")




module.exports = {dataClassToName}