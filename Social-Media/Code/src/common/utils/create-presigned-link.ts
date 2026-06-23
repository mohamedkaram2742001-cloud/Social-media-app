import { BadRequestException } from "../exception"
import { s3Service } from "../service"

export const createPresignedLink = async({ContentType , OriginalName , path} : {ContentType : string , OriginalName : string , path : string}) : Promise<{url : string , Key : string}>=>{
        if (!ContentType && !OriginalName) {
          throw new BadRequestException("Bad Request check from your Data")
        }
        const {url , Key} =  await s3Service.createPreSignedUploadLink({ContentType , OriginalName , path })
        return {url , Key} 
} 