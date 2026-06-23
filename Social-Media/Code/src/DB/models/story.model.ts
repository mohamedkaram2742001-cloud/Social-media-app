import { model, models, Schema, Types } from "mongoose";
import { availabilityEnum } from "../../common/enum";
import { IStory } from "../../common/interface";
import { BadRequestException } from "../../common/exception";

const StoryScehma = new Schema<IStory>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      index: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.attachments;
      },
    },
    attachments: {
      _id: false,
      image: [String],
      video: [String],
    },
    tags: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    mentions: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    availability: {
      type: Number,
      enum: availabilityEnum,
      default: availabilityEnum.PUBLIC,
    },
    expiresAt : {
      type : Date,
      default : new Date(Date.now() + 24 * 60 * 60 * 1000 ),
    }
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
  },
);
StoryScehma.pre("validate", function () {
  if (
    !this.content &&
    (!this.attachments ||
      (!this.attachments.image?.length && !this.attachments.video?.length))
  ) {
    throw new BadRequestException("Content is Required");
  }
});
export const StoryModel = models.Story || model<IStory>("Story", StoryScehma);
StoryModel.syncIndexes();
