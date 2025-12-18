const {DataClass} = require("../dataclasses/base")
const validators = require("../dataclasses/validators")
const {createMongoDBField} = require("../utils")

class MovieTest extends DataClass {


    name = createMongoDBField(String,false,[validators.is_required("name is required")])
    date  = createMongoDBField(Date,false,[validators.is_required("date is required")])
}


module.exports = {MovieTest}