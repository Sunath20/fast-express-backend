const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")

const {ACTION_TYPES,MongodbQuery,LikePatterns,ORDER_DIRECTIONS} = require("fast-express-backend/query/mongodbQuery")

class User extends DataClass {


    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        [
            is_required("Username is required"),
            minLength(3,"Username must have 3 characters")
        ]
    )

    password = createField(
        types.TEXT,
        true,
        [
            is_required("Password is required"),
            minLength(8,"Password must have 8 characters")
        ]
    )


    birthday = createField(
        types.DATE,
        false
    )

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    
    const query = new MongodbQuery(User)
    query.setActionType(ACTION_TYPES.UPDATE)
    query.setUpdateValues({"username":"lol44lol"})

    query.equals('username','User01abc')

    const response = query.build()
    const r = await db.runQuery(ACTION_TYPES.UPDATE,response.query,response.values)
    console.log(r)
    await db.disconnect()
    process.exit(1)
}

module.exports = {runTest}