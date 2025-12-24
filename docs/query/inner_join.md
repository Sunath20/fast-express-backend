# Inner Join
In this example,we will see how to implement inner join in SQL(No mongodb).If you don't know what inner join is, it's good to know it.To my knowledge,it's basically connect two tables and retrieve data by comparing one column of each table.

All three databases (Postgresql,MySql,Sqlite3) can be implemented by the same way,runQuery method will be slightly different.

```javascript

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

```

In this example we have two tables. One with orders and one with customers.We are gonna retrieve orders shipped between selected time,Moreover we want customer names too.Note that `Orders` and `Customers` have been connected through `customerNumber` field.Both fields hold that key in this example.



| customerName | birthday   | customerNumber |
|--------------|------------|----------------|
| Alice Smith  | 1990-05-12 | CUST001        |
| Bob Johnson  | 1985-09-23 | CUST002        |
| Carol White  | 1992-11-07 | CUST003        |




| customerNumber | orderNumber | shippedDate | amount |
|----------------|-------------|-------------|--------|
| CUST001        | ORD1001     | 2025-12-01  | 250.00 |
| CUST002        | ORD1002     | 2025-12-05  | 120.50 |
| CUST003        | ORD1003     | 2025-12-10  | 89.99  |

The above tables shows how they look.


First we select `'orderDate','shippedDate','status'` fields from the Orders.Then we select `'customerName'` from customers.Since we retrieve data from the Orders we must inner join it with customer.We compare customerNumber in both fields.Get the matching records,then filter out items shipped in the january. 