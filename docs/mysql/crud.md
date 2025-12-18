# Save Data in MySQL

First we need a data class.And it will transform it properties to database table properties.So let's see how it works.

    1.Table Name = Value of the function `getName()` in the data class
    2. Id - Given by automatically (Don't define it)
    3. Every fields you define in the class - Turns it into column in the table with the data type

Now let's create the class.

```javascript
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")
const {DATABASE_TYPES,Databases} = require("fast-express-backend/databases")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.VARCHAR,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")],
        null,
        null,
        {'max':250}
    )

    password = createField(
        types.VARCHAR,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")],
        null,
        null,
        {'max':250}

    )

}
```

Note : Unlike other Databases, don't use `types.Text`,for the field you want to be unique.Instead use `VarChar`.As you know,it must have number of maximum characters.So in the `createField` you must give `{max:number of characters}` in order to define it.You can skip the beforeValidation and afterValidation.


```javascript
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MYSQL})
    const data = {'username':"Harry",'password':"Maguire"}
    const user = await userFactory.createObject(data)
    const response = await user.validate()
    console.log(response)
    if(response.data.okay){
        const updatedUser = await userFactory.createModelObject(data)    
        console.log(updatedUser)
    }

```

Then we create a `DataClassFactory` for the user,with the current database type.Which means it will use the connection of mysql to perform queries for this class.

Use `createObject` in order to create a object that suitable for doing validation,Once you are happy with the data you can use `createModelObject` for the saving data.


```javascript

const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")
const {DATABASE_TYPES,Databases} = require("fast-express-backend/databases")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.VARCHAR,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")],
        null,
        null,
        {'max':250}
    )

    password = createField(
        types.VARCHAR,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")],
        null,
        null,
        {'max':250}

    )

}


async function runTest() {
    const db = new MySqlDatabase()
    await db.connect(
        'fast-express',
        'root',
        '1234',
        'localhost',
        3306
    );

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.MYSQL] = db;
    try{
        await db.createTable(User)
    }catch(error){
        console.log(error,"Error")
    }
    
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MYSQL})
    const data = {'username':"Harry",'password':"Maguire"}
    const user = await userFactory.createObject(data)
    const response = await user.validate()
    console.log(response)
    if(response.data.okay){
        const updatedUser = await userFactory.createModelObject(data)    
        console.log(updatedUser)
    }
    db.connection.destroy()
}
```


# Get Data from mysql

At the moment you can perform simple queries and get the data.But for more complex queries , you have to use the connection in the database and perform queries.For more details, head over to (MySql)[https://www.npmjs.com/package/mysql#performing-queries] nodejs package.

So let's see how we get data.

```javascript
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")
const {DATABASE_TYPES,Databases} = require("fast-express-backend/databases")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.VARCHAR,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")],
        null,
        null,
        {'max':250}
    )

    password = createField(
        types.VARCHAR,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")],
        null,
        null,
        {'max':250}

    )

}


async function runTest() {
    const db = new MySqlDatabase()
    await db.connect(
        'fast-express',
        'root',
        '1234',
        'localhost',
        3306
    );

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.MYSQL] = db;
    try{
        await db.createTable(User)
    }catch(error){
        console.log(error,"Error")
    }
    
   const users = await db.find(User,null,true)
   console.log(users)
    db.connection.destroy()
}

```

So `db.find` is method we will use for now.

    1. DataClass - Give the DataClass(To access table)
    2. query - {username:"find this user"}
    3. getObj - set it true,there specific cases(For internal use)
    4. limit - how many objects
    5. offset - how many you wanna skip


# Update data from mysql

For this we again use the data class factory.It has a method `updateModelObjects` which takes a query to filter out the objects and payload to set new values.

The following example change username from one to another.


```javascript
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")
const {DATABASE_TYPES,Databases} = require("fast-express-backend/databases")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.VARCHAR,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")],
        null,
        null,
        {'max':250}
    )

    password = createField(
        types.VARCHAR,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")],
        null,
        null,
        {'max':250}

    )

}


async function runTest() {
    const db = new MySqlDatabase()
    await db.connect(
        'fast-express',
        'root',
        '1234',
        'localhost',
        3306
    );

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.MYSQL] = db;
    try{
        await db.createTable(User)
    }catch(error){
        console.log(error,"Error")
    }
    
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MYSQL})
    const data = {'username':"Harry",'password':"Maguire"}
    const updatedUsers = await userFactory.updateModelObject({'username':"Harry"},{'username':"lol44lolv1"})
    console.log(updatedUsers)
    db.connection.destroy()
}

```


# Delete data from mysql

It takes a query which filter outs the objects and delete them.You can pass down `returnLimit` and `returnSkip` to get few objects data.

```javascript
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")
const {DataClass,validators, DataClassFactory} = require("fast-express-backend/dataclasses")
const {DATABASE_TYPES,Databases} = require("fast-express-backend/databases")

class User extends DataClass {

    getName(){
        return "users"
    }

    username = createField(
        types.VARCHAR,
        true,
        false,
        [validators.minLength(4,"Username must contain 4 letters or more")],
        null,
        null,
        {'max':250}
    )

    password = createField(
        types.VARCHAR,
        true,
        true,
        [validators.minLength(8,"Password must have 8 characters or more")],
        null,
        null,
        {'max':250}

    )

}


async function runTest() {
    const db = new MySqlDatabase()
    await db.connect(
        'fast-express',
        'root',
        '1234',
        'localhost',
        3306
    );

    console.log("Database is connected")
    Databases.connections[DATABASE_TYPES.MYSQL] = db;
    try{
        await db.createTable(User)
    }catch(error){
        console.log(error,"Error")
    }
    
    const userFactory = new DataClassFactory(User,{'DATABASE':DATABASE_TYPES.MYSQL})
    const deletedUsers = await userFactory.deleteModels({'username':"lol44lolv1"});
    console.log(deletedUsers)
    db.connection.destroy()
}

```