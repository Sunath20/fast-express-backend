# CRUD OPERATIONS WITH MongoDB

let's see how we do crud operations and using query object.Once you initialize the class there are several things you have to do.

1. setActionType - wether it's select,update,delete or insert

First thing you gonna need a data class.It's not necessary.But since we don't like to break the structure , we gonna need to pass down.

So here is the sample User data class.


```javascript
class User extends DataClass {


    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        [
            is_required("Username is required"),
            minLength(3,"Username must have 3 characters")
        ]
    )

    password = createField(
        types.TEXT,
        true,
        [
            is_required("Password is required"),
            minLength(8,"Password must have 8 characters")
        ]
    )


    birthday = createField(
        types.DATE,
        false
    )

}
```

Then we gonna initialize the mongodb query object.But in order do so we must have connected to database.

```javascript
const db = new MongoDBDatabase()
await db.connect("mongodb://localhost:27017/fast-express-data")
Databases.connections[DATABASE_TYPES.MONGODB] = db;
const query = new MongodbQuery(User)
```

## Save data with the query

We need to do few things.

    1. Set  up the query
    2. Build the query
    3. Run the query

So now let's set up the query.

```javascript
query.setActionType(ACTION_TYPES.INSERT)
query.insert({'username':"Lol44locl44",'password':"K2K@Kdw@K@K@K@KK@",birthday:new Date('1995-01-01')})
```

Next we gonna build it (get backs the query and search values).

```javascript
const response = query.build()
```

`build()` method usually returns a object with `query` and `values`.So once we get that we can run it.

```javascript
const r = await db.runQuery(ACTION_TYPES.INSERT,response.query,response.values) 
```

Mongodb runQuery method takes three arguments.Action type,query,values.Note unlike all other functions it's a async function.That's it.That how you insert an object.


```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")

const {ACTION_TYPES,MongodbQuery,LikePatterns,ORDER_DIRECTIONS} = require("fast-express-backend/query/mongodbQuery")

class User extends DataClass {


    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        [
            is_required("Username is required"),
            minLength(3,"Username must have 3 characters")
        ]
    )

    password = createField(
        types.TEXT,
        true,
        [
            is_required("Password is required"),
            minLength(8,"Password must have 8 characters")
        ]
    )


    birthday = createField(
        types.DATE,
        false
    )

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    
    const query = new MongodbQuery(User)
    query.setActionType(ACTION_TYPES.INSERT)
    query.insert({'username':"Lol44locl44",'password':"K2K@Kdw@K@K@K@KK@",birthday:new Date('1995-01-01')})

    const response = query.build()
    const r = await db.runQuery(ACTION_TYPES.INSERT,response.query,response.values)
    console.log(r)
    await db.disconnect()
    process.exit(1)
}
```



## Get data from the database
Just like saving data first few steps are the same.You create the data class,make the database connection,and initialize the query object.But this time action type gonna change.

```javascript
const query = new MongodbQuery(User)
query.setActionType(ACTION_TYPES.SELECT)
```

Once you set up action type,You can select the fields you want in your output.So you have two options.

    1. setRemovableFields - remove the fields given as a array from the output
    2. setSelectingFields - select the fields given as a array from the output

In this case we gonna use `setRemovableFields` to remove some fields.

```javascript
query.setRemovableFields(['_id','username','password','__v','createdAt','updatedAt'])
```

We just want the dates.So once we have this,we can start filtering.
At this moment,we have few.For example

    1. greaterThan
    2. lessThan
    3. like
    4. equals

Apart from `like` filter, all the others uses the same structure.First we give field name we wanna filter,then the value.In this case we use both `greaterThan` and `lessThan` filters.

```javascript
query.graterThan('birthday',new Date('2000-01-01'))
query.lessThan('birthday',new Date('2010-01-01'))
```

So how the like operator works.It follows the same arguments.And we need to pass down a one more.And that is `LIKE_TYPE`.You have few options

    1. Contain
    2. StartsWith
    3. EndsWith

```javascript
query.like('username','ET',LikePatterns.CONTAINS)
```
You two methods limit and skip records.Both takes integers,and as the name sound it does the job.

    1.limit - limit how many object returns
    2.skip - how many objects you wanna skip

Once you have filtered the data,you can sort them base on a field.

```javascript
query.orderBy('birthday',ORDER_DIRECTIONS.Descending)
```

You can change sort direction as you want.Then just like the previous time, you build the query and perform it.So here's full implementation.


```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")

const {ACTION_TYPES,MongodbQuery,LikePatterns,ORDER_DIRECTIONS} = require("fast-express-backend/query/mongodbQuery")


class User extends DataClass {


    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        [
            is_required("Username is required"),
            minLength(3,"Username must have 3 characters")
        ]
    )

    password = createField(
        types.TEXT,
        true,
        [
            is_required("Password is required"),
            minLength(8,"Password must have 8 characters")
        ]
    )


    birthday = createField(
        types.DATE,
        false
    )

}



async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    
    const query = new MongodbQuery(User)
    query.setActionType(ACTION_TYPES.SELECT)
    query.setRemovableFields(['_id','username','password','__v','createdAt','updatedAt'])
    query.graterThan('birthday',new Date('2000-01-01'))
    query.lessThan('birthday',new Date('2010-01-01'))
    query.orderBy('birthday',ORDER_DIRECTIONS.Descending)

    const response =  query.build()
    const val = await db.runQuery(ACTION_TYPES.SELECT,response.query,response.values)


    await db.disconnect()
    process.exit(1)
}
```


## Update data from the database

Update is pretty much the same.you set the ACTION_TYPE.Then you set the updateValues.At last you start filtering.So let's see full example.

```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")

const {ACTION_TYPES,MongodbQuery,LikePatterns,ORDER_DIRECTIONS} = require("fast-express-backend/query/mongodbQuery")

class User extends DataClass {


    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        [
            is_required("Username is required"),
            minLength(3,"Username must have 3 characters")
        ]
    )

    password = createField(
        types.TEXT,
        true,
        [
            is_required("Password is required"),
            minLength(8,"Password must have 8 characters")
        ]
    )


    birthday = createField(
        types.DATE,
        false
    )

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    
    const query = new MongodbQuery(User)
    query.setActionType(ACTION_TYPES.UPDATE)
    query.setUpdateValues({"username":"lol44lol"})

    query.equals('username','User01abc')

    const response = query.build()
    const r = await db.runQuery(ACTION_TYPES.UPDATE,response.query,response.values)
    console.log(r)
    await db.disconnect()
    process.exit(1)
}

```


## Delete data from the database

For this,you just set the action type,then you run the query.

```javascript

const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")

const {ACTION_TYPES,MongodbQuery,LikePatterns,ORDER_DIRECTIONS} = require("fast-express-backend/query/mongodbQuery")

class User extends DataClass {


    getName(){
        return "users"
    }

    username = createField(
        types.TEXT,
        true,
        [
            is_required("Username is required"),
            minLength(3,"Username must have 3 characters")
        ]
    )

    password = createField(
        types.TEXT,
        true,
        [
            is_required("Password is required"),
            minLength(8,"Password must have 8 characters")
        ]
    )


    birthday = createField(
        types.DATE,
        false
    )

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    
    const query = new MongodbQuery(User)
    query.setActionType(ACTION_TYPES.DELETE)
    query.equals('username','lol44lol')

    const response = query.build()
    console.log(response.query)
    const r = await db.runQuery(ACTION_TYPES.DELETE,response.query,response.values)
    console.log(r)
    await db.disconnect()
    process.exit(1)
}


```