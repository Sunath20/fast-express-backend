const {DataClass,DataClassFactory} = require("../../dataclasses/base")
const {is_required, minLength} = require("../../dataclasses/validators");
const { createPasswordHashing } = require("../../utils/password_hashing");

const {SQLiteDatabase} = require("../../databases/sqlite3")
const {hasMany,belongsTo, manyToMany, ON_DELETE} = require("../../databases/relations")
const {createPassword} = createPasswordHashing("d2nd2bhvdg2be2,, fmf 2fhvehv w ,3f3n,mf32dnm3ndm3  3 f")


const { createField, types, PostgresDatabase} = require("../../databases/postgresql");
const { isValueValid } = require("../../utils/valueCheckings");
const { dataClassToName } = require("../../utils/dataclassToName");
const {User} = require("../../docs/code/dataclass/dataclass_1");

class UserDataClass extends DataClass {
    username = createField(types.TEXT, false, false, [
        is_required("Username is required"),
        minLength(8, "Username must contain 8 letters")
    ])
    password = createField(types.TEXT, false, false, [], null, createPassword,{defaultValue:"password"})

    messages = hasMany(Message)
    rooms = manyToMany(Room)


    getName(){return "users_relations"}
}

class Message  extends DataClass {

    getName(){return "message_relations"}

    text = createField(types.TEXT, false, false, [])

    userID = belongsTo(UserDataClass,"_id",false,ON_DELETE.CASCADE,types.TEXT)
}

class Room extends DataClass {
    getName(){return "room_relations"}

    name = createField(types.TEXT, false, false, [])

    users = manyToMany(UserDataClass)
}



async function runner() {
    const db = new PostgresDatabase()
    await db.connect(
        "localhost",
        "postgres",
        "1234",
        "test-migrate",
        5432
    )
    await db.createTables(UserDataClass,Message,Room)
//     console.log(await db.getTableInfo(UserDataClass))
//     console.log(await db.getTableInfo(Message))
//     console.log(await db.getTableInfo(Room))
// // and the join table
//     console.log(await db.databaseFunctionToPromise('all', `PRAGMA table_info(room_users)`))
}


runner().then(e => {
    // console.log(e)
}).catch(e => {
    console.log(e)
}).finally(() => {
    console.log("This is the end")
})