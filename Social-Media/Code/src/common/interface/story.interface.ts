import { Types } from "mongoose";
import { availabilityEnum } from "../enum";

export interface IStory {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  expiresAt: Date;
  content?: string;
  attachments?: {
    image?: string[];
    video?: string[];
  };
  availability: availabilityEnum;
  tags?: Types.ObjectId[];
  mentions?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
