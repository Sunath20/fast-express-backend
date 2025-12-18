# Save Data In the Database

Now we know how to connect to the database let's see how we save data.First thing first we are gonna need our dummy class.So let's import everything and create the class

```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")


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

}


```

Note: every database representation looks the same.Every database has `createField` and `types`. (If you ever see how the sqlite3 works with this.)

Next we are gonna create the connection then we will be creating dataclass factory.

```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")



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

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MONGODB})

    await db.disconnect()
    process.exit(1)
}

```

So once we have factory we can create a dataclass object through it,and do validations.

```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")



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

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MONGODB})

    const data = {username:"Sam",password:"SamDontKnowThePassword"}
    const obj = await userFactory.createObject(data)
    const response = await obj.validate()
    console.log(response)
    await db.disconnect()
    process.exit(1)
}
```
Then `DataClassFactory` has a method called `createModelObject`, we are gonna pass down the data , then it will save the data and return us a updated object.


```javascript

const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")



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

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MONGODB})

    const data = {username:"Sam",password:"SamDontKnowThePassword"}
    const obj = await userFactory.createObject(data)
    const response = await obj.validate()
    console.log(response)
    if(response.data.okay){
        const updatedOBJ = await userFactory.createModelObject(data)
        console.log(updatedOBJ)
    }

    await db.disconnect()
    process.exit(1)
}


```

That's it.Now let's see how we read data.

# Get Data from the database

So let's see how we get data from the database in general.Not a lot gonna change from the above example.

```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")



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

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;

    const users = await db.find(User,null,2,0)
    console.log(users)
    
    await db.disconnect()
    process.exit(1)
}
```

We are gonna use db.find method.First the dataclass and then we give the query,something like {username:"jhon"} and by order limit and the skip.

# Update data from the database


Two things you gonna need. First is the query.Object will be filtered that way.then you gonna need payload. Data that you wanna change. That's it.You just have to call the `updateModelObject` function.


```javascript
const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")



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

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MONGODB})
    const updatedOBJ = await userFactory.updateModelObject(
            {username:"Konstas"},
            {username:"Donal Trump"}
    )
    console.log(updatedOBJ)
    await db.disconnect()
    process.exit(1)
}

```


# Delete data from the database

```javascript

const {MongoDBDatabase,createField,types} = require("fast-express-backend/databases/mongodb")
const {DataClass, DataClassFactory } = require("fast-express-backend")
const {maxLength,minLength,is_required} = require("fast-express-backend/dataclasses/validators")
const {DATABASE_TYPES, Databases} = require("fast-express-backend/databases")



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

}


async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    Databases.connections[DATABASE_TYPES.MONGODB] = db;
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MONGODB})
    const users = await userFactory.deleteModels({"_id":"6942991c601e329e4e9506aa"})
    console.log(users)
    await db.disconnect()
    process.exit(1)
}


```

THis one no difference.In the factory there is a method called `deleteModels`,you pass down the query you wanna delete.Maybe `{"username":"banned_user"}`.It deletes the entry.That's it.

Those are the basic.