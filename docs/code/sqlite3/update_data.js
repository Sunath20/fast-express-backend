const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const {DataClass,validators,DataClassFactory} = require("fast-express-backend/dataclasses")
const {Databases,DATABASE_TYPES} = require("fast-express-backend/databases")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")]
    )

    password = createField(
        types.TEXT,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")]

    )

}

async function runTest() {
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    await db.createTable(User)

    Databases.connections[DATABASE_TYPES.SQLITE] = db;

    const userFactory = new DataClassFactory(User,{DATABASE:DATABASE_TYPES.SQLITE})
    const updatedUsers = await userFactory.updateModelObject({password:"crystal_is_good"},{password:"say my name"})
    console.log(updatedUsers)

    db.close()
}

module.exports = {runTest}