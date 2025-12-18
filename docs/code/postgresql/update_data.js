const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")

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
   const db  = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)
    console.log("Connected successfully")

    Databases.connections[DATABASE_TYPES.POSTGRES] = db;
    await db.createTable(User)
    console.log("Table created successfully")

    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.POSTGRES})
    const response = await userFactory.updateModelObject({username:"lol44lolv1"},{username:"lol44lol"})
    console.log(response)
    await db.disconnect()
}

module.exports = {runTest}
