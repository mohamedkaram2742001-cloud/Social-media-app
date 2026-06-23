import {z} from 'zod'
import { GenderEnum, ProviderEnum, RoleEnum } from '../../common/enum'
import { generalValidationFields } from '../../common/validation';
export const LoginScehma = {
    body : z.strictObject({
        email: generalValidationFields.email,
        password: generalValidationFields.password,
        FCM : z.string().optional()
    })
}
export const SignUpSchema = {
    body : LoginScehma.body.safeExtend ({
        firstName: generalValidationFields.firstName,
        lastName: generalValidationFields.lastName,
        userName : generalValidationFields.userName.optional(),
        confirmPassword : generalValidationFields.confirmPassword,
        bio: z.string().optional(),
        phone: generalValidationFields.phone.optional(),
        profileImage: z.string().optional(),
        coverImage: z.string().optional(),
        DOB: z.coerce.date().optional(),
        provider: z.enum(ProviderEnum).optional(),
        gender: z.enum(GenderEnum).optional(),
        role: z.enum(RoleEnum).optional()
    }).superRefine((data, ctx) => {
      if (data.confirmPassword !== data.password) {
        ctx.addIssue({
          code: "custom",
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }),
}
export const ConfirmEmailScehma = {
    body : z.strictObject({
        email: generalValidationFields.email,
        otp: generalValidationFields.otp,
    })
}
export const ForgetPasswordSchema = {
  body : z.strictObject({
    email : generalValidationFields.email,
    phone : generalValidationFields.phone.optional()
  })
}
export const ConfirmForgetPasswordScehma = {
    body : ConfirmEmailScehma.body
}
export const ResendConfirmEmailScehma = {
    body : z.strictObject({
        email: generalValidationFields.email,
    })
}
export const ResetPasswordSchema = {
  body : z.strictObject({
    email : generalValidationFields.email,
    password : generalValidationFields.password
  })
}