import z from "zod";
import { creatStory, deleteStory, getStory, updateStory } from "./story.validation";

export type createStoryDTO = z.infer<typeof creatStory.body>
export type updateStoryBodyDTO = z.infer<typeof updateStory.body>
export type getStoryParamsDTO = z.infer<typeof getStory.params>
export type updateStoryParamsDTO = z.infer<typeof updateStory.params>
export type deleteStoryParamsDTO = z.infer<typeof deleteStory.params>