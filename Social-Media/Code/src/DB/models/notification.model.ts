import { model, models, Schema, Types } from "mongoose";
import {  notificationModelEnum } from "../../common/enum";
import { INotification } from "../../common/interface/notification.interface";
const NotificationScehma = new Schema<INotification>(
  {
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipientId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title : {
        type : String,
        required : true
    },
    body : {
        type : String || {},
        required : true
    },
    referenceId: {
        type : Types.ObjectId,
        refPath : "referenceModel"
    },
    referenceModel : {
        type: String,
        enum: notificationModelEnum,
        default : notificationModelEnum.USER
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    }
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
  },
);
NotificationScehma.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationScehma.index({createdAt : 1 }, {expireAfterSeconds : 7 * 24 * 60 * 60 * 1000})
export const NotificationModel = models.Notification || model<INotification>("Notification", NotificationScehma);
NotificationModel.syncIndexes()
