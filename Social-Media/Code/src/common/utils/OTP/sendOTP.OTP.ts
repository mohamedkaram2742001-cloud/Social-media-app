import nodemailer from "nodemailer"
import { APPLICATION_NAME, EMAIL_APP, PASSWORD_APP } from "../../../config/config"
import Mail from "nodemailer/lib/mailer"

//================ OTP =================
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

//================ Transporter =================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_APP,
    pass: PASSWORD_APP,
  },
})

//================ Send Email =================
export const sendOTP = async ({
  to,
  cc,
  bcc,
  html,
  attachments = [],
  subject,
}: Mail.Options): Promise<void> => {
  try {
    await transporter.sendMail({
      to,
      cc,
      bcc,
      subject,
      html,
      attachments,
      from: `${APPLICATION_NAME} 👨‍⚕️🏥 <${EMAIL_APP}>`,
    })
  } catch (error) {
    console.error("Email error:", error)
    throw error
  }
}