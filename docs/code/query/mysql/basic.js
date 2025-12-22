const {ACTION_TYPES,LikePatterns,tableDotField,Filter,Query, ORDER_DIRECTIONS} = require("fast-express-backend/query/mysqlQuery")
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const { DataClass } = require("fast-express-backend/dataclasses")


class Dummy extends DataClass{

    age = createField(types.INT,false,true)
    name = createField(types.VARCHAR,false,true,[],null,null,{'max':100})
    birthday = createField(types.DATE_TIME,false,true,[],null,null)

    getName(){
        return "dummy"
    }

}

class Customer extends DataClass{
    
    getName(){return "customer"}
    first_name = {}
    last_name = {}
    email = {}
    active = {}
    address_id = {}
    active = {}
    create_date = {}
    last_update = {}
}


class Payment extends DataClass{
    customerNumber = {}
    checkNumber = {}
    paymentDate = {}
    amount = {}

    getName(){
        return "payments"
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
    await db.createTable(Dummy)
    // await db.createTable(Customer)
    const query = new Query(Dummy,DATABASE_TYPES.MYSQL)

    query.setActionType(ACTION_TYPES.SELECT)
    query.setSelectingFields(['checkNumber','paymentDate'])
    query.setTableName(Payment)
    
    query.startFiltering().graterThan('paymentDate','2005-04-15').lessThan('paymentDate','2005-05-01').endFiltering().like('checkNumber','ET',LikePatterns.CONTAINS)

    query.orderBy('checkNumber',ORDER_DIRECTIONS.ASCENDING).limit(2)
    

    const response = query.build()
    const rows = await db.runQuery(response.query,response.values)
    
    console.log(rows)
    db.connection.destroy()

}

module.exports = {runTest}