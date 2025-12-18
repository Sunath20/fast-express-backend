const {SQLiteDatabase} = require("../databases/sqlite3")
const {Databases,DATABASE_TYPES, Tables} = require("../databases")
const {UserClass} = require("./dataclass")
const {DataClassFactory} = require("../dataclasses")



const DATABASE_PATH = process.cwd() + "\\play\\dataclass_test.db"


async function databaseDataRetrieve(users,data) {
    return (await users.getModelWithPayload(data));
}


const userPayloadTemplate = {
    'username':"lol44lol",
    'password':"lol44lol",
    'birthdate':new Date().toDateString()
}


async function runner(){
    const database = new SQLiteDatabase(DATABASE_PATH);
    await database.connect();
    Databases.connections[DATABASE_TYPES.SQLITE] = database;
    const users = new DataClassFactory(UserClass,{'DATABASE': DATABASE_TYPES.SQLITE});
    let user = await database.find(Tables.classes[UserClass], {"username": "hello world"})
    user = user[0]
    const updatedUser = await database.updateById(Tables.classes[UserClass],user['_id'],{'birthday':new Date().toLocaleTimeString()})
    // const response = await databaseDataRetrieve(users)
    console.log("Updated User ",updatedUser)
    database.close()
}

runner().then(e => {
    console.log(e)
}).catch(e => {
    console.error(e)
})