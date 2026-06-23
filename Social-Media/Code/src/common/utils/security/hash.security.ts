import { compare, hash } from "bcrypt"
import { SALT_ROUND } from "../../../config/config"

export const generateHash = async (plainText : string , salt : number = SALT_ROUND) : Promise<string> =>{
    return await hash(plainText , salt)
}

export const compareHash = async (plainText : string , cipherText : string ) : Promise<boolean> =>{
   return await compare(plainText , cipherText)
}