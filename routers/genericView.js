class GenericView {

    init(){
        const fields = Object.getOwnPropertyNames(this);
        const functionString = this['get'].toLocaleString();
        const indexOne = functionString.indexOf('(')
        const indexTwo = functionString.indexOf(')')
        console.log(indexTwo,indexOne)
        const args = functionString.slice(indexOne,indexTwo-indexOne)
        console.log(args)
    }


    get = function (req){
        console.log(req);
    }
    add = function (){}
    update = function (){}
    delete = function (){}

    get_id = function (){}
    update_id = function (){}
    delete_id = function (){}

}

class UserView extends GenericView {

}


const u = new UserView();
u.init();