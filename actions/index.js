

const getItems = require("./getActions")
const postItems = require("./postActions")
const errors = require("./errors")
const putItems = require("./putActions")
const deleteItems = require("./deleteActions")
module.exports = {...errors,...getItems,...postItems,...putItems,...deleteItems}