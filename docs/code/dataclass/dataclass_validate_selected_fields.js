// Import the Dataclass
const {DataClass} = require("fast-express-backend")

// Import the validator functions
const {is_required,maxLength,minLength} = require("fast-express-backend/dataclasses/validators")

// Extend Our Own class 
class User extends DataClass{

    // This must be override by the class
    // should return a unique name for the class
    // Basically a sweet name for the class
    getName(){
        return "users";
    }

    // Define the fields

    // field name and the type and validations
    name = {
        type:String,
        validations:[
            is_required("username is required"),
            minLength(2,"username at least have two characters")
        ]
    }

    password = {
        type:String,
        validations:[
            is_required("password is required"),
            minLength(8,"Password at least must contain 8 letters")
        ]
    }
}


async function runTest() {
    const user = new User()
    await user.init({'name':"S",password:"hel"})
    const response = await user.validateOnlyPayload({'password':"hel"})   
    console.log(response)
}

module.exports = {runTest}