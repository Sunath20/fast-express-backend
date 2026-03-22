const {dataClassToName} = require("./dataclassToName");

function getManyToManyInfo(classOne, classTwo) {
    const nameOne = dataClassToName(classOne)
    const nameTwo = dataClassToName(classTwo)
    const tableName = [nameOne, nameTwo].sort().join("_")
    return {
        tableName,
        columnOne: `${nameOne}_id`,
        columnTwo: `${nameTwo}_id`
    }
}

module.exports = {getManyToManyInfo}