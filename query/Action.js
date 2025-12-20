const { DATABASE_TYPES } = require("../databases");
const uuid = require("uuid")


class Filter {


    init(dClass,DatabaseType){
        this.dClass = dClass;
        this.dType = DatabaseType;
        this.predefinedFields = ['dClass','dType','predefinedFields'];
    }

    filterToString(){
        throw new Error("This must be Override by the subclass")
    }


    buildQuery(placeHolderValues,realValues) {
        const properties = Object.keys(this).filter((key) => this.predefinedFields.indexOf(key) === -1);
        const {query,values} = mySqlQuery.bind(this)(properties)
        this.replacePlaceHolders(values,placeHolderValues,realValues)
        console.log(query,values)
    }

    replacePlaceHolders(values,placeHolderValues,realValues) {
        for (let i = 0; i < placeHolderValues.length; i++) {
            const index = values.indexOf(placeHolderValues[i])
            values[i] = realValues[i]
        }
    }


}







module.exports = {Query, Filter,ACTION_TYPES,ORDER_DIRECTIONS,LikePatterns,tableDotField,MySQLQuery,toMySQLDateTime}

