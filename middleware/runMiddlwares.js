
/**
 * run many middlewares in sequence
 * if any return response occured then we return it the request handler function
 * @param {Express.Request} req 
 * @param {Express.Response} res 
 * @param {Array[Function]} middlewares 
 * @returns 
 */
async function runMiddlewares(req,res,middlewares){
    // loop through middlwares
    for(let i = 0; i < middlewares.length;i++){
        // run the middleware
       const response =  await middlewares[i](req,res)
    //    if it's return the response object we return it to the high order function
       if(response){
            return response;
       }
    }
    // if no returns happens we return null too.
    return null;
}


module.exports = {runMiddlewares}