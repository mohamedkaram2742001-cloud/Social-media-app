import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { ENCRYPTION_SECRET_KEY, IV_LENGTH } from "../../../config/config"
import { BadRequestException } from "../../exception"

export const generateEncryption = async(plainText : string):Promise<string>=>{
    const iv = randomBytes(IV_LENGTH)
    const cipherIV = createCipheriv("aes-256-cbc" , ENCRYPTION_SECRET_KEY , iv)
    let cipherText = cipherIV.update(plainText , 'utf-8' , 'hex');
    cipherText += cipherIV.final('hex')
    return `${iv.toString('hex')}:${cipherText}`
}
export const generateDecryption = async(cipherText : string):Promise<string>=>{
    const [iv , encryptedData] = (cipherText.split(":")  || [] ) as string[]
    if (!iv || !encryptedData) {
        throw new BadRequestException("Fail to Encrypt")
    }
    const ivLIKEBinary = Buffer.from(iv , 'hex')
    let decipherIV = createDecipheriv('aes-128-cbc',ENCRYPTION_SECRET_KEY , ivLIKEBinary)
    let plainText = decipherIV.update(encryptedData , 'hex' , 'utf-8')
    plainText += decipherIV.final('utf-8')
    return plainText
}