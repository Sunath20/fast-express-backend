const { MongoDBDatabase, types, createField } = require("../../databases/mongodb")
const { DataClass } = require("../../dataclasses/base")
const { is_required } = require("../../dataclasses/validators")
const {Databases, DATABASE_TYPES} = require("../../databases");

class UserDataClass extends DataClass {
    username = createField(types.TEXT, false, [is_required("Username is required")])
    age = createField(types.NUMBER, false, [])
    score = createField(types.NUMBER,false,[],null,null,{defaultValue:10})
    getName(){ return "users" }
}

async function runner() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb+srv://lol:Fz9VAUxzuMsOj7fz@cluster0.tc7v1.mongodb.net/test-migrations?appName=Cluster0")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    // create some users
    await db.createObject(UserDataClass, {username: "john", age: 25})
    await db.createObject(UserDataClass, {username: "jane", age: 30})
    await db.createObject(UserDataClass, {username: "bob", age: 22})

    console.log("Users created")
    await db.migrate(UserDataClass)
}


runner().catch(console.error).finally(() => console.log("Done"))