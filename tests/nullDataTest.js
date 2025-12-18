
const {DataClass,validators,DataClassFactory} = require("../dataclasses")
const {createMongoDBField} = require("../utils")
class User extends DataClass{
    getName(){return 'name'}

    username = createMongoDBField(String,false,[validators.is_required("username is required")])
}

const UserFactory = DataClassFactory.createFactory(User)

const user = UserFactory.createObject({'name':"hello"})
user.validate().then(e => console.log(e))