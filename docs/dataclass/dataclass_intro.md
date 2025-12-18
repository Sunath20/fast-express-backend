# Dataclass

Basically create a class with fields that validates your input data,save them in a database,update them
and delete them.

So you will write only one class,it will handle all the database relations and input data validation.

So Let's start with the simplest class.Pure Validation class.

## Intro to Dataclass

First let's import what we are gonna need.

```javascript   
const {DataClass} = require("fast-express-backend")
```
### Create the class
```javascript
class User extends DataClass{
        getName(){
        return "users";
    }
}
```

You must extends the class with `DataClass`.Then override the `getName()` function to return a name with no space (Name matters when it comes to database).

### Add Fields and Validations

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

```

Field must follow the above structure.It got a type and validations.It has more,we will look at them in a little bit.

Let's talk about validations.By default you have few validators.Just like the above `is_required`,`minLength`,`maxLength` comes by default.When it comes database you can check uniqueness.That's beside the point for now.


### Initialize a dataclass and run validation.

```javascript

const {DataClass} = require("fast-express-backend")


const {is_required,maxLength,minLength} = require("fast-express-backend/dataclasses/validators")




class User extends DataClass{

    
    getName(){
        return "users";
    }

  
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
    try{
        const user = new User()
        await user.init({'name':"No one ",'password':"NoOn"})
        const response = await user.validate()
        console.log(response.data.error)
    }catch(error){
        console.error(error)
    }

}


runTest().then(e => console.log(e)).catch(e => console.log(e))

```

We have done few things.
    1. Create a new user.(No data in the constructor)
    2. Init with the data(payload)
    3. Run the validation(Async)

### Why validation function run async.
Well when it comes database connections,you are gonna deal with async functions.So by default every validator function must return a Promise.We will talk about it soon.

### What is response

Well you get nothing if there's no error in the init data.But if you got errors ,it will return something like this.

```shell

{
  data: { okay: false, error: 'Password at least must contain 8 letters' },
  field: 'password'
}

```

Since we are printing only the error you should see something like this.

```shell
Password at least must contain 8 letters
```