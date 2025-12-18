/**
 * A default function for attribute accessors
 * returns the same value given
 * 
 * @example
 * for(let i = 0 ; i < length;i++)
{
        // returns the same value in data[i]
        // this is for overriding purpose
        // most of the time this is used as a default attribute accesor
        // but you can pass your own to the alogirhtms
 *      let sortAttribute = defaultValueAccessor(data[i])
 * }
 * @param {Object} e 
 * @returns {Object} e
 */
function defaultValueAccessor(e){
    return e;
}

/**
 * Do a linear search and find the maximum number out of the data list
 * @param {Array<Object>} dataList 
 * @param {Function} attributeAccessor  - not required;
 * 
 * but you can pass a function that get value and return a value;
 * 
 * just a map function
 * @returns 
 */
function linearFindMaxNumber(dataList,attributeAccessor=defaultValueAccessor){
    // get the first number and set it as the maximum value
    let maxNum = attributeAccessor(dataList[0])
    // do the linear search
    for(let i = 0 ; i< dataList.length;i++){
        // get next item
        let nextNum = attributeAccessor(dataList[i]);
        // if the next number is bigger than the current maximum one set the maxNum to nextNum
        if(nextNum > maxNum){
            maxNum = nextNum;
        }
        // continue the loop until all items are searched
    }
    // return the maximum one
    return maxNum;
}


module.exports = {linearFindMaxNumber}