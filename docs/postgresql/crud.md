# Postgresql - Basic Crud Operations.
Now we know how to connect and disconnect, let's see how we do CRUD operations.
First of all let's create a `DataClass`.Instead of define properties by hand,
we gonna use the `createField` provided by postgresql.



```javascript
const {createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators} = require("fast-express-backend/dataclasses")

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

}
```

We have created a class with username and password fields.Both are set to text and unique.Now let's see each attribute.

### Dataclass To Postgresql Table

    1. Table Name - Dataclass `getName()` return value;
    2. Id - It's done automatically, and it's the primary Key.(No need to add it)
    3. DataClass Fields - each will be an columns with the given type,and uniqueness and nullable.

## Save Data in the Database
We gonna use `DataClassFactory` to create instants.It will set some properties like `connection`,`classSelf` and so on.

```javascript
const data = {'username':"Trevor","password":"BonneyBlue"};
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.POSTGRES})
    const user = await userFactory.createObject(data)
```
### Dataclass Factory Constructor
It takes two arguments.
    1. Data Class - data class
    2. Meta Data - Contains properties like database type,removable fields.

It's must set the `{'DATABASE':DATABASE_TYPE}`.When we define the unique validations, we must have a connection.That's why the above is required.

Just like with data class, you can validate data and save using `DataClassFactory` method called `createModelObject`.

```javascript
    const response = await user.validate()
    console.log(response)
    if(response.data.okay){
       const newUser =  await userFactory.createModelObject(data)
       console.log(newUser)
    }
```
That's it. Here's the full example.

```javascript
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")

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

}

async function runTest() {
   const db  = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)
    console.log("Connected successfully")

    Databases.connections[DATABASE_TYPES.POSTGRES] = db;
    await db.createTable(User)
    console.log("Table created successfully")

    const data = {'username':"Trevor","password":"BonneyBlue"};
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.POSTGRES})
    const user = await userFactory.createObject(data)

    const response = await user.validate()
    console.log(response)
    if(response.data.okay){
       const newUser =  await userFactory.createModelObject(data)
       console.log(newUser)
    }

    await db.disconnect()
}

```


## Get data from the database
It's quite easy.You just have your query like {'username':"jhon"},find using the database.

```javascript
const users = await db.find(User,{'username':"jhon"},true,2)
console.log(users)
```

### Find method
Soon there will be an query builder, for now we can only offer this,for specific queries every database has a connection,that you can perform your own SQL Queries.To Learn about that connection head over to [PG Client](https://node-postgres.com/apis/client#clientquery)

    1. DataClass - dataclass
    2. Query - filter (name=something)
    3. Get Objects - Boolean(Set it true.Set it for internal functions)
    4. Limit - how many objects
    5. Offset - How many to skip

So here's the full example.

```javascript
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")

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

}

async function runTest() {
   const db  = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)
    console.log("Connected successfully")

    Databases.connections[DATABASE_TYPES.POSTGRES] = db;
    await db.createTable(User)
    console.log("Table created successfully")

    const users = await db.find(User,null,true,2)
    console.log(users)

    await db.disconnect()
}
```


## Update Method.
User must provide two arguments.
    1. Query - select the objects we wanna change
    2. Payload - new values for fields.

You can use the `data class factory` and perform the query.In this case let's how to change username from one to another.

```javascript
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")

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

}

async function runTest() {
   const db  = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)
    console.log("Connected successfully")

    Databases.connections[DATABASE_TYPES.POSTGRES] = db;
    await db.createTable(User)
    console.log("Table created successfully")

    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.POSTGRES})
    const response = await userFactory.updateModelObject({username:"lol44lolv1"},{username:"lol44lol"})
    console.log(response)
    await db.disconnect()
}
```
## Delete method.
Delete is quite easy.You Pass Down the query and it will basically delete all the objects that matches the filter.

```javascript
const { Databases, DATABASE_TYPES } = require("fast-express-backend/databases")
const {PostgresDatabase,createField,types} = require("fast-express-backend/databases/postgresql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")

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

}

async function runTest() {
   const db  = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)
    console.log("Connected successfully")

    Databases.connections[DATABASE_TYPES.POSTGRES] = db;
    await db.createTable(User)
    console.log("Table created successfully")

    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.POSTGRES})
    const response = await userFactory.deleteModels({username:"lol44lol"})
    console.log(response)
    await db.disconnect()
}
```