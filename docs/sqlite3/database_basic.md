# SQLITE Database

## 1. Create, connect and disconnect.
First of all, we have to know how to create one,connect it.You can use either the sqlite library itself,or our interface which rely on the library itself.But throughout the examples we are gonna use the `fast-express-backend` connection.

```javascript
const {SQLiteDatabase} = require("fast-express-backend/databases/sqlite3")


async function runTest() {
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    db.close()
}
```

That's it. You just initialize a class, you must pass down the `path` where you wanna create your database.`connect()` function is an async one. Now let's get into how to create a table.


## Create a table

Now we are gonna , change somethings in our data class so we support both database and dataclass functionalities through one class.

```javascript

const {SQLiteDatabase,createField,types} = require("fast-express-backend/databases/sqlite3")
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

async function runTest() {
    const db = new SQLiteDatabase(__dirname + "\\prop.db")
    await db.connect()
    await db.createTable(User)
    db.close()
}
```


As always, we must override the `getName()`.Then we initialize fields(username,password) via the method provide by the `createField`.It add some keys to those objects.

### Create field function
It takes few arguments.Let's see them.

    1. type - Must be the sqlite3 
    2. unique - true or false (if you want the field to unique or not). No need to add a unique validator.
    3. nullable - wether the field can be null or not
    4. validators - dataclass validators you like to add
    5. before validation - change the field data before validation(not required all the time).
    6. after validation - change the field after validation

So once you create the `fields` just like the above you create,connect the database.And then you just call `createTable` and pass down the `DataClass`.


### importance of getName function
Database table name will be the value returned by class `getName()` function.For example query for the above table gonna look like this.

```sql
CREATE TABLE "users" (_id TEXT NOT NULL UNIQUE, createdAt TEXT default current_timestamp, updatedAt TEXT default current_timestamp,username TEXT UNIQUE NOT NULL,password TEXT UNIQUE NOT NULL,PRIMARY KEY ("_id") )
```

## Default Fields
    1. _id : Creates a unique id automatically.(Don't have to do it by hand)
    2. createdAt : save when the record was saved.(Work done by the database)
    3. updatedAt : As you know, save when the last time record was updated

You can have `Relation Database` stuff.But before getting into them, first let's how we save,retrieve,update and delete data.