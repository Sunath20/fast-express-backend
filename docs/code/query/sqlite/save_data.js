const {ACTION_TYPES,LikePatterns,tableDotField,Filter,SqliteQuery,ORDER_DIRECTIONS, toSQLLiteDateTime} = require("fast-express-backend/query/sqliteQuery")
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const { DataClass } = require("fast-express-backend/dataclasses")


class Dummy extends DataClass{

    age = createField(types.INTEGER,false,true)
    name = createField(types.TEXT,false,true,[],null,null)
    birthday = createField(types.DATE,false,true,[],null,null)

    getName(){
        return "dummy"
    }

}

class Customer extends DataClass{
    
    getName(){return "customer"}
    first_name = {}
    last_name = {}
    email = {}
    active = {}
    address_id = {}
    active = {}
    create_date = {}
    last_update = {}
}


class Payment extends DataClass{
    customerNumber = {}
    checkNumber = {}
    paymentDate = {}
    amount = {}

    getName(){
        return "payments"
    }
}



async function runTest() {
         const db = new SQLiteDatabase("temp.db")
        await db.connect()

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.SQLITE] = db;
    await db.createTable(Dummy)
    // await db.createTable(Customer)
    const query = new SqliteQuery(Dummy,DATABASE_TYPES.SQLITE)
    query.setActionType(ACTION_TYPES.INSERT)
    query.setTableName(Dummy)
    query.insert({'age':10,'name':"Sunath Thenujaya",'birthday':toSQLLiteDateTime(new Date())})
    const response = query.build()
    const out = await db.runQuery(response.query,response.values)
    console.log(out)
    db.close()

}

module.exports = {runTest}