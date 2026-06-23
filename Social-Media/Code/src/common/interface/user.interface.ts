import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum, StatusEnum } from "../enum";
export interface IUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  userName?: string;
  slug?: string;
  email: string;
  password: string;
  bio?: string;
  phone?: string;
  profileImage?: string;
  coverImage?: string;
  DOB?: Date;
  friends? : Types.ObjectId[]
  friendsRequest? : [{
    userId : Types.ObjectId
    status? : StatusEnum
  }]
  confirmedAt: Date;
  provider: ProviderEnum;
  gender: GenderEnum;
  role: RoleEnum;
  createdAt?: Date;
  updatedAt?: Date;
  changeCredentialsTime?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
  freezedAt?: Date;
  unfreezedAt?: Date;
}
