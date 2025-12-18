const {PostgresDatabase,createField} = require("fast-express-backend/databases/postgresql")



async function runTest() {
    const db  = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)
    console.log("Connected successfully")
    await db.disconnect()
}


module.exports = {runTest}