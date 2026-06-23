import {
  FACEBOOK_LINK,
  INSTAGRAM_LINK,
  TWITER_LINK,
} from "../../../config/config";

type VerifyOTPTemplateParams = {
  code: string;
  title?: string;
  expiredTime?: number;
};

export const verifyOTPTemplate = ({
  code,
  title = "تأكيد البريد الإلكتروني",
  expiredTime = 10,
}: VerifyOTPTemplateParams): string => {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title} | Echo</title>
  <style>
    /* Reset & Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @media only screen and (max-width: 600px) {
      .container {
        padding: 20px 12px !important;
      }
      .card {
        padding: 24px 16px !important;
      }
      .otp-code {
        font-size: 28px !important;
        letter-spacing: 4px !important;
        padding: 12px 20px !important;
      }
      .social-icons img {
        width: 36px !important;
        height: 36px !important;
      }
      h2 {
        font-size: 20px !important;
      }
    }
    
    @media only screen and (max-width: 400px) {
      .otp-code {
        font-size: 24px !important;
        letter-spacing: 3px !important;
        padding: 10px 16px !important;
      }
    }
  </style>
</head>

<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f5f7fc 0%, #eef2f8 100%); font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', 'Cairo', Arial, sans-serif; direction: rtl;">

  <!-- Main Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        
        <!-- Card Container -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: #ffffff; border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden;">
          
          <!-- Header Gradient -->
          <tr>
            <td style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 6px; padding: 0;">&nbsp;</td>
          </tr>

          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 40px 24px 20px 24px;">
              <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 12px 24px; border-radius: 80px;">
                <img src="https://res.cloudinary.com/dmf7unksl/image/upload/q_auto/f_auto/v1775281806/Echo_gmwhu1.png" 
                     alt="Echo Logo" 
                     width="48" 
                     height="48"
                     style="display: block; border-radius: 50%;">
                <span style="font-size: 28px; font-weight: 700; background: linear-gradient(90deg, #667eea, #764ba2); -webkit-background-clip: text; background-clip: text; color: transparent;">Echo</span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding: 0 24px 8px 24px;">
              <h2 style="color: #1a1a2e; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">${title}</h2>
              <p style="color: #6c6f8d; font-size: 14px; line-height: 1.5; margin: 0;">استخدم الكود التالي لإكمال العملية</p>
            </td>
          </tr>

          <!-- OTP Code -->
          <tr>
            <td align="center" style="padding: 32px 24px;">
              <div class="otp-code" style="
                display: inline-block;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: #ffffff;
                font-size: 36px;
                font-weight: 700;
                letter-spacing: 8px;
                padding: 18px 32px;
                border-radius: 20px;
                font-family: 'Courier New', monospace;
                box-shadow: 0 10px 25px -5px rgba(102, 126, 234, 0.4);
              ">
                ${code}
              </div>
            </td>
          </tr>

          <!-- Timer & Message -->
          <tr>
            <td align="center" style="padding: 0 24px 16px 24px;">
              <div style="background: #f8f9ff; border-radius: 16px; padding: 16px; border: 1px solid #e8ecf4;">
                <p style="margin: 0 0 8px 0; color: #1a1a2e; font-size: 14px;">
                  ⏰ هذا الكود صالح لمدة 
                  <strong style="color: #667eea;">${expiredTime} دقائق</strong> فقط
                </p>
                <p style="margin: 0; color: #6c6f8d; font-size: 13px;">
                  🔒 لا تشارك هذا الكود مع أي شخص للحفاظ على أمان حسابك
                </p>
              </div>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 24px 0 24px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #e0e4f0, transparent);"></div>
            </td>
          </tr>

          <!-- Help Text -->
          <tr>
            <td align="center" style="padding: 20px 24px 0 24px;">
              <p style="color: #8a8dab; font-size: 12px; margin: 0;">
                ✉️ لم تطلب هذا الكود؟ يمكنك تجاهل هذه الرسالة بأمان
              </p>
            </td>
          </tr>

          <!-- Social Links -->
          <tr>
            <td align="center" style="padding: 28px 24px 20px 24px;">
              <p style="color: #8a8dab; font-size: 12px; margin-bottom: 16px;">تابعنا على</p>
              <div class="social-icons" style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                <a href="${FACEBOOK_LINK}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; transition: transform 0.2s;">
                  <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg" 
                       width="36" height="36" 
                       alt="Facebook"
                       style="display: block; border-radius: 50%; background: #1877f2; padding: 6px;">
                </a>
                <a href="${INSTAGRAM_LINK}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; transition: transform 0.2s;">
                  <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg" 
                       width="36" height="36" 
                       alt="Instagram"
                       style="display: block; border-radius: 50%; background: radial-gradient(circle at 30% 110%, #ffdb8f, #e4405f, #833ab4); padding: 6px;">
                </a>
                <a href="${TWITER_LINK}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; transition: transform 0.2s;">
                  <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg" 
                       width="36" height="36" 
                       alt="X (Twitter)"
                       style="display: block; border-radius: 50%; background: #000000; padding: 6px;">
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8f9ff; padding: 20px 24px;">
              <p style="color: #8a8dab; font-size: 11px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} Echo • جميع الحقوق محفوظة
              </p>
              <p style="color: #a0a3c0; font-size: 10px; text-align: center; margin: 8px 0 0 0;">
                هذا بريد إلكتروني آلي، الرجاء عدم الرد عليه
              </p>
            </td>
          </tr>

        <!-- End Card -->
        </table>
        
        <!-- Footer Note -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin-top: 20px;">
          <tr>
            <td align="center">
              <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 0;">
                🚀 Echo — حيث يلتقي الصدى بالمجتمع
              </p>
            </td>
          </tr>
        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>`;
};
