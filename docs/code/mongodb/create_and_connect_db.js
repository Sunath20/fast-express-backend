const {MongoDBDatabase} = require("fast-express-backend/databases/mongodb")




async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    console.log("Database was connected successfully")
    await db.disconnect()
    process.exit(1)
}

module.exports = {runTest}