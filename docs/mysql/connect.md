# Connect MySQL Database

```javascript
const {MySqlDatabase,createField,types} = require("fast-express-backend/databases/mysql")


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

    db.connection.destroy()
}
```

So we import the `MySqlDatabase` and create a instance.Then we provide the following information
    
    1. Database Name
    2. Username
    3. Password
    4. Host
    5. Port

