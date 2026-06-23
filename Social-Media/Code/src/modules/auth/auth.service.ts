import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { OTPSubjectEnum, OTPTitleEnum, ProviderEnum, RedisActionsEnum, RedisTypeEnum } from '../../common/enum';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '../../common/exception';
import {RedisService, redisService , generateOtpAndSendOtpEmail, isKeyBlocked, isKeyExpired, maxKeyRequest , tokenService, TokenService, IGenerateToken, NotificationService, notificationService } from '../../common/service/index';
import { compareHash, generateHash } from '../../common/utils/security';
import { WEB_CLIENT_ID } from '../../config/config';
import { UserRepository } from '../../DB/Repository';
import { IConfirmEmailDTO, IConfirmForgetPasswordDTO, ILoginDTO, IResetPasswordDTO, ISignupDTO } from "./auth.dto";
class AuthService {
  private UserRepository : UserRepository
  private readonly notification : NotificationService
  private readonly redis : RedisService
  private readonly token : TokenService
  constructor() {
    this.UserRepository = new UserRepository()
    this.redis = redisService
    this.token = tokenService
    this.notification =  notificationService
  }
  private async verifyGoogleAccount(idToken : string) : Promise<TokenPayload>{
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new BadRequestException( "Fail to verify this account with google");
  }
  return payload;
  };
  async signup(data: ISignupDTO): Promise<string> {
    const { email } = data;
    const user = await this.UserRepository.findOne({filter : {email , confirmEmail: null,provider: ProviderEnum.SYSTEM}})
    if (user) {
      throw new ConflictException("User Exist")
    }
    await this.UserRepository.create({ data })
    await generateOtpAndSendOtpEmail({email , expiredTime :  2  })
    return "Check from your gmail"
  }
  async resendConfirmEmail({email} : {email : string}) : Promise<string>{
    const user = await this.UserRepository.findOne({filter : {email , confirmedAt: null,provider: ProviderEnum.SYSTEM}})
    if (!user) {
      throw new NotFoundException("Fail to find matching account")
    }
    await isKeyBlocked({email , type : RedisTypeEnum.CONFIRMEMAIL , blockAction : RedisActionsEnum.BLOCKREQUEST})
    await isKeyExpired({email , type : RedisTypeEnum.CONFIRMEMAIL })
    await maxKeyRequest({email , type : RedisTypeEnum.CONFIRMEMAIL , blockAction : RedisActionsEnum.BLOCKREQUEST , expiredTime : 5})
    await generateOtpAndSendOtpEmail({email , expiredTime : 2 , title : OTPTitleEnum.CONFIRMEMAIL , subject : OTPSubjectEnum.VERIFYACCOUNT})
    return "The code has been sent again, please check your email."
  }
  async confirmEmail(data : IConfirmEmailDTO) : Promise<string>{
    const {otp , email} = data
    const user = await this.UserRepository.findOne({filter :  {email , confirmedAt: null,provider: ProviderEnum.SYSTEM}})
    if (!user) {
      throw new NotFoundException("Fail to find matching account")
    }
    const hashedOTP : string | null= await this.redis.get({key : this.redis.RedisKey({type : OTPTitleEnum.CONFIRMEMAIL , key : email})})
    if (!hashedOTP) {
      throw new BadRequestException("Expired otp");
    }
    if (!await compareHash(otp , hashedOTP)) {
      throw new BadRequestException("Invalid OTP")
    }
    user.confirmedAt = new Date()
    await user.save()
    await this.redis.deleteKey(this.redis.RedisKey({ key : email , action : RedisActionsEnum.REQUEST}))
    return "Confirm Email Successfuly"
  }
  async login(data: ILoginDTO , issure : string) : Promise<IGenerateToken> {
    const {email , password , FCM} = data
    await isKeyBlocked({email , type  :RedisTypeEnum.LOGIN , action : RedisActionsEnum.BLOCKLOGIN})
    await maxKeyRequest({email , type : RedisTypeEnum.LOGIN , expiredTime : 5  , blockAction : RedisActionsEnum.BLOCKLOGIN})
    const account = await this.UserRepository.findOne({filter:{email , confirmedAt : {$exists : true}}})
    if (!account) {
      throw new NotFoundException("Fail to find matching account")
    }
    if (!await compareHash(password , account.password)) {
        throw new BadRequestException("Invalid Cerdientails")
    }
    if (FCM) {
       this.redis.FCM_Key(account._id)
       await this.redis.addFCM(account._id , FCM )
       const tokens = await this.redis.getFCMs(account._id)
       if (tokens?.length) {
         await this.notification.sendNotifications({tokens , data : {body : `New Login At ${new Date().toLocaleString()}` , title : "Login"}})
       }
    }
    await this.redis.deleteKey(this.redis.RedisKey({key : email , type : RedisTypeEnum.LOGIN , action : RedisActionsEnum.REQUEST}))
    return await this.token.createLoginCredentials(account , issure)
  }
  async forgetPassword({email , phone} : {email : string , phone : string}) : Promise<string>{
    const user = await this.UserRepository.findOne({filter: {
      $or:[
        {email},
        {phone}
      ],
      provider: ProviderEnum.SYSTEM,
      confirmedAt: { $exists: true },
    },})
    if (!user) {
    throw new NotFoundException("This account not found" );
    }
    await isKeyExpired({email : email || phone , type : RedisTypeEnum.FORGETPASSWORD})
    await generateOtpAndSendOtpEmail({email : email ?? phone , expiredTime : 2 , title : OTPTitleEnum.FORGETPASSWORD , subject : OTPSubjectEnum.FORGETPASSWORD})
    return "OTP sent to your email"
  }
  async confirmForgetPassword({ email, otp } : IConfirmForgetPasswordDTO) : Promise<string>{
  const user = this.UserRepository.findOne({    filter: {
      email,
      confirmedAt: { $exists: true },
      provider: ProviderEnum.SYSTEM,
    },})
  if (!user) {
    throw new NotFoundException( "Fail to find matching account");
  }
  const hashedOTP = await this.redis.get({key : this.redis.RedisKey({type : OTPTitleEnum.FORGETPASSWORD ,key : email})})

  if (!hashedOTP) {
    throw new NotFoundException("Expired otp" );
  }
  const checkOtp = await compareHash(otp, hashedOTP)
  if (!checkOtp) {
    throw new ConflictException("Invalid otp");
  }
  await this.redis.deleteKey(this.redis.RedisKey({ key : email , type : RedisTypeEnum.FORGETPASSWORD}))
  await this.redis.set({key : this.redis.RedisKey({type : RedisTypeEnum.RESETPASSWORD , key : email}) , value : 1 , ttl : 120}) 
  return "OTP verified successfully";
  }
  async resetPassword({email , password} : IResetPasswordDTO) : Promise<string>{
  const user = await this.UserRepository.findOne({filter: {
      email,
      confirmedAt: { $exists: true },
      provider: ProviderEnum.SYSTEM,
    }})
  if (!user) {
    throw new NotFoundException("Fail to find matching account");
  }
  const session = await this.redis.get({ key: this.redis.RedisKey({type : RedisTypeEnum.RESETPASSWORD ,key : email}) });
  if (!session) {
    throw new UnauthorizedException( "Invalid reset session")
  }
  const newPassword = password
  const checkSamePassword = await compareHash(newPassword , user.password)
  if (checkSamePassword) {
    throw new ConflictException("This password used befor you can't use it")
  }
  user.changeCredentialsTime = new Date(Date.now())
  await user.save()
  return "Password changed Successfuly"
  };
  async signupWithGmail({ idToken } : {idToken : string}, issuer : string) {    
  const payload = await this.verifyGoogleAccount(idToken);  
  const checkUserExist = await this.UserRepository.findOne({filter: { email: payload.email as string }})  
  if (checkUserExist) {
    if (checkUserExist?.provider == ProviderEnum.SYSTEM) {
      throw new ConflictException("Account already exist with diffrent provider ");
    }
    const account = await this.loginWithGmail({ idToken }, issuer);
    return { account, status: 200 };
  }
  const user = await this.UserRepository.createOne({
    data: {
      firstName: payload.given_name as string,
      lastName: payload.family_name as string,
      email: payload.email as string,
      provider: ProviderEnum.GOOGLE as number,
      profileImage: payload.picture as string,
      confirmedAt: new Date() as Date,
    },
  })
  return { account: await this.token.createLoginCredentials(user, issuer) };
  };
  async loginWithGmail ({ idToken } : {idToken : string}, issuer : string) : Promise<IGenerateToken>{
  const payload = await this.verifyGoogleAccount(idToken);  
  const user = await this.UserRepository.findOne({
    filter: { email: payload.email as string, provider: ProviderEnum.GOOGLE }
  })
  
  if (!user) {
    throw new NotFoundException( "Invalid login credentials or invalid login approach");
  }
  return await this.token.createLoginCredentials(user, issuer);
  };
}
export const authService = new AuthService();
