const {ACTION_TYPES,LikePatterns,tableDotField,Filter,PostgresqlQuery, ORDER_DIRECTIONS, MySQLQuery} = require("fast-express-backend/query/postgresqlQuery")
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const { DataClass } = require("fast-express-backend/dataclasses");
const { getFromTable } = require("../utils");


class Orders extends DataClass {
    getName(){
        return "payment";
    }
}


async function runTest() {
         const db = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.POSTGRES] = db;


    const query = new PostgresqlQuery(Orders)
    
    query.setActionType(ACTION_TYPES.SELECT);
    query.setSelectingFields([
        ...getFromTable('payment','amount','payment_date'),
        ...getFromTable('customer','first_name','last_name')
    ])
    query.setTableName(Orders)

    query.innerJoin(
        'customer',
        getFromTable('customer','customer_id'),
        getFromTable('payment','customer_id')
    )

    query.startFiltering().lessThan(
        getFromTable('payment','payment_date') ,new Date('2017-01-30')
    ).lessThan(getFromTable('payment','payment_date'),new Date('2017-01-31'))



    query.limit(10)
    query.orderBy('customer.first_name',ORDER_DIRECTIONS.ASCENDING)


    const r = query.build() 
    const response = await db.runQuery(r.query,r.values)
    console.log(response)

   
    await db.disconnect()

}

module.exports = {runTest}