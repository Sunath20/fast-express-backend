const {ACTION_TYPES,LikePatterns,tableDotField,Filter,SqliteQuery,ORDER_DIRECTIONS, toSQLLiteDateTime} = require("fast-express-backend/query/sqliteQuery")
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const { DataClass } = require("fast-express-backend/dataclasses")

class Customers extends DataClass {
    getName() {
        return "customers"
    }
}



async function runTest() {
         const db = new SQLiteDatabase("chinook.db")
        await db.connect()

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.SQLITE] = db;
    // await db.createTable(Dummy)
    // await db.createTable(Customer)
    const query = new SqliteQuery(Customers,DATABASE_TYPES.SQLITE)

    query.setActionType(ACTION_TYPES.SELECT)
    query.setSelectingFields(['FirstName','LastName','Company','Address'])
    query.setTableName(Customers)

    query.startFiltering()
    query.equals('city','Paris')
    query.endFiltering()

    query.limit(10)

    const response = query.build()
    console.log(response.query)
    const out = await db.runQuery(ACTION_TYPES.SELECT,response.query,response.values)
    console.log(out)
    db.close()

}

module.exports = {runTest}