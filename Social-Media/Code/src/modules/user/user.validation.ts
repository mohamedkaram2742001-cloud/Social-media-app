import z from "zod";
import { generalValidationFields } from "../../common/validation";
import { ReactEnum, ReactTargetEnum, StatusEnum } from "../../common/enum";
import { fieldValidation } from "../../common/utils/multer";

export const reactValidation = {
  query: z.strictObject({
    targetId : generalValidationFields.id,
    targetType : z.enum(ReactTargetEnum), 
    type : z.enum(ReactEnum)
  }),
};
export const QueryValidation = {
  query: z.string().optional(),
};
export const notificationValidation = {
  params: z.strictObject({
    notificationId : generalValidationFields.id
  }),
};
export const User_Image = {
  file: generalValidationFields.file(fieldValidation.image),
};
export const action_friend_request = {
  body: z.strictObject({
    userId: generalValidationFields.id,
    status: z.enum(StatusEnum),
  }),
};
export const changePassword = {
  body: z
    .strictObject({
      oldPassword: generalValidationFields.password,
      newPassword: generalValidationFields.password,
      confirmPassword: generalValidationFields.confirmPassword,
    }).refine((data) => {data.confirmPassword !== data.newPassword},
      {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      },
    ),
};
