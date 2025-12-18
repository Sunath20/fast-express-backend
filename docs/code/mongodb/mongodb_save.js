const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")



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

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MONGODB})

    const data = {username:"Sam",password:"SamDontKnowThePassword"}
    const obj = await userFactory.createObject(data)
    const response = await obj.validate()
    console.log(response)
    if(response.data.okay){
        const updatedOBJ = await userFactory.createModelObject(data)
        console.log(updatedOBJ)
    }

    await db.disconnect()
    process.exit(1)
}

module.exports = {runTest}