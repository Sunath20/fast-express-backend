# Save Data In the Database

We are gonna have to add few lines to our code,that's quite easy.

```javascript
const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const {DataClass,validators,DataClassFactory} = require("fast-express-backend/dataclasses")
const {Databases,DATABASE_TYPES} = require("fast-express-backend/databases")

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
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    await db.createTable(User)

    Databases.connections[DATABASE_TYPES.SQLITE] = db;

    const inputPayload  = {"username":"lol44lol","password":"123NobodyKnows123"}
    const userFactory = new DataClassFactory(User,{DATABASE:DATABASE_TYPES.SQLITE})
    const user = await userFactory.createObject(inputPayload)

    const response = await user.validate()
    if(response.data.okay){
        const updatedUser = await userFactory.createModelObject(inputPayload);
        console.log(updatedUser)
    }else{
        console.log(response)
    } 

    db.close()
}

```

## Changes we made.
1. Set the global sqlite database connection

    ```javascript
    Databases.connections[DATABASE_TYPES.SQLITE] = db;
    ```

    So we can access the database via dataclass without passing the database instance.

2. Use data class factory.
    ```javascript
    const userFactory = new DataClassFactory(User,{DATABASE:DATABASE_TYPES.SQLITE})
    ```
    As meta data we must pass down which type of database.So we don't have to set the database connection manually.

3. createObject

    Initialize the object for us.so we can just validate class.


4. createModelObject
    Save the record/object in the database.Return the updated field.

# Get Data with limit and skip
Now let's see how to get data from the database.

```javascript
const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const {DataClass,validators,DataClassFactory} = require("fast-express-backend/dataclasses")
const {Databases,DATABASE_TYPES} = require("fast-express-backend/databases")

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
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    await db.createTable(User)

    Databases.connections[DATABASE_TYPES.SQLITE] = db;


    const userFactory = new DataClassFactory(User,{DATABASE:DATABASE_TYPES.SQLITE})
    const objects = await userFactory.getModelObjectsWithAll(3,2)
    console.log(objects)
    console.log(objects.length)

    db.close()
}
```
First of all, I have added many records to the database by hand.Once a again you create the `userFactory` or the instance you have.Call the `getModelObjectsWithAll`.It will return the all the objects.Since it can be millions, we have set the limit to 10 by default.you can change it as you like.Next you have skip argument.How many records you wanna skips.That's it.

# Get data with conditions
Let's say you wanna get the user info base on this username.So you can use `getModelWithPayload` method to get the user info with matching payload.

```javascript
const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const {DataClass,validators,DataClassFactory} = require("fast-express-backend/dataclasses")
const {Databases,DATABASE_TYPES} = require("fast-express-backend/databases")

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
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    await db.createTable(User)

    Databases.connections[DATABASE_TYPES.SQLITE] = db;

    const userFactory = new DataClassFactory(User,{DATABASE:DATABASE_TYPES.SQLITE})
    const objects = await userFactory.getModelWithPayload({username:"lol44lol"})
    console.log(objects)
    // console.log(objects.length)

    db.close()
}

```

We have two more arguments.you can set the limit and skip. If you search with more general field like `interested_items` or you know what I mean.

# Update data

Now let's get into updating data.First we are gonna filter the objects we need,them replace the fields values as we like.So for this we are gonna need the query and payload.

```javascript


const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const {DataClass,validators,DataClassFactory} = require("fast-express-backend/dataclasses")
const {Databases,DATABASE_TYPES} = require("fast-express-backend/databases")

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
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    await db.createTable(User)

    Databases.connections[DATABASE_TYPES.SQLITE] = db;

    const userFactory = new DataClassFactory(User,{DATABASE:DATABASE_TYPES.SQLITE})
    const updatedUsers = await userFactory.updateModelObject({password:"not_my_island"},{password:"yes_my_island"})
    console.log(updatedUsers)

    db.close()
}

```

That's it.And that's how you update objects.

# Delete data
Just like the update. Only difference is you don't gonna have the payload.In this case we delete by id.We have a another method for that too.For now this is the general cases.

```javascript

const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
const {DataClass,validators,DataClassFactory} = require("fast-express-backend/dataclasses")
const {Databases,DATABASE_TYPES} = require("fast-express-backend/databases")

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
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    await db.createTable(User)

    Databases.connections[DATABASE_TYPES.SQLITE] = db;

    const userFactory = new DataClassFactory(User,{DATABASE:DATABASE_TYPES.SQLITE})
    const objects = await userFactory.deleteModels({"_id":"1e64c160-bb7e-4364-a1a5-152a0d19293e"})
    console.log(objects)

    db.close()
}

```