import { model, models, Schema, Types } from "mongoose";
import { IComment } from "../../common/interface/comment.interface";
import { BadRequestException } from "../../common/exception";

const commentSchema = new Schema<IComment>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    postId: {
      type: Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    content: String,
    attachments: {
      type: {
        image: [String],
        video: [String],
      },
      _id: false,
    },
    parentComment: {
      type: Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    mentions: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    deletedAt: Date,
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
  },
);

commentSchema.pre("validate", function () {
  if (
    !this.content &&
    (!this.attachments ||
      (!this.attachments.image?.length && !this.attachments.video?.length))
  ) {
    throw new BadRequestException("Comment must have content or attachments");
  }
});
export const CommentModel =
  models.Comment || model<IComment>("Comment", commentSchema);
CommentModel.syncIndexes();
