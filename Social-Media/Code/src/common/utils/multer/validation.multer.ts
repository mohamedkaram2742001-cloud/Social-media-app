import type { Request } from "express"
import { FileFilterCallback } from "multer"
import { BadRequestException } from "../../exception"

export const fieldValidation = {
  image : ['image/jpeg' ,  'image/png' , 'image/gif' , 'image/jpg' , 'image/avif' , 'image/webp' , 'image/JPG'],
  video : ['video/mp4' ,  'video/mkv' , 'video/avi'],
  audio : ['audio/mpeg' ,  'audio/wav' , 'audio/ogg'],
  pdf : ['application/pdf'],
  attachments : ['image/jpeg' ,  'image/png' , 'image/gif' , 'image/jpg' , 'image/avif' , 'image/webp' , 'image/JPG' , 'video/mp4' ,  'video/mkv' , 'video/avi']
}
export const fileFilter = (validation :string[])=>{
    return function(req : Request , file : Express.Multer.File , cb : FileFilterCallback) {
        if (!validation.includes(file.mimetype)) {
            cb(new BadRequestException("Invalid File Format"))
        }
       return cb(null , true)
    }
}