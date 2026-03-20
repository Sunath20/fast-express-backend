const {DataClass} = require("../../dataclasses/base")
const {createField, PostgresDatabase} = require("../../databases/postgresql")
const {belongsTo, hasMany, hasOne} = require("../../databases/relations")
const {PostgresqlQuery, ACTION_TYPES} = require("../../query/postgresqlQuery")
const {User} = require("../../docs/code/dataclass/dataclass_1");
const {SQLiteDatabase} = require("../../databases/sqlite3");
const {SqliteQuery} = require("../../query/sqliteQuery");
const {types, MySqlDatabase} = require("../../databases/mysql");
const {MySQLQuery} = require("../../query/mysqlQuery");


class UserDataClass extends DataClass {
    username = createField(types.VARCHAR, false, true, [],null,null,{max:250})
    password = createField(types.VARCHAR, false, true, [],null,null,{max:250})

    messages = hasMany(MessageDataClass)

    getName(){ return "users" }
}

class MessageDataClass extends DataClass {
    text = createField(types.VARCHAR, false, true, [],null,null,{max:250})
    userID = belongsTo(UserDataClass, "_id", false, "CASCADE", types.VARCHAR,{max:250})

    meta = hasOne(MessageMetaDataClass)

    getName(){ return "messages" }
}

class MessageMetaDataClass extends DataClass {
    likes = createField(types.INT, false, false, [])
    messageID = belongsTo(MessageDataClass, "_id", false, "CASCADE", types.VARCHAR,{max:250})

    getName(){ return "message_meta" }
}

async  function runner(){
    const db = new MySqlDatabase()

    await db.onConnectViaURL("mysql://avnadmin:AVNS_oxGZy6jUMNqkPxouKSn@mysql-157c41e-sunath2007-b922.a.aivencloud.com:26067/test-relations?ssl-mode=REQUIRED")

    await db.createTables(UserDataClass,MessageDataClass,MessageMetaDataClass)
    const query = new MySQLQuery(UserDataClass)

    query.setActionType(ACTION_TYPES.SELECT)
    query.setSelectingFields("*")
    query.setTableName(UserDataClass)
    query.preload("messages.meta")
    const result = await query.execute(db)
    console.log(JSON.stringify(result))
}

runner().finally(_ => {console.log("okay")})