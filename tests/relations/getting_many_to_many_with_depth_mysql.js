const { DataClass } = require("../../index")
const { createField, MySqlDatabase, types } = require("../../databases/mysql")
const { is_required, minLength } = require("../../dataclasses/validators")
const { belongsTo, hasMany, hasOne, manyToMany, ON_DELETE } = require("../../databases/relations")
const { MySQLQuery } = require("../../query/mysqlQuery")
const { ACTION_TYPES } = require("../../query/mysqlQuery")


class UserDataClass extends DataClass {
    username = createField(types.VARCHAR, false, true, [
        is_required("Username is required"),
        minLength(8, "Username must contain 8 letters")
    ], null, null, { max: 250 })
    password = createField(types.VARCHAR, false, true, [], null, null, { max: 250 })

    messages = hasMany(MessageDataClass)
    rooms = manyToMany(RoomDataClass)

    getName() { return "users" }
}

class MessageDataClass extends DataClass {
    text = createField(types.VARCHAR, false, true, [], null, null, { max: 500 })
    userID = belongsTo(UserDataClass, "_id", false, ON_DELETE.CASCADE, types.VARCHAR)

    getName() { return "message" }
}

class RoomDataClass extends DataClass {
    name = createField(types.VARCHAR, false, true, [], null, null, { max: 250 })
    users = manyToMany(UserDataClass)
    profile = hasOne(RoomProfileDataClass)

    getName() { return "room" }
}

class RoomProfileDataClass extends DataClass {
    profilePic = createField(types.VARCHAR, false, true, [], null, null, { max: 500 })
    roomID = belongsTo(RoomDataClass, "_id", true, ON_DELETE.CASCADE, types.VARCHAR)

    getName() { return "room_profile" }
}

async function runner(){

    const db = new MySqlDatabase()
    await db.onConnectViaURL(
        "mysql://avnadmin:AVNS_oxGZy6jUMNqkPxouKSn@mysql-157c41e-sunath2007-b922.a.aivencloud.com:26067/test-many-in-depth?ssl-mode=REQUIRED"
    )
    await db.createTables(UserDataClass,MessageDataClass,RoomDataClass,RoomProfileDataClass)
    const query  = new MySQLQuery(UserDataClass)
    query.setActionType(ACTION_TYPES.SELECT)
    query.setSelectingFields("*")
    query.setTableName(UserDataClass)
    const response = await query.preload("rooms.profile").preload("messages").execute(db)
    console.log(JSON.stringify(response))

}

runner().finally(() => {console.log("finished")})