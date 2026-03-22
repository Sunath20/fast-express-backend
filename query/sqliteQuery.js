const {Query} = require("./Query")

const uuid = require("uuid")
const {dataClassToName} = require("../utils/dataclassToName");
const {RELATION_TYPES} = require("../databases/relations");
const {DataClass} = require("../dataclasses/base");
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


function toSQLLiteDateTime(date) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, '0') + "-" +
        String(date.getDate()).padStart(2, '0') + " " +
        String(date.getHours()).padStart(2, '0') + ":" +
        String(date.getMinutes()).padStart(2, '0') + ":" +
        String(date.getSeconds()).padStart(2, '0');
}




class SqliteQuery extends Query {

    constructor(dClass,dType) {
        super();
        this.dClass = dClass;
        this.dType = dType;
        this.values = []
        this.filterValues = []
        this.filters = []
        this.queryBase = ''
        this.orderByExpression = ''
        this.limitExpression = ''
        this.skipExpression = ''
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
        this.filterValues.push(value)
        this.filters.push(expression)

        return this;
    }

    lessThan(field,value){
        const expression = `${field} < ?`
        this.values.push(value)
        this.filterValues.push(value)
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
        this.filterValues.push(value)
        this.filters.push(constraints)
        return this;
    }


    notEquals(fieldName,value){
        const constraints = ` ${fieldName}!=?`
        this.filters.push(constraints)
        this.filterValues.push(value)
        this.values.push(value);
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
        this.filterValues.push(value)
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
     * @param filter {SqliteQuery}
     * @param relationColumn {Object}
     * @returns {Promise<void>}
     */
    async runPreloadQuery(db,dataClass,foreignKey,idList,filter,relationColumn,parentClass){

        if(relationColumn.relation === RELATION_TYPES.MANY_TO_MANY){

            const relationClass = parentClass
            const {columnOne,columnTwo,tableName} = getManyToManyInfo(dataClass,parentClass)
            const relationTableName = dataClassToName(relationClass)
            const template = `SELECT * FROM ${dataClassToName(dataClass)} INNER JOIN ${tableName} ON ${tableName}.${columnOne} = ${dataClassToName(dataClass)}._id WHERE ${tableName}.${columnTwo} IN (${idList.map((e,i) => '?')})`
            const data =  await db.runQuery(ACTION_TYPES.SELECT,template,idList)
            console.log("Getting many to many ",template,data)
            return data
        }
        const tableName = dataClassToName(dataClass)
        let filtersTemplate = ''
        if(filter){
            filtersTemplate += filter.filters.join(" and ")
            filtersTemplate += " and "
        }

        const startFrom = filter ? filter.values.length + 1 : 1

        const queryTemplate = `SELECT * FROM ${tableName} WHERE  ${filtersTemplate}  ${foreignKey} IN (${idList.map((_,i) =>( "?") ).join(",")}) `
        console.log("running the other way  ",queryTemplate,idList)
       const data =  await db.runQuery(ACTION_TYPES.SELECT,queryTemplate,[...(filter ? filter.filterValues : []),...idList])
        console.log(data)
        return data
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

                    let data = currentMap.get(key);
                    data = Array.isArray(data) ? data : [data]

                    data.forEach(dataPoint => {

                        const relationalID = dataPoint[foreignKey]
                        let upwardData = previousMap.get(relationalID)
                        upwardData = Array.isArray(upwardData) ? upwardData : [upwardData]

                        upwardData.forEach(upwardDataPoint => {
                            if(!upwardData){return}
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

        const results = await db.runQuery(ACTION_TYPES.SELECT,query, values)

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
                    const data = await this.runPreloadQuery(db,dataClass,foreignKey,currentIDLIST,filter,relationColumn,parentClass)

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
                    currentPreloadData.push(currentMap)
                    currentIDLIST = data.map(e => e['_id'])
                }catch(error){
                    console.log(error)
                    throw new Error("Could not Preload data")
                }


            }
            preloadData.push(currentPreloadData)
            currentIDLIST = idLIST
        }
        console.log(preloadData)
        this.attachDepthItems(preloadData)
        for(let i = 0 ; i < preloadData.length ; i++){
            console.log(this.preloadChain[i])
            const preloads = preloadData[i]
            const {foreignKeys}= this.preloadChain[i]
            console.log("This is the current foreign key ",foreignKeys)
            const foreignKey = foreignKeys[0]
            const settingField = this.preloads[i][0]
            const instance = new this.dClass()
            const isDirectly = instance[settingField].relation === RELATION_TYPES.HAS_ONE
            if(!preloads)continue;
            for(const key of  preloads.keys()){
                const item = preloads.get(key)
                if(Array.isArray(item)){
                    item.forEach( i => {
                        const upperIndex = i[foreignKey]
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

module.exports = {SqliteQuery,LikePatterns,ACTION_TYPES,toSQLLiteDateTime,ORDER_DIRECTIONS}


