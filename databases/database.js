
const mustBeDefinedBySubClassError = () =>  {throw new Error("This function has to be override by the sub class")}

class Database {
    connect(){mustBeDefinedBySubClassError()}
    createTable(){mustBeDefinedBySubClassError()}
    updateById(){mustBeDefinedBySubClassError()}
    deleteByID(){mustBeDefinedBySubClassError()}
    findById(){mustBeDefinedBySubClassError()}
    find(){mustBeDefinedBySubClassError()}
    saveQueries(){mustBeDefinedBySubClassError()}
    createObject(){mustBeDefinedBySubClassError()}
}

module.exports = {Database}