# Connect MongoDB

For this we use `mongoose` a library which helps us make connections with the database.If you get any problem with connecting to the database read how they change the connection link for every type of connection and put yours in the our connection function.

```javascript
const {MongoDBDatabase} = require("fast-express-backend/databases/mongodb")

async function runTest() {
    const db = new MongoDBDatabase()
    await db.connect("mongodb://localhost:27017/fast-express-data")
    console.log("Database was connected successfully")
    await db.disconnect()
    process.exit(1)
}

```
Currently I'm running the server locally.Which has no authentication.But If you do it's quite easy to connect with the following way.

```javascript
mongodb+srv://<db_username>:<db_password>@cluster0.tc7v1.mongodb.net/?appName=Cluster0
```

Replace the `<db_username>` and `<db_password>` with yours.Change the appName too.If you use Mongodb Atlas it's very easy to get the link.