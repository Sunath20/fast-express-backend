# Features of DataClass

## After Validation.
Let's say you wanna encrypt the password before saving it in the database.So you can add the after validation function that will run when you wanna save the data.So let's see it in action.

1. It must return a promise.
2. Not like validators.It has a different structure.
3. You are given a value.You return a value

The above is a dummy password encrypt example.It's a dummy function.Not a real world one.It's helpful since password encrypting algorithms like `argon` run async.

```javascript
async function passwordEncrypt(value){
    return "Something"+value+"SomethingElseAgain"
}
```

So what we need to do is add this to the whatever field,So how we do this.In this case here's our class look like.  



```javascript

class User extends DataClass{
    getName(){
        return "users";
    }

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
        ]
    }
}

```

So what we are gonna do is,add this to password field.But it's add as `afterValidation` property.

```javascript
    password = {
        type:String,
        validations:[
            is_required("password is required"),
            minLength(8,"Password at least must contain 8 letters")
        ],
        afterValidation:passwordEncrypt
    }

```

Now we run the init and validate function as before.And we are gonna run 

```javascript
  const response =  await user.transformValidateDataToBeSaved(payload)
  ```

That will output the updated response.Notice you still has to pass down the payload.So It's gonna look like this.

```javascript
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

runTest().then(e => console.log(e)).catch(e => console.log(e))
```

So run it.You Will your password field has changed.



## Before Validation
Unlike after validation,as soon as you `init(payload)` runs it applies automatically.This must a async function.So we are gonna change the password afterValidation(In the above example),into the beforeValidation.


```javascript
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
    console.log(user['form_data'])
}

runTest().then(e => console.log(e)).catch(e => console.log(e))
```


`class['form_data']` shows you the data.But if you index it's field you get a dictionary with it's properties.Run it few different payload.


## Run Selected Validation.
Well Only thing you have to do is,instead of calling every `validate` function,`validateOnlyPayload({selected data})`.Unlike validate function,you are gonna the data.Notice,you must only pass the selected payload.Just like the below.

```javascript
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



```

## Compare payload and validate
let's say you don't want your customer to put the same name and the password.So dataclass has a function you can override that let's you validate the form easily.It will run after all the validation run.You don't have run any other function,just run the `validate()` function.

```javascript
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
        const user = new User()
        await user.init({'name':"NoOnssssssss22b",'password':"NoOnssssssss22b"})
        const response = await user.validate()
        console.log(response)
    }catch(error){
        // network error and etc
        console.error(error)
    }

}
```

So you basically override the `validateAllData` function.You can access the data,but you can't change them.Keep that in mind.You can via beforeValidation.afterValidation does not change the payload,it gives you a new basic object with values.

```javascript
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
```
Well,you can't use `functionToPromise` since we receive no value.So that's all about data class.