const { DataClass } = require("fast-express-backend/dataclasses")


function getFromTable(TableName,...args){
    let t_name  = TableName

    if(TableName instanceof DataClass){
        t_name = (new TableName()).getName()
    }

    if(args.length === 1){
        return t_name + "."+ args[0]
    }

    return args.map(e => `${t_name}.${e}`)
}

module.exports = {
    getFromTable
}