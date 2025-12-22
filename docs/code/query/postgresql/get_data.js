const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")
const {PostgresqlQuery,ACTION_TYPES,LikePatterns,ORDER_DIRECTIONS,toPostgresqlDateTime} = require("fast-express-backend/query/postgresqlQuery")

class Payment extends DataClass {
    getName() { return  "payment"}

    payment_id = {}
    customer_id = {}
    staff_id = {}
    rental_id = {}
    amount = {}
    payment_date = {}
}



async function runTest() {
    const db  = new PostgresDatabase()
      await db.connect('localhost','postgres','1234','Fast-Express',5432)
      console.log("Connected successfully")
  
      Databases.connections[DATABASE_TYPES.POSTGRES] = db;
    //   await db.createTable(User)
      console.log("Table created successfully")
  
      const query = new PostgresqlQuery()
      query.setActionType(ACTION_TYPES.SELECT)
      query.setSelectingFields(['payment_date','amount'])
      query.setTableName(Payment)

      query.startFiltering()
      const d1 = new Date('2017-01-01 00:10:19.996577+05:30')
      console.log(d1)
      const d2 = new Date('2017-01-31 00:10:19.996577+05:30')
      console.log(d2)
      query.graterThan('payment_date',d1)
      query.lessThan('payment_date',d2)      
      query.endFiltering()

      query.limit(10)
      query.skip(5)

      query.orderBy('payment_date',ORDER_DIRECTIONS.Descending)

      const response = query.build()
      console.log(response.query,response.values)
      const o = await db.runQuery(response.query,response.values)
      console.log(o)
    
  
      await db.disconnect()
}

module.exports = {runTest}