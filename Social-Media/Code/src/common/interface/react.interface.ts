import { Types } from "mongoose";
import { ReactEnum, ReactTargetEnum } from "../enum";
export interface IReact {
  userId: Types.ObjectId;
  targetId: Types.ObjectId;
  targetType: ReactTargetEnum;
  type: ReactEnum;
  createdAt: Date;
  updatedAt: Date;
}
