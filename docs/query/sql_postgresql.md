# Query Data With MYSQL / POSTGRESQL / SQLITE

Notice - Only difference will be using the two databases are the database instance.(db instance in the examples)

`If you are using postgresql,db should be initialize with the PostgresqlDatabase.`


Notice - When it comes sqlite3,you should initialize the db using `SQLLiteDatabase()` and when you run the query,you should give the actionType,query,values in order.

Check out the example codes to see the different.


Unlike mongodb, you have to follow some rules in order to build a query using SQL databases.


    1. Set the Action Type
    2. Set values if it's update or insert
    3. Start filtering
    4. Add filters
    5. End filtering
    6. Limit and Skip
    7. Order By

So let's see most of the things in action.

## Save data using query
First of all create a data class,then as usual initialize the database.Once you are okay we can import the MySqlQuery class and start a query.

```javascript
const {ACTION_TYPES,LikePatterns,tableDotField,Filter,MySQLQuery, ORDER_DIRECTIONS, toMySQLDateTime} = require("fast-express-backend/query/mysqlQuery")
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
    const query = new MySQLQuery(Dummy)
    query.setActionType(ACTION_TYPES.INSERT)
    query.setTableName(Dummy)
    query.insert({'age':10,'name':"Sunath Thenujaya",'birthday':toMySQLDateTime(new Date())})
    const response = query.build()
    const out = await db.runQuery(response.query,response.values)
    console.log(out)
    db.connection.destroy()

}

```

Here we have created a data class called Dummy.To add data you gonna need to two things with query.

    1. Set the action type
    2. Set the insert values

Then you have build the query , it gives an object with query and values properties.Every database have a method called run query,arguments may be slightly different (Mongodb and SQLITE3 requires the action type as it's first argument).In this case we gonna pass down the query and values.It will create a row in the database.

## Get data using query.
The first few steps gonna be the same.Once you set the class you can set up the action type.Let's see the example first and talk through it.

```javascript
const {ACTION_TYPES,LikePatterns,tableDotField,Filter,Query, ORDER_DIRECTIONS} = require("fast-express-backend/query/mysqlQuery")
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const { DataClass } = require("fast-express-backend/dataclasses")


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

    const query = new Query(Payment)

    query.setActionType(ACTION_TYPES.SELECT)
    query.setSelectingFields(['checkNumber','paymentDate'])
    query.setTableName(Payment)
    
    query.startFiltering().graterThan('paymentDate','2005-04-15').lessThan('paymentDate','2005-05-01').like('checkNumber','ET',LikePatterns.CONTAINS)

    query.orderBy('checkNumber',ORDER_DIRECTIONS.ASCENDING).limit(2)
    

    const response = query.build()
    const rows = await db.runQuery(response.query,response.values)
    
    console.log(rows)
    db.connection.destroy()

}


```

Let's say we have class called Payment. We haven't given detailed version.But you get the idea.We gonna have do some things in order.

    1. Set the action type
    2. Set the field you wanna choose( "*" - for all fields)
    3. Set the table you wanna filter out
    4. Start filtering
    5. add filters
    6. End filters
    7. Add limit/skip/orderBy

You have few methods to add filters.
    1. greaterThan (works with dates too)
    2. lessThan
    3. like
    4. equals

As it's sounds limit,skip and orderBy does it job to limit,skip and sort the objects.


## Update data using query
Now hope you get the idea now how things works,let's jump into example.

```javascript
const {ACTION_TYPES,LikePatterns,tableDotField,Filter,MySQLQuery, ORDER_DIRECTIONS, toMySQLDateTime} = require("fast-express-backend/query/mysqlQuery")
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
    const query = new MySQLQuery(Dummy)
    
    query.setActionType(ACTION_TYPES.UPDATE)
    query.setTableName(Dummy)
    query.update({'age':40})
    
    query.startFiltering()
    query.equals("name","Sunath Thenujaya").equals("age",10)
    query.endFiltering()

    const response = query.build()
    const out = await db.runQuery(response.query,response.values)
    console.log(out)
    db.connection.destroy()

}
```

    1. Set the action type.
    2. Set the table name
    3. Set the update values
    4. Start filtering
    ... all the stuff valid with getting data.


## Delete data using query
Now let's see how we delete data.

```javascript

const {ACTION_TYPES,LikePatterns,tableDotField,Filter,MySQLQuery, ORDER_DIRECTIONS, toMySQLDateTime} = require("fast-express-backend/query/mysqlQuery")
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
    const query = new MySQLQuery(Dummy)
    
    query.setActionType(ACTION_TYPES.DELETE)
    query.setTableName(Dummy)
    
    query.startFiltering()
    query.equals("name","Sunath Thenujaya").equals("age",40)
    query.endFiltering()

    const response = query.build()
    const out = await db.runQuery(response.query,response.values)
    console.log(out)
    db.connection.destroy()

}


```

    1. Set the action type
    2. Set the table name
    3. Start filtering
    ...
