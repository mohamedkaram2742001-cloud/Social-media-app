import z from "zod"
import { ConfirmEmailScehma, ConfirmForgetPasswordScehma, ForgetPasswordSchema, LoginScehma, ResetPasswordSchema, SignUpSchema } from "./auth.validation"

export type ILoginDTO = z.infer<typeof LoginScehma.body>
export type ISignupDTO = z.infer<typeof SignUpSchema.body>
export type IConfirmEmailDTO = z.infer<typeof ConfirmEmailScehma.body>
export type IConfirmForgetPasswordDTO = z.infer<typeof ConfirmForgetPasswordScehma.body>
export type IResetPasswordDTO = z.infer<typeof ResetPasswordSchema.body>