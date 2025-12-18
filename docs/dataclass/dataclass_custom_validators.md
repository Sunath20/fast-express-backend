# Custom Validators

First thing first, What we need to know is, we  must return a function
that returns a promise.So let's look at a simple case.Let's say we wanna create a validator that check wether the input has space or not.

## Normal Non Async Function
First thing first let's import a util function that helps you to minimize writing `new Promise`.

```javascript
const { functionToPromise } = require("fast-express-backend/utils/functionToPromise")
```

First let's look at the outer function.It usually takes error we wanna print,when validation failed.Which means data are incorrect.You can add many arguments as you like.Then we create a function that returns a promise.But here it must take three parameters `resolve`,`reject`,`value`.Don't get confused.

1. resolve/reject - Promise resolve and reject functions,
2. value - user given value
 
 If the data is okay you just gonna `resolve({okay:true})`.
 If not you gonna `resolve({okay:false,error:Any error msg you want})`.

 Finally we pass it down to a function called `functionToPromise`.It just create a promise and then pass down resolve,reject,and the value.That's it.

```javascript
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

```


### Adding it to our class

Make sure to import the `DataClass` class.

```javascript
class User extends DataClass{
    getName(){
        return "users"
    }


    username = {
        type:String,
        validations:[noSpaceValidator("Space Can't have any spaces")]
    }
}



async function runTest() {
    const user = new User()
    await user.init({username:"Karl"})
   const response =  await user.validate()
   console.log(response)
}


runTest().then(e => console.log(e)).catch(e => console.log(e))

```

So run the file and give different inputs and see what happens.


```javascript

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

class User extends DataClass{
    getName(){
        return "users"
    }


    username = {
        type:String,
        validations:[noSpaceValidator("Space Can't have any spaces")]
    }
}



async function runTest() {
    const user = new User() 
    await user.init({username:"Karl"})
   const response =  await user.validate()
   console.log(response)
}


runTest().then(e => console.log(e)).catch(e => console.log(e))

```

So run it and you see different response.Make sure to give invalid input so you get what's going on.


## Async Functions 
Generally All the same.The structure does not changed.But we think this will help you understand what to do in all kind of situations.So let's create a dummy async function.

```javascript
async function databaseLookUp(name){
    // console.log(name=="Karl",name==="Karl")
    return name === "Karl" ? false : true
}
```

Takes a name and return if it's equal to `Karl` or not.You can perform database lookup and make requests and so on.But not to worry we got the `unique` validator.We will see it when it comes connect with database.

So let's create the validator.

```javascript
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
```

Just like the above validator.As you can see there are no different.But the async operation has to done with `Promise`.That's it.You add it like normal and work like normal.So let's add the both to the field and see what happens.