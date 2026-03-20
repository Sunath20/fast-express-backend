const RELATION_TYPES = {
    HAS_MANY:"HAS_MANY",
    HAS_ONE:"HAS_ONE",
    MANY_TO_MANY:"MANY_TO_MANY",
    BELONGS_TO:"BELONGS_TO"
}

const ON_DELETE = {
    CASCADE: "CASCADE",
    SET_NULL: "SET NULL",
    RESTRICT: "RESTRICT",
    NO_ACTION: "NO ACTION",
    SET_DEFAULT: "SET DEFAULT"
}

function relationWrapper(object,relation){
    return {...object,isRelation:true,relation};
}

function hasMany(childDataClass){
    return relationWrapper({dataClass:childDataClass,createColumn:false},RELATION_TYPES.HAS_MANY)
}

function hasOne(childDataClass){
    return relationWrapper({dataClass: childDataClass,createColumn: false},RELATION_TYPES.HAS_ONE)
}

function manyToMany(otherClass){
    return relationWrapper({dataClass:otherClass,createColumn:false},RELATION_TYPES.MANY_TO_MANY)
}

function belongsTo(parentDataClass,parentColumn,unique,onDeletion,type,metaData={}){
    return relationWrapper({parentDataClass,unique,createColumn:true,metaData,column:parentColumn,sqlType:type,onDeletion},RELATION_TYPES.BELONGS_TO)
}

module.exports = {hasMany,hasOne,manyToMany,belongsTo,RELATION_TYPES,ON_DELETE}