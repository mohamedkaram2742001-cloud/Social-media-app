import { HydratedDocument } from "mongoose";
import { availabilityEnum } from "../enum";
import { IUser } from "../interface/user.interface";

export const getAvalibilaty = (user: HydratedDocument<IUser>) => {
  return [
    { availability: availabilityEnum.PUBLIC },
    {
      availability: availabilityEnum.ONLYFRIENDS,
      userId: { $in: [...(user?.friends || []), user?._id] },
    },
    { availability: availabilityEnum.PRIVATE, userId: user?._id },
    { mentions: { $in: [user?._id] } },
    { tags: { $in: [user?._id] } },
  ];
};
