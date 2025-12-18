const {SQLiteDatabase} = require("fast-express-backend/databases/sqlite3")


async function runTest() {
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    db.close()
}

module.exports = {runTest}