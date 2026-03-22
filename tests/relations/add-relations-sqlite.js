const {DataClass,DataClassFactory} = require("../../dataclasses/base")
const {is_required, minLength} = require("../../dataclasses/validators");
const { createPasswordHashing } = require("../../utils/password_hashing");

const {SQLiteDatabase} = require("../../databases/sqlite3")
const {hasMany,belongsTo, manyToMany, ON_DELETE, hasOne} = require("../../databases/relations")
const {createPassword} = createPasswordHashing("d2nd2bhvdg2be2,, fmf 2fhvehv w ,3f3n,mf32dnm3ndm3  3 f")


const { createField, types } = require("../../databases/sqlite3");
const { isValueValid } = require("../../utils/valueCheckings");
const { dataClassToName } = require("../../utils/dataclassToName");
const {User} = require("../../docs/code/dataclass/dataclass_1");
const {SqliteQuery, ACTION_TYPES} = require("../../query/sqliteQuery");

class UserDataClass extends DataClass {
    username = createField(types.TEXT, false, false, [
        is_required("Username is required"),
        minLength(8, "Username must contain 8 letters")
    ])
    password = createField(types.REAL, false, false, [], null, createPassword,{defaultValue:"password"})

    messages = hasMany(Message)
    rooms = manyToMany(Room)


    getName(){return "users"}
}




class Message  extends DataClass {

    getName(){return "message"}

    text = createField(types.TEXT, false, false, [])

    userID = belongsTo(UserDataClass,"_id",false,ON_DELETE.CASCADE,types.TEXT)
}

class RoomProfile extends DataClass {
    profilePic = createField(types.TEXT, false, true, [])
    roomID = belongsTo(Room, "_id", true, ON_DELETE.CASCADE, types.TEXT)

    getName() { return "room_profile" }
}

class Room extends DataClass {
    name = createField(types.TEXT, false, false, [])
    users = manyToMany(UserDataClass)
    profile = hasOne(RoomProfile) // add this

    getName() { return "room" }
}


async function runner() {
    const db = new SQLiteDatabase("test_relations.db")
    await db.connect()
    await db.createTables(UserDataClass,Message,Room,RoomProfile)
    const response = await db.addRelation(UserDataClass,Room,'user-2','room-3')
    console.log(response)
    // await db.runQuery(ACTION_TYPES.INSERT, "INSERT INTO room_profile (_id, profilePic, roomID) VALUES (?, ?, ?)", ['prof-1', 'general.png', 'room-1'])
    // await db.runQuery(ACTION_TYPES.INSERT, "INSERT INTO room_profile (_id, profilePic, roomID) VALUES (?, ?, ?)", ['prof-2', 'gaming.png', 'room-2'])
    // await db.runQuery(ACTION_TYPES.INSERT, "INSERT INTO room_profile (_id, profilePic, roomID) VALUES (?, ?, ?)", ['prof-3', 'music.png', 'room-3'])
    // const sqliteQuery = new SqliteQuery(Room)
    // sqliteQuery.setActionType(ACTION_TYPES.SELECT);
    // sqliteQuery.setSelectingFields("*");
    // sqliteQuery.setTableName(Room);
    // sqliteQuery.preload("users.messages")
    // const output = await sqliteQuery.execute(db)
    // console.log(JSON.stringify(output,null,2))
    // console.log(await db.databaseFunctionToPromise('all', `PRAGMA foreign_key_list(message)`))
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