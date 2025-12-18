const express = require("express")
const {Router} = require("express")
const mongoose = require("mongoose")
const checkTheObjectPromiseOrNot = require("./utils/promiseChecking")
const {InvalidArgumentError} = require("./errors")

/**
 * Get up start to run the server
 * Takes the object created by the createApp function
 * @param {Express} app - app instance of the express
 * @param {Number} port - port number (server will run on this port)
 * @param {Function} runningFunction - the function run after the server is initialized
 * @param {Function} beforeRunningFunction - the function that runs before the server (suitable for database connection)
 */
function runApp(app,
    port=8000,
    runningFunction=null,
    beforeRunningFunction=function(){"okay"})
{

    if(typeof beforeRunningFunction != "function")throw new InvalidArgumentError("before running function must be a function")
    if(runningFunction !=null && typeof runningFunction != "function")throw new InvalidArgumentError("Running function must be null or a function")

    function defaultRunningFunction(){
        console.log("app is running on port " + port)
    }

    function runner(){
        app.listen(port,runningFunction ? runningFunction :  defaultRunningFunction)
    }

    const response = beforeRunningFunction()
     if(!checkTheObjectPromiseOrNot(response)){
            runner()
    }else{
        response.then(e => {
            runner()
        })
    }
    

    
}

/**
 * create a new router instance
 * @returns {Express.Router}
 */
function createRouter(){
    return new Router()
}

/**
 * creates multiple routers at one .
 * returns an object containing the routers as key value pairs.
 * Object can be indexed with the arguments you provied
 * @example
 * const {UserRouter,MovieRouter} = createRouters("UserRouter","MovieRouter")
 * console.log(UserRouter)
 * @param  {...String} args - arguments must be strings 
 * @returns  {Object}
 */
function createRouters(...args){
    const routers  = args.map(e => createRouter())
    const object = Object.create(null)

    for(let i = 0 ; i < args.length;i++){
        object[args[i]] = routers[i]
    }

    return object
}

/**
 * establish a connection with the database in the url given 
 * if we cannot establish it we just end the process.
 * Since this function directly focus on beforeRunning function in runApp this returns a function which connects to mongodb
 * @param {String} url
 * @example
 * const connectFunction = connectMongoose("some url")
 * connectFunction().then(e => {"now we have connected"}) 
 * @returns {Function}
 */
function connectMongoose(url){
    return async () =>   {
        try{
            const connected = await  mongoose.connect(url)
            console.log("Connected to the mongodb")
        }catch(error){
            console.error(error)
            process.exit(-1)
        }
      
    }
}


module.exports = {runApp,createRouter,createRouters,connectMongoose}