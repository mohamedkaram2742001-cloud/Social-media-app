export class ApplicationException extends Error {
    constructor(message : string , public statusCode  : Number , cause : unknown ){
        super(message , {cause })
        this.name = this.constructor.name
        Error.captureStackTrace(this.constructor)
    }
}
