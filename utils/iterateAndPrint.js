
/**
 * A function which returns the length of the list
 * 
 * This function is to used when yoy don't like typoes in your code
 * @param {Array} list 
 * @returns {Number}
 */
const getLengthOfList = list => list.length

/**
 * Iterate through any given list
 * Callback will be called for every item
 * @param {Array} list 
 * @param {Function} callback 
 */
function iterateList(list,callback){
    //Loop through the list
    for(let i = 0 ; i < getLengthOfList(list);i++)
        // Call the callback function
        callback(list[i])
}


module.exports = iterateList