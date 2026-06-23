import { NextFunction, Request, Response } from "express"
import { BadRequestException } from "../common/exception"
import type { ZodError, ZodType } from "zod"
type KeyRequestType = keyof Request
type ValidationSchemaType = Partial<Record<KeyRequestType , ZodType>>
type ValidationErrorsType = Array<{key : KeyRequestType ,issues : Array<{message : string , path : Array<string | number | undefined | symbol>}>}>
export const validation = (scehma : ValidationSchemaType)=>{
    return (req : Request , res : Response , next : NextFunction)=>{
        const validationErrors : ValidationErrorsType = []
        for (const key of Object.keys(scehma) as KeyRequestType[]) {
            if (!scehma[key]) continue;
            const validationResualt = scehma[key].safeParse(req[key])
            if (!validationResualt.success) {
                const error = validationResualt.error as ZodError
                validationErrors.push({key , issues : error.issues.map(issue =>{
                    return {message : issue.message , path : issue.path}
                }) })
            }
        }
        if (validationErrors.length) {
            throw new BadRequestException("Validation Faild" , validationErrors)
        }
        next()
    }
}