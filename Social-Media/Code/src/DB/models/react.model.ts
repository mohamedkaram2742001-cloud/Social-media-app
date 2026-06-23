import { model, models, Schema, Types } from "mongoose";
import { ReactEnum, ReactTargetEnum } from "../../common/enum";
import { IReact } from "../../common/interface/react.interface";

const ReactSchema = new Schema<IReact>({
  userId: {
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  targetId: {
    type: Types.ObjectId,
    refPath: "targetType",
    required: true
  },
  targetType : {
    type : String,
    enum : ReactTargetEnum,
    required : true
  },
  type: {
    type: String,
    enum: ReactEnum,
    required: true
  }
},
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
  },
);
ReactSchema.index(
  { userId: 1, targetId: 1 , targetType : 1 },
  { unique: true }
);
export const ReactModel = models.React || model<IReact>("React", ReactSchema);
