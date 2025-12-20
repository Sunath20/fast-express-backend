class Query {
    setActionType(type){}
    setSelectingFields(fields){}
    setTableName(dClass){}
    startFiltering(){}
    endFiltering(){}
    insert(dClass,values){}
    orderBy(field,direction){}
    limit(lim){}
    skip(amount){}
    graterThan(field,value){}
    lessThan(field,value){}
    setUpdateValues(values){}
    equals(field,value){}
    like(field,value,position){}
    build(){}
}


module.exports = {Query}