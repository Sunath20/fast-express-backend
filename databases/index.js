class Databases {
    static connections =  {};
}




const DATABASE_TYPES = {SQLITE:"SQLITE",MYSQL:"MYSQL",POSTGRES:"POSTGRES","SQLITE":"SQLITE","MONGODB":"MONGODB"}
const {Tables} = require("./Tables")


module.exports = {Databases,DATABASE_TYPES,Tables}