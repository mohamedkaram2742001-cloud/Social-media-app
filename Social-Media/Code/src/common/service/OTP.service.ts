import {
  OTPSubjectEnum,
  OTPTitleEnum,
  RedisActionsEnum,
  RedisTypeEnum,
} from "../enum";
import { BadRequestException, ConflictException } from "../exception";
import { emailEmitter, generateOTP } from "../utils/OTP";
import { generateHash } from "../utils/security";
import { redisService } from "./redis.service";

// ==================== Types ====================
type GenerateOtpParams = {
  email: string;
  expiredTime?: number;
  title?: string;
  subject?: (typeof OTPSubjectEnum)[keyof typeof OTPSubjectEnum];
};

type KeyCheckParams = {
  email: string;
  type?: string | (typeof RedisTypeEnum)[keyof typeof RedisTypeEnum];
  action?: (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum] | undefined;
  blockAction?:
    | (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum]
    | undefined;
};

type MaxRequestParams = {
  email: string;
  type?: (typeof RedisTypeEnum)[keyof typeof RedisTypeEnum];
  action?: (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum] | undefined;
  blockAction?:
    | (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum]
    | undefined;
  expiredTime?: number;
};

// ==================== Generate OTP & Send ====================
export const generateOtpAndSendOtpEmail = async ({
  email,
  expiredTime = 1,
  title = OTPTitleEnum.CONFIRMEMAIL,
  subject = OTPSubjectEnum.VERIFYACCOUNT,
}: GenerateOtpParams): Promise<void> => {
  const code = generateOTP();
  const hashedCode = await generateHash(code);
  await redisService.set({
    key: redisService.RedisKey({ type: title, key: email }),
    value: hashedCode,
    ttl: expiredTime * 60,
  });
  emailEmitter.emit("SEND_OTP", {
    to: email,
    subject,
    code,
    title,
    expiredTime,
  });
};

// ==================== Check if OTP Key Expired ====================
export const isKeyExpired = async ({
  email,
  type = RedisTypeEnum.CONFIRMEMAIL,
}: KeyCheckParams): Promise<void> => {
  const remainingTime = await redisService.ttl(
    redisService.RedisKey({ type, key: email }),
  );
  if (remainingTime > 0) {
    throw new BadRequestException(
      `لا يمكنك اعاده طلب كود حاليا برجاء انتظار ${remainingTime} ثانية حتي تتمكن من الطلب مجددا`,
      "",
    );
  }
};

// ==================== Max OTP Requests ====================
export const maxKeyRequest = async ({
  email,
  type = RedisTypeEnum.CONFIRMEMAIL,
  action = RedisActionsEnum.REQUEST,
  blockAction,
  expiredTime = 5,
}: MaxRequestParams): Promise<void> => {
  const maxRequestKey = redisService.RedisMaxRequestKey({
    type,
    key: email,
    action,
  });
  const blockKey = redisService.RedisBlockKey({
    type,
    key: email,
    blockAction,
  });
  const currentRequest = await redisService.get({ key: maxRequestKey });

  if (currentRequest) {
    await redisService.incr(maxRequestKey);

    const newRequestCount =
      Number(await redisService.get({ key: maxRequestKey })) || 0;

    if (newRequestCount > 5) {
      await redisService.set({
        key: blockKey,
        value: "true",
        ttl: expiredTime * 60,
      });
      await redisService.deleteKey(maxRequestKey);

      const blockTTL = await redisService.ttl(blockKey);

      throw new ConflictException(
        type === RedisTypeEnum.CONFIRMEMAIL
          ? `لا يمكنك طلب كود اخر برجاء انتظار ${blockTTL} ثانية `
          : `تم عمل بان للحسابك يمكنك المحاولة مجددا بعد ${blockTTL}`,
        "",
      );
    }
  } else {
    await redisService.set({ key: maxRequestKey, value: 1 });
  }
};

// ==================== Check if Key Blocked ====================
export const isKeyBlocked = async ({
  email,
  type = RedisTypeEnum.CONFIRMEMAIL,
  action = RedisActionsEnum.BLOCKREQUEST,
}: KeyCheckParams): Promise<void> => {
  const remainingBlock = await redisService.ttl(
    redisService.RedisBlockKey({ type, key: email, action }),
  );
  if (remainingBlock > 0) {
    throw new ConflictException(
      `Your account has been blocked, please wait for ${remainingBlock} seconds`,
      "",
    );
  }
};
