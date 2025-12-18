const {DataClass,DataClassFactory} = require("../dataclasses/base")
const {createField,createDatabase,SQLiteDatabase,types} = require("../databases/sqlite3")
const {run} = require("nodemon/lib/monitor");
const {Databases,DATABASE_TYPES,T, Tables} = require("../databases")

class UserClass extends DataClass {
    getName() {
        return "users"
    }
    username = createField(types.TEXT,true,false)
    password = createField(types.TEXT,true,false)
    birthday = createField(types.DATE,false,false)

    // createdAt = createField(types.DATE,true,false)
}

Tables.classes[UserClass] = "users"


const DATABASE_PATH = process.cwd() + "\\play\\dataclass_test.db"

async function runner(){
      try {
          const sqliteDatabase = new SQLiteDatabase(DATABASE_PATH)
          await sqliteDatabase.connect()
          Databases.connections[DATABASE_TYPES.SQLITE] = sqliteDatabase
          const Users = new DataClassFactory(UserClass,{"DATABASE":DATABASE_TYPES.SQLITE})
          const userInputPayload = {"username":"hello world 2","password":"Nobody Knows ","birthday":new Date().toDateString()}
          const user = Users.createObject(userInputPayload)
          await sqliteDatabase.createTable(UserClass)
          try{
              const response = await user.validate()
              if(response.data.okay){
                  const savedObject = await Users.createModelObject(userInputPayload)
                  console.log(savedObject)
              }else{
                  console.error(response.data.error)
              }
          }catch (error){
              console.error(error , "there is an error")
          }

          sqliteDatabase.close()
      } catch (error) {
          console.log(error)
      }
}


// runner().then(e => {
//     // console.log(e)
// }).catch(e => {console.log(e)})

module.exports = {UserClass}
