const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const {DataClass,validators} = require("fast-express-backend/dataclasses")
const {DATABASE_TYPES,Databases} = require("fast-express-backend/databases")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.VARCHAR,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")],
        null,
        null,
        {'max':250}
    )

    password = createField(
        types.VARCHAR,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")],
        null,
        null,
        {'max':250}

    )

}


async function runTest() {
    const db = new MySqlDatabase()
    await db.connect(
        'fast-express',
        'root',
        '1234',
        'localhost',
        3306
    );

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.MYSQL] = db;
    await db.createTable(User)
    console.log("Table was created")
    db.connection.destroy()
}

module.exports = {runTest}