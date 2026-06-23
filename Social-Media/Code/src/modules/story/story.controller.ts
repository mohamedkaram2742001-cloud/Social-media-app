import { NextFunction, Request, Response, Router } from "express";
import { authentication, storyLimiter, validation } from "../../middleware";
import { successResponse } from "../../common/response";
import * as validators from './story.validation'
import { deleteStoryParamsDTO, getStoryParamsDTO, updateStoryParamsDTO } from "./story.dto";
import { storyService } from "./story.service";
const router = Router({mergeParams : true})
router.post("/create-story",validation(validators.creatStory),authentication() , storyLimiter ,async (req : Request, res : Response, next : NextFunction) => {
  const story = await storyService.createStory(req.user , req.body);
   successResponse({res , status : 201 , data :  story});
});
router.patch("/update-story/:storyId",validation(validators.updateStory),authentication() ,async (req : Request, res : Response, next : NextFunction) => {
  const story = await storyService.updateStory(req.user , req.body , req.params as updateStoryParamsDTO);
   successResponse({res , data :  story});
});
router.get("/all",authentication(),async (req : Request, res : Response, next : NextFunction) => {
  const stories = await storyService.getStories(req.user);
   successResponse({res  , data :  stories});
});
router.get("/get-story/:storyId",validation(validators.getStory),authentication(),async (req : Request, res : Response, next : NextFunction) => {
  const story = await storyService.getStory(req.user , req.params as getStoryParamsDTO , req.query);
   successResponse({res  , data :  story});
});
router.delete("/delete-story/:storyId",validation(validators.deleteStory),authentication(),async (req : Request, res : Response, next : NextFunction) => {
  const story = await storyService.deleteStory(req.user , req.params as deleteStoryParamsDTO);
   successResponse({res  , data :  story});
});
export default router