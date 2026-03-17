
/**
 * Check the value or a real value
 * It can't be null and undefined
 * @param {any} val 
 * @returns 
 */
function isValueValid(val){
    return val !== null && val !== undefined;
}

module.exports = {isValueValid}