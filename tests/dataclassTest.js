const {DataClass,DataClassFactory} = require("../dataclasses/base")
const {is_required, minLength} = require("../dataclasses/validators");
const { createPasswordHashing } = require("../utils/password_hashing");


const {createPassword} = createPasswordHashing("d2nd2bhvdg2be2,, fmf 2fhvehv w ,3f3n,mf32dnm3ndm3  3 f")

class UserDataClass extends DataClass {
    username = {
        type:String,
        validations:[is_required("Username is required"),minLength(8,"Username must contains 10 letters")],
        unique:true
    };
    password = {
        type:String,
        validations:[],
        beforeValidation:null,
        afterValidation:createPassword,
        unique:true,
    }

    age = {
        type:Number,
        validations:[is_required("Age is required sweetheart")]
    }


    getName(){
        return "users"
    }

    getRemovableFields(){
        return ['password']
    }

}

const UserDataClassFactory = DataClassFactory.createFactory(UserDataClass,null,["password"])
UserDataClassFactory.setRemovableFields(['password'])

module.exports = {UserDataClassFactory,UserDataClass}