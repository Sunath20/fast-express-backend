# Next Level Backend

## Quick Start Guide

### Preparing The Envrionment

```bash
mkdir HelloWorld
cd ./HelloWorld
npm install next-leve-backend
```

Next open the the HelloWolrd folder using Visual Studio Code or the code editor you use.

### Get up and Running

1. Create a file called  ` main.js `

	Since next level backend is integrated using express js. We will use the same base as the express.
	
    ```javascript
    // import express and it's base components
    // we will use the express to create the server
    // express router will be used to handle views(get,post,put,delete)
    const express = require("express")
    const {Router} = require("express")

    // import mongodb and connect it
    const mongoose  = require("mongoose")
    // the url depends on the mongodb instance you are gonna use
    // at the time of writing we are running it locally,
    // but you can connect it to the remote server
    // please read mongoose documentation if you want to know more  
     mongoose.connect("mongodb://localhost:27017")
	 ```

     Let's stop the `main.js` fie there.Since this libary contains helper functions and classes to extends the experience of express let's use our first helper function.

2. Create a file called `models.js`

    `Notice : This file and main.js should in the same directory.It's not a must.But if you want to follow along please do it for now.you can write it in your own way after this`

    So create the `models.js` file . 

    ```javascript

    // import the data class
    const {DataClass} = require("fast-express-backend")
    // a shortcut method
    const {createMongoDBField} = require('fast-express-backend/utils')
    // import some functions validate your data
    const {validators} = require('fast-express-backend/dataclasses/')


    // Create a class called MovieDataClass
    // Make sure it's extends from fast express backend data class
    // this is also the movie Schema and the model you see in mongoose
    class MovieDataClass extends DataClass {

        // you must override the getName functions
        // you must return a unique name for each data class you create
        getName(){
            return "movies"
        }
        
        // now we can describe what our model looks like

        // first it has a name
        // so we just give the class an attribute called name
        // then assign the value of createMongoDBField()
        // first argument is the type - String,Number,Boolean,Date
        // then weather the field is unique or not
        // then pass the validators
        // it will check weather the data is correct or not
        // for now don't worry just copy and pase this.
        // when we run the code you will understand everything
        name = createMongoDBField(String,true,[validators.is_required("Name is required")])

        // just like that we create a another attribute called date
        date = createMongoDBField(Date,false,[validators.is_required("Date is required")])
    }

    module.exports = {MovieDataClass}

    ```


    Okay that's it. Now you have created a model / schema / dataValidation class from one class.Don't worry for now.
    We will tell everything.As a startup code this without thinking.


3. Now go back to the `main.js` file  

    then add these following lines.

    ```javascript


    // import fast express backend components
    const {applyBasicCrud} = require("fast-express-backend")


    // import the models
    const {MovieDataClass} = require("./models")

    // create routers
    const movieRouter = Router()
    applyBasicCrud(movieRouter,MovieDataClass)

    // create the base server
    const app = express()
    // make sure it can use json to send and get data
    app.use(express.json())
    // set the routers in the app
    app.use("/movies",movieRouter)

    // run the app
    app.listen(8000,() => {
        console.log("app is running on port 8000")
    })
    
    ```

4. Your `main.js` file should look like this 

    ```javascript


    // import express and it's base components
    const express = require("express")
    const {Router} = require("express")

    // import mongodb and connect it
    const mongoose  = require("mongoose")
    mongoose.connect("mongodb://localhost:27017")

    // import fast express backend components
    const {applyBasicCrud} = require("fast-express-backend")


    // import the models
    const {MovieDataClass} = require("./models")

    // create routers
    const movieRouter = Router()
    applyBasicCrud(movieRouter,MovieDataClass)

    // create the base server
    const app = express()
    // make sure it can use json to send and get data
    app.use(express.json())
    // set the routers in the app
    app.use("/movies",movieRouter)

    // run the app
    app.listen(8000,() => {
    console.log("app is running on port 8000")
    })

    
    ```

5. Last thing is to run this app

    go to your in visual studio code terminal

    ```bash
    node main.js
    ```
6. That's it . Now you have successfully created an app that can get,save,update,and delete movies.Let's test it with postman or whatever rest api tester app you like

    <!-- create model -->
    when we send requests we will use the date `Date()` output just for now.
    So open the postman create a new post request.First let's test it with no data
    ![Postman request with no data](https://i.ibb.co/HNf7zhf/postman-movie-post-no-data.png "postman no data")

    send the request.you will see an organized error.

    ![Postman response with no data](https://i.ibb.co/NnxX3Vy/postman-movie-post-no-data-response.png "postman no data response")

    As you can say it says that name must be a string.That's because of auto type checking.
    When we said in our model Movie has an attribute called name, fast express backend knows that name 
    must be a string and if any other type were to given it will throw an error to the user.

    ```javascript
    name = createMongoDBField(String,true,[validators.is_required("Name is required")])
    ```

    Now let's pass the name but not the date.Let's see what happen when we try to do it.
    ![Postman response with only name](https://i.ibb.co/N7SJnpf/postman-movie-post-only-name.png "postman post request with only name given")


    As you can see it says that date must be a Date.
    So what's the point here.When you want to save data you don't have to worry about the validation
    it will be done by the libary.Just give us what the data looks like we will handle everything.


    Now enough with testing.let's create a save our first instance in the database.we will get the date from the javascript Date() function output.because it's a valid date.

    ![Postman save object](https://i.ibb.co/wJH7dZY/postman-movie-save-post-request.png "postman post request save data")


    as you can see it returns an object with id,created_at and ...
    So it means your model has been saved.

    `Note: if you send the same request without changing data you will get an error`
    ![Postman unique check](https://i.ibb.co/GV4cNMJ/postman-movie-name-uniquness-check.png "postman unique check")

    If we recall when we created the name field

    ```javascript
    name = createMongoDBField(String,true,[validators.is_required("Name is required")])
    ```
    we pass the second argument to be true.
    it makes the name field unique.

    try the same request with different name you can save a new object then.


    See that's the power of fast express backend.It will use express and it's own features to make things
    more dynamic and make sure it's safe.

    <!-- get model -->

    Take a 5 minute break if you want.😜😜😜😜

    So we saved data.But how we retrive them.That won't take so much time.
    Just create a another request called `GetMovies` and just like below send the requets

    ![Postman get all saved movies](https://i.ibb.co/9sKK4P9/postman-get-all-movies.png "saved movie response")

    As you can see , you get all the models you saved via create movie request.
    How easy is that, only thing we did was create a data class and create a mini router.
    We will explain these in another sections for now keep in mind dataclass is a class which represent the mongo db model. 


    <!-- update model -->
    All right now let's see how we can update a model.This requires two things.
    id of the object and payload you want to change

    for example let's change a date of a movie

    first of all copy an id of a object which we saved.
    then create new postman get request called `GetMovieWithId`
    add a query parameter called `id` and set it to the id you copied
    you should get a result like this

    ![Postman request to get object with id](https://i.ibb.co/ydXZL7t/postman-get-movie-with-id.png "postman get object with id request")


    So let's change it.
    Now create a new request called `UpdateMovie` make sure it's type to be put.
    In order to update a model you need to pass two arguments

    1. query -  base on this data we will find your object
    Usually it's look like this.
    

        ```
        "query":{_id:"some random object id"}
        ```

    2. payload - the data you want to replace

        ```
        "payload":{date:"new date"}
        ```

    3. So whole object looks like this

        ```
        {
            "query":{
                "_id":"some random id"
            },
            "payload":{
                "date":"some new date"
            }
        }
        ```

    now let's send the request see what will happen.
    ![Postman update request](https://i.ibb.co/QrWXJYw/postman-movie-update-request.png "Postman update movie request")

    it returns nothing.But if you look at the status code it's around 200-203 that means it been saved. for now fast express does not use the general status codes , but soon it will be changed.


    you can check by running the same get movie by id request to verify the updated version of movie.


    Last but not least, let's wrap up this by deleating an object.
    So let's create another request called delete movie by id.
    pass the id as a query parameter.
    note for delete you should name id as `id` not `_id`

    ![Postman delete object with id](https://i.ibb.co/cb5XLKb/postman-movie-delete-request.png "delete object with an id")

    you should not get any content for this either.
    but it must return 204 status content. 
    which is default for delete response.


    And that's it for the introduction.Let's dive into each sections later.So let's move on to learn what happens behind the scenes.    

