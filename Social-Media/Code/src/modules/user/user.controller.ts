import { NextFunction, Request, Response, Router } from "express";
import { successResponse } from "../../common/response";
import { authentication, authorization, validation } from "../../middleware";
import { StorageApproachEnum, TokenTypeEnum } from "../../common/enum";
import { endPoint } from "./user.auth";
import { userService } from "./user.service";
import { CloudFileUpload, fieldValidation } from "../../common/utils/multer";
import * as validators from './user.validation'
import { StoryRouter } from "../story";
import { ReactDTOQuey } from "./user.dto";
const router = Router()
router.use("/story", StoryRouter)
router.get("/", authentication() , authorization(endPoint.GeneralAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  if (req.query.userId) {
    const account = await userService.profile(req.user , req.query.userId as string);
    successResponse({res, data : account});
  }
  const account = await userService.profile(req.user);
   successResponse({res, data : account});
});
router.post("/send-request-friend", validation(validators.action_friend_request) ,authentication(), authorization(endPoint.GeneralAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.addFriend(req.user , req.query);
   successResponse({res , data :  account});
});
router.get("/all-friends" ,authentication(), authorization(endPoint.GeneralAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.allFriends(req.user);
   successResponse({res , data :  account});
});
router.get("/all-friends-requests" ,authentication(), authorization(endPoint.GeneralAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.allFriendsRequest(req.user);
   successResponse({res , data :  account});
});
router.patch("/profile-Image" , validation(validators.User_Image) , authentication(), authorization(endPoint.GeneralAuth), CloudFileUpload({storageApproach : StorageApproachEnum.DISK , validation : fieldValidation.image , maxSize : 10}).single("profile-image") ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.profileImage(req.user , req.file as Express.Multer.File);
   successResponse({res , data :  account});
});
router.patch("/react" , validation(validators.reactValidation), authentication() , authorization(endPoint.GeneralAuth) , async (req : Request, res : Response, next : NextFunction) => {
  const reaction = await userService.react(req.user , req.query as ReactDTOQuey);
   successResponse({res , data :  reaction});
});
router.get("/all-notifications" , authentication() , authorization(endPoint.GeneralAuth) , async (req : Request, res : Response, next : NextFunction) => {
  const notifications = await userService.getAllNofitications(req.user)
   successResponse({res , data :  notifications});
});
router.get("/all-notification/:notificationId" , validation(validators.notificationValidation) , authentication() , authorization(endPoint.GeneralAuth) , async (req : Request, res : Response, next : NextFunction) => {
  const notifications = await userService.readNotifications(req.user , req.params.notificationId  as string)
   successResponse({res , data :  notifications});
});
router.patch("/cover-image", validation(validators.User_Image) ,authentication(), authorization(endPoint.GeneralAuth), CloudFileUpload({storageApproach : StorageApproachEnum.DISK , validation : fieldValidation.image , maxSize : 12}).single("cover-image")  ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.coverImage(req.user , req.file as Express.Multer.File);
   successResponse({res , data :  account});
});
router.patch("/action-friend-request" , validation(validators.action_friend_request) , authentication(), authorization(endPoint.GeneralAuth),async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.actionOfRequestFriend(req.user , req.body);
   successResponse({res , data :  account});
});
router.patch("/update-password" , validation(validators.changePassword) , authentication(), authorization(endPoint.GeneralAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.updatePassword(req.body , req.user);
   successResponse({res , data :  account});
});
router.patch("/freeze-account" , validation(validators.QueryValidation) ,authentication(), authorization(endPoint.SensiveAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.freezeUser(req.query);
   successResponse({res , data :  account});
});
router.patch("/unfreeze-account" , validation(validators.QueryValidation) ,authentication(), authorization(endPoint.SensiveAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.unFreezeUser(req.query);
   successResponse({res , data :  account});
});
router.patch("/restore-account" , validation(validators.QueryValidation) ,authentication(), authorization(endPoint.SensiveAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.restoreUser(req.query);
   successResponse({res , data :  account});
});
router.patch("/soft-delete" , validation(validators.QueryValidation) ,authentication(), authorization(endPoint.SensiveAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.softDelete(req.query);
   successResponse({res , data :  account});
});
router.delete("/delete-account",authentication(), authorization(endPoint.GeneralAuth) ,async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.hardDelete(req.user);
   successResponse({res , data :  account});
});
router.get("/rotate",authentication(TokenTypeEnum.REFREASH) , async (req : Request, res : Response, next : NextFunction) => {
  const account = await userService.rotateToken(req.user, `${req.protocol}://${req.host}` , req.decode);
   successResponse({res, data : account});
});
router.post("/logout", authentication(), async (req : Request, res : Response, next : NextFunction) => {
  const status = await userService.logout(req.body , req.user, req.decode);
   successResponse({res, status});
});
export default router