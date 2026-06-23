import z from "zod";
import { creatPost, deletePost, updatePost } from "./post.validation";

export type createPostDTO = z.infer<typeof creatPost.body>
export type updatePostBodyDTO = z.infer<typeof updatePost.body>
export type updatePostParamsDTO = z.infer<typeof updatePost.params>
export type deletePostParamsDTO = z.infer<typeof deletePost.params>