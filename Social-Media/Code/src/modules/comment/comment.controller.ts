import { NextFunction, Request, Response, Router } from "express";
import { authentication, commentLimiter, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import * as validators from './comment.validation'
import { commentService } from "./comment.service";
import { CloudFileUpload, fieldValidation } from "../../common/utils/multer";
import { StorageApproachEnum } from "../../common/enum";
import { createCommenParamstDTO, getAllCommentsDTO, getCommentParamsDTO } from "./comment.dto";
const router = Router({mergeParams : true})
router.post("/create-comment", CloudFileUpload({storageApproach : StorageApproachEnum.DISK , validation : fieldValidation.attachments , maxSize : 10}).array("attachments"),validation(validators.creatComment) ,authentication() , commentLimiter ,async (req : Request, res : Response, next : NextFunction) => {
  const comment = await commentService.createComment(req.user , req.body , req.params as createCommenParamstDTO)
   successResponse({res , status : 201 , data : comment});
});
router.get("/get-comment/:commentId",validation(validators.getCommentParams),authentication(),async (req : Request, res : Response, next : NextFunction) => {
   const comment = await commentService.getComment(req.user  , req.params as getCommentParamsDTO)
   successResponse({res , data : comment})
});
router.get("/all",validation(validators.getAllComments),authentication(),async (req : Request, res : Response, next : NextFunction) => {
   const allComments = await commentService.getAllComments(req.user , req.query as getAllCommentsDTO)
   successResponse({res , data : allComments})
});
router.patch("/reply-comment/:commentId",validation(validators.replyComment),authentication(),async (req : Request, res : Response, next : NextFunction) => {
   const allComments = await commentService.replyComment(req.user , req.body , req.params as getCommentParamsDTO)
   successResponse({res , data : allComments})
});
router.patch("/update-comment/:commentId",validation(validators.updateComment),authentication(),async (req : Request, res : Response, next : NextFunction) => {
   const comment = await commentService.updateComment(req.user , req.body , req.params as getCommentParamsDTO)
   successResponse({res , data : comment})
});
router.delete("/delete-comment/:commentId",validation(validators.getCommentParams),authentication(),async (req : Request, res : Response, next : NextFunction) => {
   const comment = await commentService.deleteComment(req.user , req.params as getCommentParamsDTO)
   successResponse({res , data : comment})
});
export default router