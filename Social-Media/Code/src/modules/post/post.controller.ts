import { NextFunction, Request, Response, Router } from "express";
import { authentication, postLimiter, validation } from "../../middleware";
import { postService } from "./post.service";
import { successResponse } from "../../common/response";
import * as validators from './post.validation'
import { deletePostParamsDTO, updatePostParamsDTO } from "./post.dto";
import { CommentRouter } from "../comment";
const router = Router()
router.use("/:postId/comment" , CommentRouter)
router.post("/create-post",validation(validators.creatPost),authentication(),postLimiter ,async (req : Request, res : Response, next : NextFunction) => {
  const post = await postService.createPost(req.user , req.body);
   successResponse({res , status : 201 , data :  post});
});
router.patch("/update-post/:postId",validation(validators.updatePost),authentication() ,async (req : Request, res : Response, next : NextFunction) => {
  const post = await postService.updatePost(req.user , req.body , req.params as updatePostParamsDTO);
   successResponse({res , data :  post});
});
router.get("/all",authentication(),async (req : Request, res : Response, next : NextFunction) => {
  const posts = await postService.getPosts(req.user , req.query);
   successResponse({res  , data :  posts});
});
router.get("/get-post/:postId",validation(validators.deletePost),authentication(),async (req : Request, res : Response, next : NextFunction) => {
  const posts = await postService.getPost(req.user , req.params as deletePostParamsDTO);
   successResponse({res  , data :  posts});
});
router.delete("/delete-post/:postId",validation(validators.deletePost),authentication(),async (req : Request, res : Response, next : NextFunction) => {
  const posts = await postService.deletePost(req.user , req.params as deletePostParamsDTO);
   successResponse({res  , data :  posts});
});
export default router