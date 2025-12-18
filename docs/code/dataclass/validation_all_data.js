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

    async validateAllData(){
        const payload = this['form_data']
        if(payload['name'] === payload['password']){
        return new Promise((resolve,reject) => {
            resolve({okay:false,error: "username and password can't be the same"})
        })   
        }else{
            resolve({okay:true})
        }
    }
}



async function runTest() {
    try{

        
    // Create the user
    const user = new User()

        // Feed the Data
        await user.init({'name':"NoOnssssssss22b",'password':"NoOnssssssss22b"})
        // Validation function is a promise
        // You will see why in next few chapters
        const response = await user.validate()
        // const response2 = await user.validateAllData()


        // Check wether we have en error in the data or not
        console.log(response)
    }catch(error){
        // network error and etc
        console.error(error)
    }

}

module.exports = {runTest}