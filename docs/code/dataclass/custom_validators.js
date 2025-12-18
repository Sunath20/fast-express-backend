const {DataClass} = require("fast-express-backend")
const { functionToPromise } = require("fast-express-backend/utils/functionToPromise")

// None Async Function
function noSpaceValidator(errorMSG){

    const noSpaceValidation =  (resolve,reject,value) => {
        if(value.indexOf(" ") > -1){
            return resolve({okay:false,error:errorMSG})
        }else{
            return resolve({okay:true})
        }
    }

    return functionToPromise(noSpaceValidation)
}


// 
async function databaseLookUp(name){
    // console.log(name=="Karl",name==="Karl")
    return name === "Karl" ? false : true
}

// Async Validator
function checkUserNameExitInDatabase(error){
    const checkUniqueness = (resolve,reject,value) => {
        databaseLookUp(value).then(e => {
            if(e){
                resolve({okay:true})
            }
            resolve({okay:false,error})
        }).catch(e => {
            reject({error:e.error})
        })
    }

    return functionToPromise(checkUniqueness)
}


class User extends DataClass{
    getName(){
        return "users"
    }


    username = {
        type:String,
        validations:[noSpaceValidator("Space Can't have any spaces"),checkUserNameExitInDatabase("Username already taken")]
    }
}



async function runTest() {
    const user = new User()
    await user.init({username:"Karl"})
   const response =  await user.validate()
   console.log(response)
}

module.exports = {runTest}
