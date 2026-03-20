const {Query} = require("./Query")
const uuid = require("uuid")
const {dataClassToName} = require("../utils/dataclassToName");
const {RELATION_TYPES} = require("../databases/relations");
const {DataClass} = require("../dataclasses/base");

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



    preloads = []
    preloadChain = []
    preload(relation){
        const parts = relation.split(".")
        this.preloads.push(parts)
        const classes = [this.dClass]
        const foreignKeys = []
        for(let i = 0 ; i < parts.length ; i++){
            classes.push((new classes[i])[parts[i]].dataClass)
            foreignKeys.push(findForeignKey(classes[i],classes[i+1]))
        }
        this.preloadChain.push({classes,foreignKeys})

        return this;
    }

    /**
     * Get the data from preloads
     * @param db {PostgresDatabase}
     * @param dataClass {DataClass}
     * @param foreignKey {String}
     * @param idList {String[]}
     * @returns {Promise<void>}
     */
    async runPreloadQuery(db,dataClass,foreignKey,idList){
        const tableName = dataClassToName(dataClass)
        const queryTemplate = `SELECT * FROM ${tableName} WHERE ${foreignKey} IN (${idList.map((_,i) =>( "?") ).join(",")})`
        return await db.runQuery(queryTemplate,idList)
    }

    /**
     *
     * @param mainResult Object[]
     * @param preloadedData Object[[]]
     * @returns {Promise<void>}
     */
    attachDepthItems(preloadedData){
        for(let i = 0 ; i < this.preloadChain.length ; i++){
            const {classes,foreignKeys} = this.preloadChain[i]

            for(let j = foreignKeys.length - 1; j >0 ; j--){
                const previousMap = preloadedData[i][j-1]
                const currentMap = preloadedData[i][j]
                if(!currentMap){continue}
                const accessibleField = this.preloads[i][j]

                const dataClass = classes[j]
                const obj = new dataClass()
                const column = obj[accessibleField]
                const foreignKey = foreignKeys[j]

                let setDirectly = column.relation === RELATION_TYPES.HAS_ONE

                for(const key of currentMap.keys()){

                    const data = currentMap.get(key)
                    const relationalID = data[foreignKey]
                    const upwardData = previousMap.get(relationalID)

                    if(!upwardData){continue}
                    const upwardDataField = this.preloads[i][j]
                    if(setDirectly){

                        upwardData[upwardDataField] = data
                        previousMap.set(relationalID,upwardData);
                    }else{
                        if(!upwardData[upwardDataField]){
                            upwardData[upwardDataField] = []
                            previousMap.set(relationalID,upwardData)
                        }else{
                            upwardData[upwardDataField].push(data)
                        }
                    }
                }
            }


            preloadedData[i] = preloadedData[i][0]
        }

    }

    /**
     *
     * @param db {MySqlDatabase}
     * @returns {Promise<any[]>}
     */
    async execute(db){
        const instance = new this.dClass()
        const {query, values} = this.build()

        const results = await db.runQuery(query, values)

        const resultMap = new Map()
        results.forEach(result => {
            resultMap.set(result['_id'],result)
        })
        let currentIDLIST = results.map(result => result['_id'])

        const preloadData = []
        for(let i = 0 ; i < this.preloadChain.length;i++){
            const {classes,foreignKeys} = this.preloadChain[i]
            const currentPreloadData = []
            for(let j = 0 ; j < foreignKeys.length; j++){
                if(currentIDLIST.length === 0){
                    break;
                }

                const foreignKey = foreignKeys[j]
                const dataClass = classes[j + 1]
                try{
                    const data = await this.runPreloadQuery(db,dataClass,foreignKey,currentIDLIST)

                    const currentMap = new Map()
                    data.forEach(result => {
                        currentMap.set(result['_id'],result)
                    })
                    currentPreloadData.push(currentMap)
                    currentIDLIST = data.map(e => e['_id'])
                }catch(error){
                    console.log(error)
                    throw new Error("Could not Preload data")
                }


            }
            preloadData.push(currentPreloadData)
        }

        this.attachDepthItems(preloadData)

        for(let i = 0 ; i < preloadData.length ; i++){

            const preloads = preloadData[i]
            const {foreignKeys}= this.preloadChain[i]
            const foreignKey = foreignKeys[i]
            const settingField = this.preloads[i][0]
            const instance = new this.dClass()
            const isDirectly = instance[settingField].relation === RELATION_TYPES.HAS_ONE
            if(!preloads)continue;
            for(const key of  preloads.keys()){
                const item = preloads.get(key)

                const upperIndex = item[foreignKey]
                const resultItem = resultMap.get(upperIndex)
                if(isDirectly){
                    resultItem[settingField] = item
                }else{
                    if(!resultItem[settingField]){
                        resultItem[settingField] = []
                        resultMap.set(upperIndex, resultItem)
                    }
                    resultItem[settingField].push(item)
                }
            }
        }

        return  Array.from(resultMap.values())
    }

}


function findForeignKey(parentClass,childClass){
    const instance  = new childClass()
    const {columns} = DataClass.getColumnsAndRelationFields(childClass)
    const col = columns.find(e => instance[e].isRelation && instance[e].parentDataClass === parentClass)
    if(!col){
        throw new Error("Unable to find the relation between parent and child ",parentClass,childClass)
    }
    return col;
}

module.exports = {MySQLQuery,LikePatterns,ACTION_TYPES,toMySQLDateTime,ORDER_DIRECTIONS}


