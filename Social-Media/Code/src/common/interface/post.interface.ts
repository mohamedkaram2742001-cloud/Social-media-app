import { Types } from "mongoose";
import { availabilityEnum } from "../enum";

export interface IPost {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  content?: string;
  attachments?: {
    image?: string[] | string;
    video?: string[] | string;
  };
  tags?: Types.ObjectId[];
  mentions?: Types.ObjectId[];
  availability: availabilityEnum;
  deletedAt?: Date | null;
  restoredAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
  unfreezedAt?: Date | null;
  freezedAt?: Date | null;
}
