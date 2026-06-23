import {
  HydratedDocument,
  model,
  models,
  MongooseBaseQueryOptions,
  QueryFilter,
  Schema,
  Types,
} from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum, StatusEnum } from "../../common/enum";
import { BadRequestException, NotFoundException } from "../../common/exception";
import { generateEncryption, generateHash } from "../../common/utils/security";
import { PostModel } from "./post.model";
import { IUser } from "../../common/interface/user.interface";
import { IPost } from "../../common/interface/post.interface";

const UserScehma = new Schema<IUser>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function (): boolean {
        return this.provider !== ProviderEnum.GOOGLE;
      },
    },
    slug: { type: String },
    bio: { type: String },
    phone: { type: String },
    profileImage: { type: String },
    coverImage: { type: String },
    DOB: Date,
    confirmedAt: Date,
    friends: [
      {
        type: Types.ObjectId,
        ref: "User",
        index: true,
      },
    ],
    friendsRequest: [
      {
        _id : false,
        userId: {
          type: Types.ObjectId,
          ref: "User",
          index: true,
        },
        status : {
          type : String,
          enum : StatusEnum,
          default : StatusEnum.PENDDING
        }
      },
    ],
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.SYSTEM,
    },
    gender: {
      type: Number,
      enum: GenderEnum,
      default: GenderEnum.MALE,
    },
    role: {
      type: Number,
      enum: RoleEnum,
      default: RoleEnum.USER,
    },
    createdAt: Date,
    updatedAt: Date,
    changeCredentialsTime: Date,
    deletedAt: Date,
    restoredAt: Date,
    freezedAt: Date,
    unfreezedAt: Date,
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  },
);
UserScehma.virtual("userName")
  .get(function () {
    return `${this.firstName} ${this.lastName}`;
  })
  .set(function (value: string) {
    const [firstName, lastName] = value.split(" ");
    this.firstName = firstName as string;
    this.lastName = lastName as string;
    this.slug = value.replaceAll(/\s+/, "-");
  });

UserScehma.pre("validate", function () {
  if (this.provider && this.provider == ProviderEnum.GOOGLE) {
    throw new BadRequestException("You can't send password with google email");
  }
});
UserScehma.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await generateHash(this.password);
  }
  if (this.phone && this.isModified("phone")) {
    this.phone = await generateEncryption(this.phone);
  }
});
UserScehma.pre(["find", "findOne","countDocuments"], function () {
  const query = this.getQuery();
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});
UserScehma.pre(["updateOne", "findOneAndUpdate"], async function () {
  const update = this.getUpdate() as HydratedDocument<IUser>;
  const query = this.getQuery();
  type updateManyFn = (
    filter: QueryFilter<IPost>,
    options?: MongooseBaseQueryOptions<IPost>,
  ) => ReturnType<typeof PostModel.updateMany>;
  const updateManyPosts = PostModel.updateMany.bind(PostModel) as updateManyFn;
  if (update.deletedAt) {
    this.setUpdate({ ...update, $unset: { restoredAt: 1 } });
    await updateManyPosts(
      { userId: query._id },
      { $set: { deletedAt: new Date(Date.now()) } },
    );
  }
  if (update.restoredAt) {
    this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
    this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
    await updateManyPosts(
      { userId: query._id },
      { $set: { restoredAt: new Date(Date.now()) } },
    );
  }
  if (update.freezedAt) {
    this.setUpdate({ ...update, $unset: { unfreezedAt: 1 } });
  }
  if (update.unfreezedAt) {
    this.setQuery({ ...this.getQuery(), freezedAt: { $exists: true } });
    this.setUpdate({ ...update, $unset: { freezedAt: 1 } });
  }
  if (query.paranoid === false) {
    this.setQuery({ ...query });
  } else {
    this.setQuery({ ...query, deletedAt: { $exists: false } });
  }
});
UserScehma.pre(["deleteOne", "findOneAndDelete"], async function () {
  const query = this.getQuery();
  const user = await this.model.findOne(query);
  if (!user) {
    throw new NotFoundException("User not found");
  }
  const force = query?.force;
  if (!user.deletedAt && !force) {
    throw new BadRequestException(
      "Account is not soft deleted. Use force delete to permanently remove it.",
    );
  }
  this.setQuery({ ...query });
  type deleteManyFn = (
    filter: QueryFilter<IPost>,
    options?: MongooseBaseQueryOptions<IPost>,
  ) => ReturnType<typeof PostModel.deleteMany>;
  const deleteManyPosts = PostModel.deleteMany.bind(PostModel) as deleteManyFn;
  await deleteManyPosts({ userId: query._id });
});
UserScehma.pre("aggregate", function () {
  const opts = this.options || {};
  if (opts.allowDeleted === false) {
    this.pipeline().unshift({ $match: { deletedAt: { $exists: false } } });
  }
});

export const UserModel = models.User || model<IUser>("User", UserScehma);
UserModel.syncIndexes();
