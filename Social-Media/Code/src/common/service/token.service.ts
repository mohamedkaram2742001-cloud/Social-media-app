import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken'
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongoose';
import { redisService, RedisService } from './redis.service';
import { RoleEnum, TokenTypeEnum } from '../enum';
import { BadRequestException, UnauthorizedException } from '../exception';
import { UserRepository } from '../../DB/Repository';
import { ACCESS_EXPIRES_IN, ADMIN_REFREASH_TOKEN_SECRET_KEY, ADMIN_TOKEN_SECRET_KEY, REFREASH_EXPIRES_IN, SUPERVISER_REFREASH_TOKEN_SECRET_KEY, SUPERVISER_TOKEN_SECRET_KEY, USER_REFREASH_TOKEN_SECRET_KEY, USER_TOKEN_SECRET_KEY } from '../../config/config';
type GenerateTokenParams = {
  payload?: string | object | Buffer
  secret?: Secret
  options?: SignOptions
}
type VerifyTokenParams = {
  token: string
  secret?: Secret
}
type TokenSignature = {
  accessSignature: string
  refreashSignature: string
  audience: number
}
export interface IGenerateToken {
    access_Token: string,
    refreash_Token: string,
}
export class TokenService {
    private redis  : RedisService
    constructor(){
        this.redis = redisService
    }
   async sign({payload = {} , secret = USER_TOKEN_SECRET_KEY , options = {}}:GenerateTokenParams={}) : Promise<string>{
        return jwt.sign(payload , secret , options)
    }

    async verify ({token , secret = USER_TOKEN_SECRET_KEY } : VerifyTokenParams) : Promise<string | JwtPayload>{
        return jwt.verify(token , secret)
    }

    async getTokenSignature (role  : number) : Promise<TokenSignature>{
        let accessSignature : string | undefined = undefined
        let refreashSignature : string | undefined = undefined
        let audience : number = RoleEnum.USER
        switch (role) {
            case RoleEnum.SUPERVISER:
                accessSignature = SUPERVISER_TOKEN_SECRET_KEY;
                refreashSignature = SUPERVISER_REFREASH_TOKEN_SECRET_KEY
                audience = RoleEnum.SUPERVISER
                break;
            case RoleEnum.ADMIN:
                accessSignature = ADMIN_TOKEN_SECRET_KEY;
                refreashSignature = ADMIN_REFREASH_TOKEN_SECRET_KEY
                audience = RoleEnum.ADMIN
                 break;
            default:
                accessSignature = USER_TOKEN_SECRET_KEY
                refreashSignature = USER_REFREASH_TOKEN_SECRET_KEY
                audience = RoleEnum.USER
                break;
        }
        return {accessSignature , refreashSignature , audience}
    }

    async createLoginCredentials (user : any , issuer : string ) : Promise<IGenerateToken>{
        const {accessSignature , refreashSignature , audience} : TokenSignature = await this.getTokenSignature(user.role)
        const jwtId = randomUUID()
        const access_Token = await this.sign({
            payload : {sub : user._id},
            secret : accessSignature,
            options : {issuer , expiresIn : ACCESS_EXPIRES_IN , jwtid  : jwtId , audience : [String(TokenTypeEnum.ACCESS) , String(audience)]}
        })
        const refreash_Token = await this.sign({
            payload : {sub : user._id},
            secret : refreashSignature,
            options : {issuer , expiresIn : REFREASH_EXPIRES_IN , jwtid : jwtId , audience : [String(TokenTypeEnum.REFREASH) , String(audience)]}
        })
        return {access_Token , refreash_Token}
    }

    async decodedToken({token , tokenType = TokenTypeEnum.ACCESS} : {token : string , tokenType : number}) : Promise<{user : any , decode :any}>{
        const decode = jwt.decode(token) as JwtPayload
        if (!decode?.aud?.length) {
            throw new BadRequestException("Fail to decoded token aud is required")
        }
        const [decodedTokenType , audience] = decode.aud || []
        if (String(tokenType) !== decodedTokenType) {
            throw new BadRequestException(`Invalid token type token of type ${decodedTokenType} cannot access this api while we expected token of type ${tokenType}` )
        }
        const {accessSignature , refreashSignature} = await this.getTokenSignature(Number(audience))
        const verifiedDate = await this.verify({token , secret : tokenType === TokenTypeEnum.REFREASH ? refreashSignature : accessSignature})
        const user = await new UserRepository().findOne({filter : {_id : verifiedDate.sub as unknown as ObjectId}}) 
        if (!user) {
            throw new UnauthorizedException( "Not Register account");
        }
        const isRevoked = await this.redis.sismember(this.redis.RevokeTokenKey(String(user._id)),String(decode.jti))
        if (isRevoked) {
        throw new UnauthorizedException("Invalid login session")
        }
        const revokeAll = await this.redis.get({key: this.redis.RevokeAllTokenKey(String(user._id))})
        if (revokeAll && Number(revokeAll) > Number(decode.iat)) {
            throw new UnauthorizedException("Invalid login session")
        }
        return {user , decode} 
    }
}
export const tokenService = new TokenService()