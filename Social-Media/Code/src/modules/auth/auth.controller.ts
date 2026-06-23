import { NextFunction, Request, Response, Router } from "express";
import { authService } from "./auth.service";
import { successResponse } from "../../common/response";
import { validation } from "../../middleware";
import * as validators from './auth.validation'
import { ILoginResponse } from "./auth.interface";
const router = Router();
router.post("/signup",validation(validators.SignUpSchema),async (req: Request, res: Response, next: NextFunction) : Promise<Response> => {
    const message = await authService.signup(req.body);
    return successResponse<string>({res , status : 201 , data : message})
  },
);
router.patch("/confirm-email",validation(validators.ConfirmEmailScehma),async (req: Request, res: Response, next: NextFunction) : Promise<Response> => {
    const message = await authService.confirmEmail(req.body);
    return successResponse<string>({res , status : 200 , data : message})
  },
);
router.patch("/resend-confirm-email",validation(validators.ResendConfirmEmailScehma),async (req: Request, res: Response, next: NextFunction) : Promise<Response> => {
    const message = await authService.resendConfirmEmail(req.body);
    return successResponse<string>({res , status : 200 , data : message})
  },
);
router.post("/login",validation(validators.LoginScehma) , async (req: Request, res: Response, next: NextFunction) : Promise<Response> => {
  const account = await authService.login(req.body ,  `${req.protocol}://${req.host}`);
  return successResponse<ILoginResponse>({res , data : account})
});
router.post("/forget-password",validation(validators.ForgetPasswordSchema) ,async (req: Request, res: Response, next: NextFunction) : Promise<Response> => {
  const message = await authService.forgetPassword(req.body);
  return successResponse({res , data : message})
});
router.patch("/confirm-forget-password",validation(validators.ConfirmForgetPasswordScehma), async (req: Request, res: Response, next: NextFunction) : Promise<Response> => {
  const message = await authService.confirmForgetPassword(req.body);
  return successResponse({res , data : message})
});
router.patch("/reset-password", validation(validators.ResetPasswordSchema),async (req: Request, res: Response, next: NextFunction) : Promise<Response> => {
  const message = await authService.resetPassword(req.body);
  return successResponse({res , data : message})
});
router.post("/signup-with-google", async (req, res, next) : Promise<Response> => {
  const {account , status = 201} = await authService.signupWithGmail(req.body, `${req.protocol}://${req.host}`);
  return successResponse<ILoginResponse>({res, status, data:  account });
});
router.post("/login-with-google", async (req, res, next) : Promise<Response> => {
  const account  = await authService.loginWithGmail(req.body, `${req.protocol}://${req.host}`);
  return successResponse<ILoginResponse>({res, data:  account });
});
export default router;
