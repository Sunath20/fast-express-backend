// Import the Dataclass
const {DataClass} = require("fast-express-backend")

// Import the validator functions
const {is_required,maxLength,minLength} = require("fast-express-backend/dataclasses/validators")

async function passwordEncrypt(value){
    return "Something"+value+"SomethingElseAgain"
}

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
        ],
        
    }

    password = {
        type:String,
        validations:[
            is_required("password is required"),
            minLength(8,"Password at least must contain 8 letters")
        ],
        afterValidation:passwordEncrypt
    }
}




async function runTest() {
    const user = new User()
    const payload = {name:"SunathThenujaya",password:"lol44lollol44lol"}
    await user.init(payload)

   const response =  await user.transformValidateDataToBeSaved(payload)
   console.log(response)
}


module.exports = {runTest}
