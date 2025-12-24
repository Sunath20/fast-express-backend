const {Query} = require("./Query")
const uuid = require("uuid")

const ACTION_TYPES = {
    SELECT:"SELECT",
    INSERT:"INSERT INTO ",
    DELETE:"DELETE FROM ",
    UPDATE:"UPDATE ",
}

const ORDER_DIRECTIONS = {
    "ASCENDING":"ASC",
    "Descending":"DESC"
}

const LikePatterns = {
    'STARTS_WITH':"STARTS_WITH",
    'ENDS_WITH':"ENDS_WITH",
    "CONTAINS":"CONTAINS",
    "FOLLOWED_BY_ONE":"FOLLOWED_BY_ONE",
    "FOLLOWED_BY_TWO":"FOLLOWED_BY_TWO",
}


function toMySQLDateTime(date) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, '0') + "-" +
        String(date.getDate()).padStart(2, '0') + " " +
        String(date.getHours()).padStart(2, '0') + ":" +
        String(date.getMinutes()).padStart(2, '0') + ":" +
        String(date.getSeconds()).padStart(2, '0');
}




class MySQLQuery extends Query {

    constructor(dClass) {
        super();
        this.dClass = dClass;
        this.values = []
        this.filters = []
        this.queryBase = ''
        this.orderByExpression = ''
        this.limitExpression = ''
        this.skipExpression = ''
    }


    distinct(fieldName){
        this.queryBase += ` DISTINCT ${fieldName} FROM `
    }
    /**
     *
     * @param type {String}
     * @returns {Query}
     */
    setActionType(type){
        this.queryBase += type + ' '
        return this
    }

    /**
     *
     * @param fields - {String[] || "*" }
     * @returns {Query}
     */
    setSelectingFields(fields){
        let selectedFields = ""
        if(fields === "*"){
            selectedFields = "*"
        }else{
            selectedFields = fields.join(",")
        }

        this.queryBase += selectedFields + ' FROM '
        return this
    }

    /**
     *
     * @param dClass - {DataClass}
     */
    setTableName(dClass){
        const name = (new dClass()).getName()
        this.queryBase += name +" "
    }

    startFiltering(){
        this.queryBase += ' WHERE '
        return this
    }

    insert(values){
        values['_id'] = uuid.v4();
        const insertIntoExpression = "( " + Object.keys(values).map(e => `${e}`).join(',') + " )"
        const valueIntoExpression = " VALUES (" + Object.keys(values).map(e => "?").join(",") +")";
        this.queryBase += insertIntoExpression + valueIntoExpression
        this.values.push(...(Object.values(values)))
    }

    update(data){
        const keys = Object.keys(data).map(e => `${e}=?`).join(",")
        this.queryBase += `SET ${keys} `
        this.values.push(...Object.values(data))
    }

    delete(dClass){
        const name = (new dClass()).getName()
        this.queryBase += " FROM " + name +" "
    }


    orderBy(field,direction){
        const expression = ` ORDER BY ${field} ${direction}`
        this.orderByExpression = expression;
        return this;
    }

    limit(amount){
        this.limitExpression = ` limit ${amount}`;
        return this;
    }

    skip(amount) {
        this.skipExpression = ` offset ${amount}`
        return this;
    }

    graterThan(field,value){
        const expression = `${field} > ?`
        this.values.push(value)
        this.filters.push(expression)

        return this;
    }

    lessThan(field,value){
        const expression = `${field} < ?`
        this.values.push(value)
        this.filters.push(expression)

        return this;
    }

    endFiltering(){
        return this;
    }

    setUpdateValues(dClass,values){}

    equals(fieldName,value){
        const constraints = ` ${fieldName}=? `
        this.values.push(value)
        this.filters.push(constraints)
        return this;
    }

    notEqual(fieldName,value){
        const constraints = ` ${fieldName}=?`
        this.values.push(value)
        this.filters.push(constraints)
        return this;
    }

    like(fieldName,value,position){
        let pattern = position;
        switch (position){
            case LikePatterns.CONTAINS:
                pattern = '%?%'
                break;
            case LikePatterns.STARTS_WITH:
                pattern = '%?'
                break;
            case LikePatterns.ENDS_WITH:
                pattern = '?%'
                break;
            default:
                pattern = position;
                break
        }
        const expression = ` ${fieldName} LIKE ?`
        this.filters.push(expression)
        this.values.push(pattern.replace("?",value))
    }



    build(){
        if(this.filters.length > 0 ){
            this.queryBase += this.filters.join(" and ")
        }

        this.queryBase += this.orderByExpression;
        this.queryBase += this.limitExpression;
        this.queryBase += this.skipExpression;

        return {query:this.queryBase,values:this.values}

    }


    innerJoin(joinTable,fieldNameOne,fieldNameTwo)    {
        this.queryBase += `Inner join ${joinTable} ON ${fieldNameOne}=${fieldNameTwo}`
    }

    leftJoin(joinTable,fieldNameOne,fieldNameTwo)    {
        this.queryBase += `left join ${joinTable} ON ${fieldNameOne}=${fieldNameTwo}`
    }

    rightJoin(joinTable,fieldNameOne,fieldNameTwo)    {
        this.queryBase += `right join ${joinTable} ON ${fieldNameOne}=${fieldNameTwo}`
    }

    fullJoin(joinTable,fieldNameOne,fieldNameTwo)    {
        this.queryBase += `full outer join ${joinTable} ON ${fieldNameOne}=${fieldNameTwo}`
    }



}

module.exports = {MySQLQuery,LikePatterns,ACTION_TYPES,toMySQLDateTime,ORDER_DIRECTIONS}


