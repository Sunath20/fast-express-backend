const { DataClassFactory: DataClassFactory, DataClass } = require("./base");



class DataClassSubFactory extends DataClassFactory{

    constructor(dataClassInstance,superDataClass){
        super(superDataClass)
        this.dataClass = dataClassInstance

    }

    createObject(){
        // const newInstance = Object.create(this.dataClass)
        const  instance = Object.assign({},this.dataClass)
        // console.log(instance)
        // console.log(this.dataClass)
        // console.log(instance.username == this.dataClass.username)
        // Object.defineProperty(instance,"username","my nigga")
        Object.defineProperty(instance,"username",{
            get(){
                return "hello world"
            }
        })
        return instance
    }


    getName(){

    }
}

module.exports = {DataClassSubFactory}