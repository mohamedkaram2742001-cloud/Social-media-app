import { config } from "dotenv"
import { resolve } from "node:path";

config({path : resolve(`.env.${process.env.NODE_ENV || 'development'}`) })
//====================== Connection ========================
export const port = process.env.PORT ?? 7000
export const DB_URI = process.env.DB_URI!
export const ORIGIN = process.env.ORIGIN?.split(",")!
export const WINDOW = Number(process.env.WINDOW)!
//===================== Redis Connection ===================
export const REDIS_URI = process.env.REDIS_URI! ;
//====================== TOKEN SIGNATURE ===================
// User Signature
export const USER_TOKEN_SECRET_KEY = process.env.USER_TOKEN_SECRET_KEY!
export const USER_REFREASH_TOKEN_SECRET_KEY = process.env.USER_REFREASH_TOKEN_SECRET_KEY!
// Admin Signature
export const ADMIN_REFREASH_TOKEN_SECRET_KEY = process.env.ADMIN_REFREASH_TOKEN_SECRET_KEY!
export const ADMIN_TOKEN_SECRET_KEY = process.env.ADMIN_TOKEN_SECRET_KEY!
// Superviser Signature
export const SUPERVISER_REFREASH_TOKEN_SECRET_KEY = process.env.SUPERVISER_REFREASH_TOKEN_SECRET_KEY!
export const SUPERVISER_TOKEN_SECRET_KEY = process.env.SUPERVISER_TOKEN_SECRET_KEY!
// Expires Time
export const REFREASH_EXPIRES_IN = parseInt(process.env.REFREASH_EXPIRES_IN!)
export const ACCESS_EXPIRES_IN = parseInt(process.env.ACCESS_EXPIRES_IN!)
//====================== Encryption NATIONAL_ID_Secret =================
export const NATIONAL_ID_SECRET = Buffer.from(process.env.NATIONAL_ID_SECRET!)
//====================== ENCRYPTION_SECRET_KEY =================
export const ENCRYPTION_SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET_KEY!)
//====================== ENCRYPTION IV_LENGTH ===================
export const IV_LENGTH = Number(process.env.IV_LENGTH ?? 16)!
//====================== Hash Salt_Round ===================
export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "12")!
//====================== Send OTP ==========================
export const EMAIL_APP = process.env.EMAIL_APP!
export const PASSWORD_APP = process.env.PASSWORD_APP!
//====================== Social Link ======================= 
export const FACEBOOK_LINK = process.env.FACEBOOK_LINK!
export const INSTAGRAM_LINK = process.env.INSTAGRAM_LINK!
export const TWITER_LINK = process.env.TWITER_LINK!
//====================== Sign With Google ==================
export const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID!
//====================== Cloudinary ========================
export const APPLICATION_NAME = process.env.APPLICATION_NAME!
export const CLOUD_NAME = process.env.CLOUD_NAME!
export const API_KEY = process.env.API_KEY!
export const API_SECRET = process.env.API_SECRET!
//====================== AWS S3 ============================
export const AWS_REGION = process.env.AWS_REGION! as string
export const AWS_CLOUDFRONT_LINK = process.env.AWS_CLOUDFRONT_LINK! as string
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME! as string
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID! as string
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY! as string
export const AWS_EXPIRES_IN = parseInt(process.env.AWS_EXPIRES_IN! as string || "120")
