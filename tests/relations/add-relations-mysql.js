const {DataClass,DataClassFactory} = require("../../dataclasses/base")
const {is_required, minLength} = require("../../dataclasses/validators");
const { createPasswordHashing } = require("../../utils/password_hashing");

const {SQLiteDatabase} = require("../../databases/sqlite3")
const {hasMany,belongsTo, manyToMany, ON_DELETE} = require("../../databases/relations")
const {createPassword} = createPasswordHashing("d2nd2bhvdg2be2,, fmf 2fhvehv w ,3f3n,mf32dnm3ndm3  3 f")


const { createField, types } = require("../../databases/mysql");
const { isValueValid } = require("../../utils/valueCheckings");
const { dataClassToName } = require("../../utils/dataclassToName");
const {User} = require("../../docs/code/dataclass/dataclass_1");
const {MySqlDatabase} = require("../../databases/mysql");
const {MySQLQuery} = require("../../query/mysqlQuery");
const {ACTION_TYPES} = require("../../query/postgresqlQuery");

class UserDataClass extends DataClass {
    username = createField(types.TEXT, false, false, [
        is_required("Username is required"),
        minLength(8, "Username must contain 8 letters")
    ])
    password = createField(types.TEXT, false, false, [], null, createPassword,{defaultValue:"password"})

    messages = hasMany(Message)
    rooms = manyToMany(Room)


    getName(){return "users"}
}

class Message  extends DataClass {

    getName(){return "message"}

    text = createField(types.TEXT, false, false, [])

    userID = belongsTo(UserDataClass,"_id",false,ON_DELETE.CASCADE,types.VARCHAR,{max:250})
}

class Room extends DataClass {
    getName(){return "room"}

    name = createField(types.TEXT, false, false, [])

    users = manyToMany(UserDataClass)
}



async function runner() {
    const db = new MySqlDatabase()
    await db.onConnectViaURL(
        "mysql://avnadmin:AVNS_oxGZy6jUMNqkPxouKSn@mysql-157c41e-sunath2007-b922.a.aivencloud.com:26067/test-relations-add?ssl-mode=REQUIRED"
    )
    await db.createTables(UserDataClass,Message,Room)
    //
    // await db.runQuery("INSERT INTO users (_id, username, password) VALUES (?, ?, ?)", ['user-3', 'newuser123', 'hashedpassword'])
    // await db.runQuery("INSERT INTO room (_id, name) VALUES (?, ?)", ['room-4', 'Sports'])

// now link them
    await db.addRelation(UserDataClass, Room, 'user-3', 'room-4')

    const query  = new MySQLQuery(UserDataClass)
    query.setActionType(ACTION_TYPES.SELECT)
    query.setSelectingFields("*")
    query.setTableName(UserDataClass)
    const response = await query.preload("rooms").execute(db)
    console.log(JSON.stringify(response))
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