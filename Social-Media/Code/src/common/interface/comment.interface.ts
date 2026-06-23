import { Types } from "mongoose";

export interface IComment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  postId: Types.ObjectId;
  content?: string;
  attachments?: {
    image?: string[];
    video?: string[];
  };
  parentComment?: Types.ObjectId;
  mentions?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
