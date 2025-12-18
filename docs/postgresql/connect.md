# Postgresql - Connect the database

```javascript
const {PostgresDatabase} = require("fast-express-backend/databases/postgresql")

async function runTest() {
    const db  = new PostgresDatabase()
    await db.connect('localhost','postgres','1234','Fast-Express',5432)
    console.log("Connected successfully")
     Databases.connections[DATABASE_TYPES.POSTGRES] = db;
    await db.disconnect()
}
```

Import the database class from the library.Note : If you want more features given by `pg` you can use the `connection` in the database class.When you want to perform specific queries.For more over , head over to [pg documentation](https://node-postgres.com/)

### Connect function
Connect function takes few arguments.All the arguments are the same when you try to connect with `Client` in the pg.Arguments may in different order.

    1. Host 
    2. Username 
    3. Password
    4. Database Name
    5. Port

After the connection we set the database for global access.So we don't have to pass it everywhere.

```javascript
Databases.connections[DATABASE_TYPES.POSTGRES] = db;
```

You can setup four database types at the moment.This is a must if you use DataClassFactory which we will use next.