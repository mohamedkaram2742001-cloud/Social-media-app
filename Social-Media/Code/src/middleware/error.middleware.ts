import { NextFunction, Request , Response } from "express";
interface IError extends Error {
    statusCode? :number
}
export const globalErrorHandelr = (error : IError , req : Request , res : Response , next : NextFunction)=>{
    res.status(error.statusCode || 500).json({
        error : error,
        message : error.message || "Internal Server Error.",
        cause : error.cause,
        stack : error.stack
    })
}