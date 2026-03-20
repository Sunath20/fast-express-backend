const {MySqlDatabase} = require("../../databases/mysql");
const {MySQLQuery} = require("../../query/mysqlQuery");
const {ACTION_TYPES} = require("../../query/postgresqlQuery");

async  function runner(){
    const db = new MySqlDatabase()

    await db.onConnectViaURL("mysql://avnadmin:AVNS_oxGZy6jUMNqkPxouKSn@mysql-157c41e-sunath2007-b922.a.aivencloud.com:26067/test-relations?ssl-mode=REQUIRED")
    await db.runQuery("INSERT INTO users (_id, username, password) VALUES ('user-1', 'johndoe123', 'hashedpassword')", [])

    await db.runQuery("INSERT INTO messages (_id, text, userID) VALUES ('msg-1', 'Hello world', 'user-1'),('msg-2', 'Second message', 'user-1')", [])

    await db.runQuery("INSERT INTO message_meta (_id, likes, messageID) VALUES ('meta-1', 10, 'msg-1'),('meta-2', 5, 'msg-2')", [])
}


runner().finally(_ => {

})