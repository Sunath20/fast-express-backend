const {DataClass} = require("../../dataclasses/base")
const {createField, types, PostgresDatabase} = require("../../databases/postgresql")
const {belongsTo, hasMany, hasOne} = require("../../databases/relations")
const {PostgresqlQuery, ACTION_TYPES} = require("../../query/postgresqlQuery")
const {User} = require("../../docs/code/dataclass/dataclass_1");
const {SQLiteDatabase} = require("../../databases/sqlite3");
const {SqliteQuery} = require("../../query/sqliteQuery");


class UserDataClass extends DataClass {
    username = createField(types.TEXT, false, true, [])
    password = createField(types.TEXT, false, true, [])

    messages = hasMany(MessageDataClass)

    getName(){ return "users" }
}

class MessageDataClass extends DataClass {
    text = createField(types.TEXT, false, true, [])
    userID = belongsTo(UserDataClass, "_id", false, "CASCADE", types.TEXT)

    meta = hasOne(MessageMetaDataClass)

    getName(){ return "messages" }
}

class MessageMetaDataClass extends DataClass {
    likes = createField(types.INTEGER, false, false, [])
    messageID = belongsTo(MessageDataClass, "_id", false, "CASCADE", types.TEXT)

    getName(){ return "message_meta" }
}

async  function runner(){
    const db = new SQLiteDatabase("test_relations.db")
    await db.connect()

    await db.createTables(UserDataClass,MessageDataClass,MessageMetaDataClass)
    const query = new SqliteQuery(UserDataClass)

    query.setActionType(ACTION_TYPES.SELECT)
    query.setSelectingFields("*")
    query.setTableName(UserDataClass)
    query.preload("messages.meta")
    const result = await query.execute(db)
    console.log(JSON.stringify(result))
}

runner().finally(_ => {console.log("okay")})