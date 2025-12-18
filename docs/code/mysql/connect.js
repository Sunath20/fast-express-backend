const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")


async function runTest() {
    const db = new MySqlDatabase()
    await db.connect(
        'fast-express',
        'root',
        '1234',
        'localhost',
        3306
    )

    console.log("Database is connected")

    db.connection.destroy()
}

module.exports = {runTest}