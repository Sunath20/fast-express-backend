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


function toPostgresqlDateTime(date) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, '0') + "-" +
        String(date.getDate()).padStart(2, '0') + " " +
        String(date.getHours()).padStart(2, '0') + ":" +
        String(date.getMinutes()).padStart(2, '0') + ":" +
        String(date.getSeconds()).padStart(2, '0');
}




class PostgresqlQuery extends Query {

    constructor(dClass,dType) {
        super();
        this.dClass = dClass;
        this.dType = dType;
        this.values = []
        this.filters = []
        this.queryBase = ''
        this.orderByExpression = ''
        this.limitExpression = ''
        this.skipExpression = ''
        this.valueIndex = 1;
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

    distinct(fieldName){
        this.queryBase += ` DISTINCT ${fieldName} FROM `
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

    updateIndex(){
        this.valueIndex += 1;
    }

    insert(values){
        values['_id'] = uuid.v4();
        const insertIntoExpression = "( " + Object.keys(values).map(e => `${e}`).join(',') + " )"
        this.valueIntoExpressionMapFunc = e => {
            console.log(this)
            const expression = `$${this.valueIndex}`
            this.updateIndex()
            return expression
        }
        this.valueIntoExpressionMapFunc = this.valueIntoExpressionMapFunc.bind(this)
        const valueIntoExpression = " VALUES (" + Object.keys(values).map(this.valueIntoExpressionMapFunc).join(",") +")";

        this.queryBase += insertIntoExpression + valueIntoExpression
        this.values.push(...(Object.values(values)))
    }

    update(data){
        this.updateKeys = e => {
            const expression = `${e}=$${this.valueIndex}`
            this.updateIndex();
            return expression;
        }
        this.updateKeys = this.updateKeys.bind(this)

        const keys = Object.keys(data).map(this.updateKeys).join(",")

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

    graterThan(field,value,date=false){
        const expression = `${field} > $${this.valueIndex}${date ? "::timestamp" : ''}`
        this.values.push(value)
        this.filters.push(expression)
        this.updateIndex()
        return this;
    }

    lessThan(field,value,date=false){
        const expression = `${field}${date ? "::timestamp" : ""} < $${this.valueIndex}`
        this.values.push(value)
        this.filters.push(expression)

        this.updateIndex()

        return this;
    }

    endFiltering(){
        return this;
    }

    setUpdateValues(dClass,values){}

    equals(fieldName,value){
        const constraints = ` ${fieldName}=$${this.valueIndex}`
        this.values.push(value)
        this.filters.push(constraints)
        this.updateIndex()
        return this;
    }

    notEqual(fieldName,value){
        const constraints = ` ${fieldName}=$${this.valueIndex}`
        this.values.push(value)
        this.filters.push(constraints)
        this.updateIndex();
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
        const expression = ` ${fieldName} LIKE $${this.valueIndex}`
        this.filters.push(expression)
        this.values.push(pattern.replace("?",value))
        this.updateIndex()
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

module.exports = {PostgresqlQuery,LikePatterns,ACTION_TYPES,toPostgresqlDateTime,ORDER_DIRECTIONS}


