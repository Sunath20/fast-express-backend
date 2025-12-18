class InternalServerError extends Error{
    constructor(message="Internal Server Error happend.Please try again later."){
        super(message)
    }
}
class NotFound404 extends Error{}

class MongooseInvalidId extends Error{}

class ModelWithQueryNotFound extends NotFound404{
    constructor(message="A model containing that data wasn't found"){
        super(message)
    }
}
class ModelWithIdNotFound extends NotFound404{}

module.exports = {InternalServerError,NotFound404,ModelWithQueryNotFound,ModelWithIdNotFound,MongooseInvalidId}