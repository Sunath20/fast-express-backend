const {ACTION_TYPES,LikePatterns,tableDotField,Filter,Query, ORDER_DIRECTIONS, MySQLQuery} = require("fast-express-backend/query/mysqlQuery")
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const { DataClass } = require("fast-express-backend/dataclasses");
const { getFromTable } = require("../utils");


class Orders extends DataClass {
    getName(){
        return "orders";
    }
}


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
    Databases.connections[DATABASE_TYPES.MYSQL] = db;


    const query = new MySQLQuery(Orders)
    
    query.setActionType(ACTION_TYPES.SELECT);
    query.setSelectingFields([
        ...getFromTable('orders','orderDate','shippedDate','status'),
        getFromTable('customers','customerName')
    ])
    query.setTableName(Orders)

    query.innerJoin(
        'customers',
        getFromTable('customers','customerNumber'),
        getFromTable('orders','customerNumber')
    )


    query.startFiltering().graterThan('orders.shippedDate',new Date('2003-01-01')).lessThan('orders.shippedDate',new Date('2003-01-31'))

    query.limit(60)
    query.orderBy('orders.shippedDate',ORDER_DIRECTIONS.ASCENDING)

    const r = query.build() 
    const response = await db.runQuery(r.query,r.values)
    console.log(response)

   
    db.connection.destroy()

}

module.exports = {runTest}