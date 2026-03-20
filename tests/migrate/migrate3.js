const {DataClass,DataClassFactory} = require("../../dataclasses/base")
const {is_required, minLength} = require("../../dataclasses/validators");
const { createPasswordHashing } = require("../../utils/password_hashing");

const {SQLiteDatabase} = require("../../databases/sqlite3")

const {createPassword} = createPasswordHashing("d2nd2bhvdg2be2,, fmf 2fhvehv w ,3f3n,mf32dnm3ndm3  3 f")


const { createField, types, MySqlDatabase} = require("../../databases/mysql");
const { isValueValid } = require("../../utils/valueCheckings");
const { dataClassToName } = require("../../utils/dataclassToName");
const {PostgresDatabase} = require("../../databases/postgresql");
const {DATABASE_TYPES} = require("../../databases");
const {Database} = require("../../databases/database");

class UserDataClass extends DataClass {
    username = createField(types.TEXT, false, false, [
        is_required("Username is required"),
        minLength(8, "Username must contain 8 letters")
    ])
    password = createField(types.TEXT, false, true, [], null, createPassword,)
    age = createField(types.INT,false, true, [], null, null,{defaultValue:29})
    getName(){return "users"}
}



async function runner() {
    const db = new MySqlDatabase()
    await db.onConnectViaURL(
        "mysql://avnadmin:AVNS_oxGZy6jUMNqkPxouKSn@mysql-157c41e-sunath2007-b922.a.aivencloud.com:26067/defaultdb?ssl-mode=REQUIRED"
    )


    await db.createTable(UserDataClass)
    await db.migrate(UserDataClass)
}


runner().then(e => {
    console.log(e)
}).catch(e => {
    console.log(e)
}).finally(() => {

    console.log("This is the end")
})