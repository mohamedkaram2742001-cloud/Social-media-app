import { Types } from "mongoose";
import { notificationModelEnum } from "../enum";

export interface INotification {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  body: string | {};
  referenceId?: Types.ObjectId;
  referenceModel?: notificationModelEnum;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}
