
const  {InvalidArgumentError} = require("../errors")


/**
 * Create a function to get a value from paths given
 * @param {any} nullValue - any value you want to return when the value isn't found 
 * @param  {...String} args - Path for the object in keys
 * @returns 
 */
function findValueInObject(nullValue,...args){
    if(args.length == 0)throw new InvalidArgumentError("You must at lease have one argument")
    return findThroughObject.bind({nullValue:nullValue})(...args)
}

/**
 * find the value inside the object without getting an error
 * if the value isn't found default null Value will be thrown
 * @param  {...String} args - location to object via keys 
 * @example
 * const object = {data: { user: {name: "Sunath" } } } 
 * const searcher = findThroughObject("data","user","name")
 * console.log(searcher(object))
 * // Sunath
 * @returns 
 */
function findThroughObject(...args){
    if(args.length === 0){throw new Error("You must pass down arguments")};
    nullValue = null;
    index = 0;

    /**
     * 
     * @param {Object} object 
     */
    function search(obj){
        // console.log(this)
        if(this.index == this.args.length -1){
            // console.log("we are here",obj,args[this.index])
            return (obj[args[this.index]] == undefined || obj[args[this.index]] == null) ?  this.nullValue : obj[args[this.index]]  
        }
        
        if(obj[this.args[this.index]] != undefined  || obj[this.args[this.index]] != null){
            return search.bind({nullValue:this.nullValue,index:this.index+1,args:this.args})(obj[this.args[this.index]])
        }else{
            return this.nullValue
        }
    }
    return search.bind({nullValue:this.nullValue,index,args})
}

module.exports = {findValueInObject}