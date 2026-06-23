import EventEmitter from "node:events";
import { sendOTP } from "./sendOTP.OTP";
import { verifyOTPTemplate } from "./template.OTP";
import { OTPSubjectEnum, OTPTitleEnum } from "../../enum/index";

// ==================== Types ====================
type SendOTPEventPayload = {
  to: string | string[];
  code: string;
  subject?: string;
  title?: string;
  expiredTime?: number;
};

// ==================== Event Emitter ====================
export const emailEmitter = new EventEmitter();

// ==================== Listener ====================
emailEmitter.on(
  "SEND_OTP",
  async (payload: SendOTPEventPayload) => {
    const { to, code, subject = OTPSubjectEnum.VERIFYACCOUNT, title = OTPTitleEnum.CONFIRMEMAIL, expiredTime = 5 } = payload;

    if (!to || !code) {
      console.error("SEND_OTP event missing required params");
      return;
    }

    try {
      await sendOTP({
        to,
        subject,
        html: verifyOTPTemplate({ code, title, expiredTime }),
      });
    } catch (error: any) {
      console.error(`Fail to send user email: ${error.message}`);
    }
  }
);