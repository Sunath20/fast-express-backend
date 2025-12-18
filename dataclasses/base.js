const { Schema} = require("mongoose");
const mongoose = require("mongoose")
const iterateList = require("../utils/iterateAndPrint")
const checkTheObjectPromiseOrNot = require("../utils/promiseChecking");
const { typeChecking, unqiueValidator } = require("./validators");
const  {getModelObjectWithId,getAllModelsObjects,addNewObjectToCollection} = require("../actions");
const { linearFindMaxNumber } = require("../utils/linearAlogirthms");
const {getModelObjectWithPayload} = require("../actions/getActions");
const {updateTheModelWithTheId} = require("../actions/putActions");
const { Databases, DATABASE_TYPES} = require("../databases");


class DATACLASS_NAMES {
    static names;
}

function getClassName(cls){
    console.log(cls)
    if(DATACLASS_NAMES.names[cls] === undefined || DATACLASS_NAMES.names[cls] === null) {
        DATACLASS_NAMES.names[cls]= (new cls()).getName()
    }
    return  DATACLASS_NAMES.names[cls]
}

/**
 * Base class for every data class
 * 
 * Data class will be used for validating and turn dictionary into classes
 * 
 * In case you are an oop fan
 */
class DataClass{

    connection;
    classSelf;


    getRemovableFields(){
        return []
    }
    
    /**
     * A function to validate user data
     * This function must be overridden by the subclass
     */
    async validateAllData(){return {okay:true}};

    /**
     * Return the fields of the data class object
     * work as a helper method for retrieving the attributes
     * @param {DataClass} thisObj 
     * @returns 
     */
    static getOwnPropertyNames(thisObj){
        return Object.keys(thisObj).filter(e => (e != "validations" && e != "form_data" && e != "model" && e !="before_validations" && e != "after_validations" && e!="connection" && e!="classSelf" && e!="DATABASE_REPRESENTATION"))
    }
    
    /**
     * Initialize and set up the core of the data class
     * extract information about the model and extract validations.
     * Throw errors if the data isn't the way it supposed to
     */
     async init(data){
        // Get the properties out of the instance created by the factory class
        const properties = DataClass.getOwnPropertyNames(this);
        // Initialize the validations into an empty list
       let validations = {}
       // functions that should run before the running the validations
       let beforeValidationsFunctions = {}
        //  functions that should run after validation and before validations   
       let afterValidationsFunctions = {}
        // Iterate through all the properties 
        await iterateList(properties,async (property) => {
            // Set the validations of the property into a new dictionary
            // add the type checking validation by the base class
            validations[property] =  [
                typeChecking(this[property]['type'],property),
            ...(this[property]['validations'] ||[])]

            // add the unique validator if we have the unique in the property attributes
            if(this[property]['unique']){
                // console.log(property,this.model)
                const newValidator = async function(value) {
                    return new Promise( (async (resolve,reject) => {
                        // console.log(this)
                        const table = ["mongodb","postgresql","mysql"].indexOf(this.connection.toString()) > -1  ? this.classSelf : this.getName()
                        const response =await  this.connection.find(table,{[property]:value})

                        if(!response || response.length === 0){
                            resolve({okay:true})
                        }else{
                            resolve({okay:false,error:`${property} is already taken`})
                        }
                    }).bind(this) )
                }
                validations[property].push(newValidator.bind(this))
            }
            // collect the beforeValidations
            // console.log(this[property])
            if(this[property]['beforeValidation']){
                data[property] = await this[property]['beforeValidation'](data[property])
                beforeValidationsFunctions[property] = this[property]['beforeValidation']
            }
            // collect the afterValidation
            if(this[property]['afterValidation']){
                afterValidationsFunctions[property] = this[property]['afterValidation']
            }
        })

        // Define the validations in the object properites 
        //and set it to the extracted validations
        Object.defineProperty(this,'validations',{
            get:() => validations
        })

        // set the before_validations functions in the object
        Object.defineProperty(this,'before_validations',{
            get:() => beforeValidationsFunctions
        })

        // set the after_validations functions in the object
        Object.defineProperty(this,"after_validations",{
            get:() => afterValidationsFunctions
        })

        // console.log("before validation functions ",beforeValidationsFunctions)

        // define the form data in the object
        Object.defineProperty(this,'form_data',{
            get:() => data
        })


    }

    async transformValidateDataToBeSaved(validatedData){
        // console.log(this.after_validations, " validations ")
        const keys = Object.keys(this.after_validations)
        const obj = Object.assign({},validatedData)
        for(let i = 0 ; i < keys.length;i++){

            obj[keys[i]] = await this.after_validations[keys[i]](validatedData[keys[i]])
        }
    return obj
    }



    /**
     * validate the fields in the data class 
     * @returns {Object}
     */
    async validate(){
       if(!this.form_data || Object.keys(this.form_data).length == 0){
        return {data:{okay:false,error:"Data isn't given"}}
       }
        // Get the all fields of the validations in the class
        const validateKeys = DataClass.getOwnPropertyNames(this.validations);
        // gather information about how many validations owns by one by one
        const lengths = validateKeys.map(e => this.validations[e].length)
        // Start to calculate the maximum rounds we need to go
        let maxRounds = 0 ;
        let i = 0 ;
        // loop through lengths to find the maximum length
        for(i =  0;  i < lengths.length;i++){
            // set the maximum
            maxRounds = maxRounds < lengths[i] ? lengths[i] : maxRounds
        }

        // Start executing validations
        for(i=0; i < maxRounds;i++){
            // Get single validator from a field
            for(let j = 0 ; j < lengths.length;j++){
                // Grab the validation of specific key
                const element_validations = this.validations[validateKeys[j]];
                // if the validations are complete continue to the next one
                if(i >= element_validations.length)continue
                // grab the validations next function
                const validation  = element_validations[i]
                // if before validation is available run it before validate the data
                let validateInput = this.form_data[validateKeys[j]]
               
                if(this.before_validations[validateKeys[j]]){
                    validateInput =  await this.before_validations[validateKeys[j]](validateInput)
                }
                // validate it
                const outputPromise = validation(validateInput)
                // Check weather our output is correct or not
                if(!checkTheObjectPromiseOrNot(outputPromise))throw new NotReturnPromiseError("promised object must be returned");

                try {
                    // Get the promise data
                    const data = await outputPromise;
                    // console.log(data)
                    // if data is not okay return a payload else return nothing of course
                    if(!data.okay){
                        return {data:data,field:validateKeys[j]}
                    }
                }catch (e){
                    console.log(e)
                }

            }
        }

        const finalValidation = await this.validateAllData()
        return {data:finalValidation}

    }

    /**
     * this only takes the data given and check the data is okay according to the model
     * validations done just like the normal validate function in the model
     * but the other fields that are not in payload will not be cared
     * suitable for run before updating data releated to a model
     * of course it means you should do it no matter what if you like to write code
     * @param {Object} payload - key value pair 
     * @returns {Object || Null} return an Object which contains error data or null if there's no errors
     */
    async validateOnlyPayload(payload){
      
        // get the fields that has to be validated
        const validateFields = Object.keys(payload)

        function getTheLengthOfValidateField(field){
            return this.validations[field] ? this.validations[field].length : 1
        }
        // get the maximum loops we have to run 
        const maximumNumber = linearFindMaxNumber(validateFields,getTheLengthOfValidateField.bind(this));
        //
        for(let i = 0; i < maximumNumber;i++){
            for(let j = 0 ; j < validateFields.length;j++){
                // get the field that needs to be validated
                const validateField = this.validations[validateFields[j]];
                // check wether it has run all the validations
                // if it is continue to next field;
            
                if(validateField.length <= i ){
                    continue;
                }
                // else get the next validation function
                const validation = validateField[i];
                // extract the value to pass to the validation function
                const validateValue = this['form_data'][validateFields[j]]
                // get the returned promise
                const validatePromise = validation(validateValue);
                // check weather output matches with our pattern
                // user must return a promise
                if(!checkTheObjectPromiseOrNot(validatePromise)){
                    throw new NotReturnPromiseError("A promise should be returned;");
                }
                // if all clear wait till the validated output
                const validatedOutput = await validatePromise
                // it it's not okay return the error data and the field
                if(!validatedOutput.okay){
                    return {data:validatedOutput,field:validateFields[j]}
                }             
            }
        }

        // all ran successfully
        return {data:{okay:true}};
    }

    getName(){
        throw new NotReturnPromiseError("getName function must be override by the subclass")
    }

    /**
     * 
     * @param {Boolean} timestamps - use to declare weather you need default timestamps or not
     * @returns 
     */
    buildModel(timestamps=true){
        const properties = DataClass.getOwnPropertyNames(this)
        const shcemaObject = {}
        for(let i = 0 ; i < properties.length;i++){
            const propertyName = properties[i]
            const attributes = this[propertyName]
            if(attributes['validations']){
                delete attributes['validations']
            }
            shcemaObject[propertyName] = attributes
        }
        const schema = new Schema(shcemaObject,{timestamps:timestamps});
        const model = mongoose.model(this.getName(),schema) 
        return model;
    }

}

/**
 * This error mainly be thrown by the DataClassFactory
 * 
 * It will be thrown if you give factory something that not extends from DataClass
 */
class InvalidDataClassError extends Error{}



/**
 * This error mainly be thrown by the validate function
 * the validation function must return a promise
 * wether it requires query or not
 * otherwise the error NotReturnPromiseError will occure
 */
class NotReturnPromiseError extends Error{}


/**
 * This error mainly cause when you don't override functions you have to
 * Especially you should override dataclass function call getName
 * @example
 * class DummyData extends DataClass{
 * 
 *      name = {
 *          type:String
 *      }
 * 
 *      getName(){
 *      return "dummy_data"     
*        }
 * }
 * 
 */
class MustBeOverrideByTheSubclass extends Error {}

/**
 * Base Factory for Data class 
 * It can be used to create objects and 
 * # Wrtie more document please
 */
class DataClassFactory{

    // Store the subclass of the DataClass
    dataClass;
    model;
    removeByDefaultFields = [];
    // removeFields = []

    static models = {}

    // Mainly used to get the subclass
    constructor(dataClass,metaData,removeFields){
        this.dataClass = dataClass;

        // this.model = this.getModel()
        this.metaData = metaData;
        this.dataBaseRepresentation = metaData['DATABASE']
        this.tableName = [DATABASE_TYPES.MONGODB,DATABASE_TYPES.POSTGRES,DATABASE_TYPES.MYSQL].indexOf(this.dataBaseRepresentation) > -1 ? dataClass : (new dataClass()).getName()
        if(!this.dataBaseRepresentation){
            throw new Error("Data base representation must be passed down")
        }
        this.connection = Databases.connections[this.dataBaseRepresentation]
        if(!this.connection){
            throw new Error("Database connection must be initialized to work with data class factory")
        }
        this.removeByDefaultFields = new this.dataClass().getRemovableFields() || []
        // console.log(this.model)
        this.getModelObjectById = this.getModelObjectById.bind(this)

        // console.log("remove fields are these",removeFields)

    }
   
    /**
     * 
     * @param {Object} data - A javascript object containing user data
     * @returns {DataClass} - the subclass 
     */
    async createObject(data){
        // Init a new object
        let object = new this.dataClass()
         //set the model
        object.model = this.model
        object.classSelf = this.dataClass
        object.connection = this.connection

        // Check wether object is a data class or not
        if(!(object instanceof DataClass))throw new InvalidDataClassError("Data class is invalid");
        // extract field information
        await object.init(data)
        // set the attriubute values
        iterateList(DataClass.getOwnPropertyNames(object),(e) => {
    
            object[e] = data ? data[e] ? data[e] : undefined : undefined
        })
        // return the customize object
        return object

    }

 

    getModel(){
        const c  = new this.dataClass()
        if(!DataClassFactory.models[c.getName()]){
            const timestamps = this.metaData ? this.metaData['timestamps'] : true
            DataClassFactory.models[c.getName()] = c.buildModel(timestamps)
        }
        return DataClassFactory.models[c.getName()];
    }

    // Create new class factory to the given class
    static createFactory(cls,metaData,removeFields=[]){
        const c =  new DataClassFactory(cls,metaData,removeFields);
        // c.removeByDefaultFields = removeFields
        return c
    }

    /**
     * get an object of a given id
     * if the id is not found throw an error
     * In case of an internal server error occurred a expection will be thrown(InternalServerError)
     * Moreover if the object with that given id does not exsit an exception will be thrown(ModelWithIdNotFound)
     * @param {String} id 
     * @returns 
     */
    getModelObjectById(id,removeColumns=null,onlyColumns=null){
        const o = new  this.dataClass()
        // console.log(this.removeByDefaultFields)
        // return getModelObjectWithId(this.getModel(),id,onlyColumns || this.getModelFieldsExpect(removeColumns || o.getRemovableFields()))
        // this.removeByDefaultFields = [ 'password']
        return getModelObjectWithId(this.getModel(),id,this.getModelFieldsExpect(removeColumns || this.removeByDefaultFields))
    }

    setRemovableFields(f){
        this.fields = f
    }

    /**
     * Get the all objects with a limit and a skip
     * mostly used to retrive data for data tables
     * with the limit and skip
     * @param {Number} limit 
     * @param {Number} skip 
     * @returns 
     */
    getModelObjectsWithAll(limit=10,skip=0){
        return this.connection.find((new this.dataClass()).getName(),null,true,limit,skip )
    }

    /**
     * Get the model with the filter you want
     * filter must passed as key - value pairs
     * @param {Object} query - query object
     * @returns 
     */
    getModelWithPayload(query,limit=10,skip=0){
        return this.connection.find((new this.dataClass()).getName(),query,true,limit,skip)
    }

    /**
     * create a new object of the data class in the database
     * @param {Object} validatedData - data that gone through the data class validation process
     * @returns {Promise<Object>}
     */
    createModelObject(validatedData){
        console.log(this.tableName)
            return this.connection.createObject(this.tableName,validatedData)
    }


    /**
     * Update the model belong the factory class
     * query will be executed through model and find the object exist
     * then the payload will be checked with their validations only
     * if no error occur model will be updated
     *  @param query
     * @param payload
     * @returns {Promise<void>}
     */
    async updateModelObject(query,payload,limit=10,skip=0){
        try{
            console.log(query,payload)
            const dataClass1 = new this.dataClass()
            dataClass1.classSelf = this.dataClass
            dataClass1.connection = this.connection;
            await dataClass1.init(payload)
            // validate the payload data
            const response = await dataClass1.validateOnlyPayload(payload)
            // transform data before saving
            const transformedData = await dataClass1.transformValidateDataToBeSaved(payload)
            // if no error occur update the model
            if(response.data.okay){
                // update the model with the id
                await this.connection.update(this.tableName,query,payload)
                return this.connection.find(this.tableName,payload,true,limit,skip)
            }else{
                // console.log(response)
                // throw an error with the error given by the
                return response
            }
        }catch(error){
            console.log(error)
            throw error
        }
      
    }

    // fields of the model
    fields = []

    /**
     * Returns all the field the model gonna have
     * @returns {Array<String>}
     */
    getModelFields(){
        if(this.fields.length == 0){
            const cls = new this.dataClass()
            const modelFields = this.dataClass.getOwnPropertyNames(cls);
            this.fields = modelFields
        }
        return [...this.fields,'createdAt','updatedAt'];
    }

    
    /**
     * Returns all the fields except the field you just pass down 
     * @param {Array<String>} fields 
     * @returns 
     */
    getModelFieldsExpect(fields){
        const filteredFields = this.getModelFields().filter((e) => fields.indexOf(e) < 0)
        return filteredFields;
    }


    buildDataClassFromModel(fields,addUniqnessToo){
        const object = new this.dataClass();
        const newDataClass = new DataClass()
        for(let i = 0; i < fields.length;i++){
            Object.defineProperty(newDataClass,fields[i],{
                get:() => object[fields[i]]});
        }

        return newDataClass;
    }


    async deleteModels(query,returnLimit,returnSkip){
        const tableName = (new this.dataClass()).getName();
        const response = await this.connection.delete(this.tableName,query,returnLimit,returnSkip);
        return response;
    }




}


module.exports = {DataClass,DataClassFactory: DataClassFactory,InvalidDataClassError,NotReturnPromiseError}


