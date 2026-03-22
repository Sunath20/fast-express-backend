const {Query} = require("./Query")
const uuid = require("uuid")
const {DataClass} = require("../dataclasses/base");
const {dataClassToName} = require("../utils/dataclassToName");
const {RELATION_TYPES} = require("../databases/relations");
const {getManyToManyInfo} = require("../utils/manyToMany");

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


class Node {
    constructor(value) {
        this.value = value
        this.next = null;
    }
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

    preloads = []
    preloadChain = []

    preload(relation,filters={}){
        const parts = relation.split(".")
        this.preloads.push(parts)
        const classes = [this.dClass]
        const foreignKeys = []
        for(let i = 0 ; i < parts.length ; i++){
            classes.push((new classes[i])[parts[i]].dataClass)
            foreignKeys.push(findForeignKey(classes[i],classes[i+1]))
        }
        this.preloadChain.push({classes,foreignKeys,filters})

        return this;
    }

    /**
     * Get the data from preloads
     * @param db {PostgresDatabase}
     * @param dataClass {DataClass}
     * @param foreignKey {String}
     * @param idList {String[]}
     * @param filter {PostgresqlQuery}
     * @returns {Promise<void>}
     */
    async runPreloadQuery(db,dataClass,foreignKey,idList,filter,relationColumn,parentClass){
        const mapper = buildFieldMapper(dataClass)
        if(relationColumn.relation === RELATION_TYPES.MANY_TO_MANY){
            const relationClass = parentClass
            const {columnOne,columnTwo,tableName} = getManyToManyInfo(dataClass,parentClass)
            const relationTableName = dataClassToName(relationClass)
            const template = `SELECT * FROM ${dataClassToName(dataClass)} INNER JOIN ${tableName} ON ${tableName}.${columnOne} = ${dataClassToName(dataClass)}._id WHERE ${tableName}.${columnTwo} IN (${idList.map((e,i) => `$${i+1}`)})`
            const data =  await db.runQuery(template.toLowerCase(),idList)
            return data.map(e => remapFields(e,mapper))
        }
        const tableName = dataClassToName(dataClass)
        const filterQuery = (filter && filter.filters.length > 0 ) ? filter.filters.join(" and ").toLowerCase() + " and " : ""
        const startFrom = filter ? filter.values.length +1 : 1
        const queryTemplate = `SELECT * FROM ${tableName} WHERE ${filterQuery} ${foreignKey} IN (${idList.map((_,i) =>( "$"+(i+startFrom)) ).join(",")})`
        const data =  await db.runQuery(queryTemplate,[...(filter ? filter.values : [] ),...idList])
        return data.map(e => remapFields(e,mapper))
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

                let setDirectly = column.relation ===  RELATION_TYPES.HAS_ONE
                let manyToMany = column.relation === RELATION_TYPES.MANY_TO_MANY

                for(const key of currentMap.keys()){

                    let data = currentMap.get(key);
                    data = Array.isArray(data) ? data : [data]

                    data.forEach(dataPoint => {

                        const relationalID = dataPoint[foreignKey]

                        if(manyToMany){
                            delete dataPoint[foreignKey]
                        }

                        let upwardData = previousMap.get(relationalID)
                        upwardData = Array.isArray(upwardData) ? upwardData : [upwardData]

                        upwardData.forEach(upwardDataPoint => {
                            if(!upwardDataPoint){return}
                            const upwardDataField = this.preloads[i][j]
                            if(setDirectly){
                                upwardDataPoint[upwardDataField] = dataPoint
                                // previousMap.set(relationalID,upwardData);
                            }else{
                                if(!upwardDataPoint[upwardDataField]){
                                    upwardDataPoint[upwardDataField] = [dataPoint]
                                }else{
                                    upwardDataPoint[upwardDataField].push(dataPoint)
                                }
                            }

                        })

                        previousMap.set(relationalID,upwardData)

                    })




                }
            }


            preloadedData[i] = preloadedData[i][0]
        }

    }

    /**
     *
     * @param db {}
     * @returns {Promise<any[]>}
     */
    async execute(db){
        console.log(this.preloadChain)
        const instance = new this.dClass()
        const {query, values} = this.build()
        const mapper = buildFieldMapper(this.dClass)

        let results = await db.runQuery(query, values)
        results = results.map(e => remapFields(e, mapper))

        const resultMap = new Map()
        results.forEach(result => {
            resultMap.set(result['_id'],result)
        })
        const idLIST  = results.map(result => result['_id'])
        let currentIDLIST = idLIST

        const preloadData = []
        for(let i = 0 ; i < this.preloadChain.length;i++){
            const {classes,foreignKeys,filters} = this.preloadChain[i]

            const currentPreloadData = []
            for(let j = 0 ; j < foreignKeys.length; j++){
                const filter = filters[this.preloads[i][j]]
                if(currentIDLIST.length === 0){
                    break;
                }

                const foreignKey = foreignKeys[j]
                const parentClass = classes[j]
                const dataClass = classes[j + 1]
                const parentClassInstance = new parentClass()
                const relationColumn  = parentClassInstance[this.preloads[i][j]]
                const isManyToMany = relationColumn.relation === RELATION_TYPES.MANY_TO_MANY
                try{
                    console.log("Gonna run the query base on",foreignKey, " for ",dataClassToName(dataClass))
                    const data = await this.runPreloadQuery(db,dataClass,foreignKey,currentIDLIST,filter,relationColumn,parentClass)
                    // console.log("Got the output data as ",data)
                    const currentMap = new Map()

                    let index = 0
                    data.forEach((result) => {
                        if(!isManyToMany){
                            currentMap.set(result['_id'],result)
                            return;
                        }
                        if(!currentMap.has(result['_id'])){
                            currentMap.set(result['_id'],[result])
                        }else{
                            currentMap.get(result['_id']).push(result)
                        }
                    })
                    console.log("Here is the map we got ",currentMap)
                    currentPreloadData.push(currentMap)
                    currentIDLIST = data.map(e => e['_id'])
                    console.log(currentIDLIST)
                }catch(error){
                    console.log(error)
                    throw new Error("Could not Preload data")
                }


            }
            preloadData.push(currentPreloadData)
            currentIDLIST = idLIST
        }

        this.attachDepthItems(preloadData)
        for(let i = 0 ; i < preloadData.length ; i++){

            const preloads = preloadData[i]
            const {foreignKeys}= this.preloadChain[i]
            console.log("This is the current foreign key ",foreignKeys)
            const foreignKey = foreignKeys[0]
            const settingField = this.preloads[i][0]
            const instance = new this.dClass()
            const isDirectly = instance[settingField].relation === RELATION_TYPES.HAS_ONE
            const manyToMany = instance[settingField].relation === RELATION_TYPES.MANY_TO_MANY
            if(!preloads)continue;
            for(const key of  preloads.keys()){
                const item = preloads.get(key)
                if(Array.isArray(item)){
                    item.forEach( i => {
                        if(!i)return;
                        const upperIndex = i[foreignKey]
                        if(manyToMany){
                            delete i[foreignKey]
                        }
                        const resultItem = resultMap.get(upperIndex)
                        if(isDirectly){
                            resultItem[settingField] = i
                        }else{
                            if(!resultItem[settingField]){
                                resultItem[settingField] = []
                                resultMap.set(upperIndex, resultItem)
                            }
                            resultItem[settingField].push(i)
                        }
                    })
                }else{
                    console.log(item,foreignKey)
                    const upperIndex = item[foreignKey]
                    const resultItem = resultMap.get(upperIndex)
                    if(!resultItem)continue;
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
        }

        return  Array.from(resultMap.values())
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

function findForeignKey(parentClass,childClass){
    const instance  = new childClass()
    const {columns,manyToManyFields} = DataClass.getColumnsAndRelationFields(childClass)
    if(manyToManyFields.length > 0 ){
        const parentInstance = new parentClass()
        const parentAttributes = DataClass.getColumnsAndRelationFields(parentClass)
        const relationalColumn =  parentAttributes.manyToManyFields.find(e => parentInstance[e].isRelation && parentInstance[e].dataClass === childClass)
        if(relationalColumn){
            return dataClassToName(parentClass) + "_id"
        }
    }

    return columns.find(e => instance[e].isRelation && instance[e].parentDataClass === parentClass)
}


function buildFieldMapper(dataClass){
    const instance = new dataClass()
    const fields = DataClass.getOwnPropertyNames(instance)
    const DEFAULT_FIELD_MAPPER = {
        'createdat': 'createdAt',
        'updatedat': 'updatedAt'
    }
    const mapper = {}
    fields.forEach(field => {
        mapper[field.toLowerCase()] = field
    })
    return {...DEFAULT_FIELD_MAPPER,...mapper}
}

function remapFields(row, mapper){
    const remapped = {}
    Object.keys(row).forEach(key => {
        const originalKey = mapper[key] || key
        remapped[originalKey] = row[key]
    })
    return remapped
}

module.exports = {PostgresqlQuery,LikePatterns,ACTION_TYPES,toPostgresqlDateTime,ORDER_DIRECTIONS}


