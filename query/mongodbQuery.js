const {Query}  = require("./Query");
const {DataClassFactory} = require("../dataclasses/base")
const {DATABASE_TYPES, Databases} = require("../databases");


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


function likePatternToRegex(likePattern,value){
    let expression = ''
    switch (likePattern) {
        case LikePatterns.STARTS_WITH:
            expression = ('^'+value)
            break;

        case LikePatterns.ENDS_WITH:
            expression = (value+"$")
            break;

        case LikePatterns.CONTAINS:
            expression = value

        default:
            expression = ''

    }
    return expression;
}


class MongodbQuery extends Query {


    constructor(dClass) {
        super();
        this.dClass = dClass;
        this.equalFilter = {}
        this.lessThanFilter = {}
        this.likeFilter = {}
        this.greaterThanFilter = {}
        this.likeFilterPositions = {}
        this.actionType = null;
    }

    setActionType(type) {
        this.actionType = type;
        return this;
    }

    setSelectingFields(fields) {
        this.selectedFields = fields;
        this.removableFields = null;
        return this;
    }

    setRemovableFields(fields) {
        this.removableFields = fields;
        this.selectedFields = null;
        return this;
    }

    startFiltering() {
        return this;
    }

    setTableName(dClass) {
        return this;
    }

    endFiltering() {
        return this;
    }

    insert(values) {
        this.insertValues = values;
        return this;
    }

    setUpdateValues(values) {
        this.updateValues = values;
        return this;
    }

    like(field, value, position) {
        this.likeFilter[field] = value;
        this.likeFilterPositions[field] = position;
        return this;
    }

    skip(amount) {
        this.skipAmount = amount;
        return this;
    }

    limit(amount) {
        this.limitAmount = amount;
    }

    equals(field, value) {
        this.equalFilter[field] = value;
        return this;
    }

    lessThan(field, value) {
        this.lessThanFilter[field] = value;
        return this;
    }



    graterThan(field, value) {
        this.greaterThanFilter[field] = value;
        return this;
    }


    orderBy(field, direction) {
        this.orderByValue = field;
        this.orderByDirection = direction === ORDER_DIRECTIONS.ASCENDING ? 1 : -1;
        return this;
    }

    build(){
        let query = {}
        let fields = null;
        let limitSkipOrderConstraints = {}

        if(this.actionType === ACTION_TYPES.INSERT){
            query = this.insertValues;
        }else{

            //  Set Returning Fields
            fields = {}
            if(this.selectedFields){
                for(let i = 0 ; i < this.selectedFields.length ; i++){
                    fields[this.selectedFields[i]] = 1;
                }
            }else if(this.removableFields){
                for(let i = 0 ; i < this.removableFields.length ; i++){
                    fields[this.removableFields[i]] = 0;
                }

            }

            if(this.likeFilter){

                const keys = Object.keys(this.likeFilter);

                for(let i = 0 ; i < keys.length ; i++){
                    query[keys[i]] = {
                            $regex:likePatternToRegex(
                                this.likeFilter[keys[i]],
                                this.likeFilter[keys[i]]
                            )
                    };
                }


            }
            if(this.greaterThanFilter){
                const keys = Object.keys(this.greaterThanFilter);

                for(let i = 0 ; i < keys.length ; i++){
                    if(!query[keys[i]]){
                        query[keys[i]] = {}
                    }
                    query[keys[i]]['$gt'] = this.greaterThanFilter[keys[i]]
                }
            }
            if(this.lessThanFilter){
                const keys = Object.keys(this.lessThanFilter);

                for(let i = 0 ; i < keys.length ; i++){
                    query[keys[i]]['$lt'] =  this.lessThanFilter[keys[i]]
                }
            }

            if(this.equalFilter){
                const equalFilterKeys = Object.keys(this.equalFilter)
                for(let i = 0 ; i < equalFilterKeys.length;i++){
                    query[equalFilterKeys[i]] = this.equalFilter[equalFilterKeys[i]]
                }
            }

            if(this.limitAmount){limitSkipOrderConstraints['limit'] = this.limitAmount;}
            if(this.skipAmount){limitSkipOrderConstraints['limit'] = this.skipAmount;}
            if(this.orderByValue){limitSkipOrderConstraints['sort'] = {[this.orderByValue] : this.orderByDirection};}



        }


        return {query,values:{fields,limitSkipOrderConstraints,dClass:this.dClass,updateValues:this.updateValues}};

    }

}

module.exports = {ACTION_TYPES,DATABASE_TYPES,MongodbQuery,LikePatterns,ORDER_DIRECTIONS}