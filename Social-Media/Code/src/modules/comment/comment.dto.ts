import z from "zod";
import { creatComment, getAllComments, getCommentParams, replyComment } from "./comment.validation";

export type createCommentDTO = z.infer<typeof creatComment.body>
export type createCommenParamstDTO = z.infer<typeof creatComment.params>

export type replyCommentDTO = z.infer<typeof replyComment.body>

export type getAllCommentsDTO = z.infer<typeof getAllComments.query>
export type getCommentParamsDTO = z.infer<typeof getCommentParams.params>