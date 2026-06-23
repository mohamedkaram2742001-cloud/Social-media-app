import z from "zod";
import { action_friend_request, changePassword, QueryValidation, reactValidation, User_Image } from "./user.validation";

export type QueryDTO = z.infer<typeof QueryValidation.query>
export type ReactDTOQuey = z.infer<typeof reactValidation.query>
export type UserImageDTO = z.infer<typeof User_Image.file>
export type actionFriendRequestDTO = z.infer<typeof action_friend_request.body>
export type changePasswordDTO = z.infer<typeof changePassword.body>