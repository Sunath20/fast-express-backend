const {ACTION_TYPES,LikePatterns,tableDotField,Filter,SqliteQuery,ORDER_DIRECTIONS, toSQLLiteDateTime} = require("fast-express-backend/query/sqliteQuery")
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const { DataClass } = require("fast-express-backend/dataclasses")
const { getFromTable } = require("../utils")

class Album extends DataClass {
    getName() {
        return "albums"
    }
}



async function runTest() {
         const db = new SQLiteDatabase("chinook.db")
        await db.connect()

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.SQLITE] = db;
    // await db.createTable(Dummy)
    // await db.createTable(Customer)
    const query = new SqliteQuery(Album)
    query.setActionType(ACTION_TYPES.SELECT)

    query.setSelectingFields([
        getFromTable('albums','title'),
        getFromTable('artists','Name')
    ])

    query.setTableName(Album)

    query.innerJoin(
        'artists',
        'artists.ArtistId',
        'albums.ArtistID'
    )


    query.limit(10)
    query.orderBy('artists.Name',ORDER_DIRECTIONS.ASCENDING)

    const response = query.build()
    const out = await db.runQuery(ACTION_TYPES.SELECT,response.query,response.values)
    console.log(out)
    db.close()

}

module.exports = {runTest}