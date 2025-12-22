const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")
const {PostgresqlQuery,ACTION_TYPES,LikePatterns,ORDER_DIRECTIONS,toPostgresqlDateTime} = require("fast-express-backend/query/postgresqlQuery")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")]
    )

    password = createField(
        types.TEXT,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")]

    )

    birthday = createField(
        types.DATE,
        false,
        false
    )

}


async function runTest() {
    const db  = new PostgresDatabase()
      await db.connect('localhost','postgres','1234','Fast-Express',5432)
      console.log("Connected successfully")
  
      Databases.connections[DATABASE_TYPES.POSTGRES] = db;
      await db.createTable(User)
      console.log("Table created successfully")
  
      const query = new PostgresqlQuery()
      query.setActionType(ACTION_TYPES.UPDATE)
      query.setTableName(User)

      query.update({username:'pakaya'})

      query.startFiltering()
      query.equals('username','lol44lol')
      query.endFiltering()
      

        const response = query.build()
        console.log(response.query)
        const output = await db.runQuery(response.query,response.values)
        console.log(output)
  
      await db.disconnect()
}

module.exports = {runTest}