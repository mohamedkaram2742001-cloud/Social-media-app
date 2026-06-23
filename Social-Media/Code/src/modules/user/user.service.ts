import { StatusEnum } from "./../../common/enum/user.enum";
import {
  TokenService,
  tokenService,
  RedisService,
  IGenerateToken,
  S3Service,
  s3Service,
  NotificationService,
  notificationService,
  redisService,
} from "./../../common/service";
import {
  CommentRepository,
  NotificationRepository,
  PostRepository,
  ReactRepository,
  StoryRepository,
  UserRepository,
} from "../../DB/Repository";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exception";
import {
  LogoutEnum,
  ReactEnum,
  ReactTargetEnum,
} from "../../common/enum";
import { compareHash, generateHash } from "../../common/utils/security";
import { HydratedDocument, Types } from "mongoose";
import { JwtPayload } from "jsonwebtoken";
import { ACCESS_EXPIRES_IN } from "../../config/config";
import { IUser } from "../../common/interface/user.interface";
import { ParsedQs } from "qs";
import { TransformToObjectId } from "../../common/utils/ObjectId";
import { actionFriendRequestDTO, ReactDTOQuey } from "./user.dto";
import { IReact } from "../../common/interface/react.interface";
import { getAvalibilaty } from "../../common/utils/post";
import { INotification } from "../../common/interface";

class UserService {
  private readonly UserRepository: UserRepository;
  private readonly PostRepository: PostRepository;
  private readonly CommentRepository: CommentRepository;
  private readonly ReactRepository: ReactRepository;
  private readonly NotificationRepository: NotificationRepository;
  private readonly StoryRepository: StoryRepository;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;
  private readonly s3: S3Service;
  private readonly notification: NotificationService;
  constructor() {
    this.UserRepository = new UserRepository();
    this.PostRepository = new PostRepository();
    this.CommentRepository = new CommentRepository();
    this.ReactRepository = new ReactRepository();
    this.StoryRepository = new StoryRepository();
    this.NotificationRepository = new NotificationRepository();
    this.redis = redisService;
    this.tokenService = tokenService;
    this.s3 = s3Service;
    this.notification = notificationService;
  }
  async isFriendRequestExists({
    user,
    targetUserId,
    status = StatusEnum.PENDDING,
  }: {
    user: HydratedDocument<IUser>;
    targetUserId: Types.ObjectId;
    status?: StatusEnum;
  }): Promise<void | undefined> {
    if (!user?.friendsRequest) return;
    const isExist = user?.friendsRequest.some(
      (req) =>
        String(req.userId) === String(targetUserId) &&
        (status ? req.status === status : true),
    );
    if (isExist) {
      throw new BadRequestException("is actully in your friends request list.");
    } else {
      user.friendsRequest.push({
        userId: targetUserId,
        status: StatusEnum.PENDDING,
      });
      await user.save();
      return;
    }
  }
  async profile(user: HydratedDocument<IUser> , userId? : string) {
    if (userId) {
      const User = await this.UserRepository.findOne({
      filter: { _id: TransformToObjectId(userId), confirmedAt: { $exists: true } },
      projection : "firstName lastName profileImage coverImage bio"
    });
    if (!User) {
      throw new NotFoundException("No account matching");
    }
    if (userId !== user._id.toString()) {
      await this.redis.addViewer(userId , user._id.toString(), Date.now());
    }
    return User;
    }
    const User = await this.UserRepository.findOne({
      filter: { _id: user?._id, confirmedAt: { $exists: true } },
      projection : "firstName lastName DOB bio gender friends profileImage coverImage",
      options : {populate : [{path : "friends" , select : "firstName lastName profileImage" , options : {limit : 6}}]}
    });
    if (!User) {
      throw new NotFoundException("No account matching");
    }
    const viewersCount = await this.redis.viewerCount(User._id)
    const viewers = await this.redis.getViewersWithDate(User._id)
    const formattedViewers = await Promise.all(viewers.map(async (v: any) => {
    const user = await this.UserRepository.findById({_id : TransformToObjectId(v.value) , projection : "firstName lastName profileImage"});
      return { user,viewedAt: new Date(Number(v.score)).toLocaleString()}})
    )    
    return {User , viewersCount : viewersCount , viewers : formattedViewers};
  }
  async allFriends(user: HydratedDocument<IUser>) {
      const User = await this.UserRepository.findOne({
      filter: { _id: user._id, confirmedAt: { $exists: true } },
      projection : "friends",
      options : {populate : [{path : "friends" , select : "firstName lastName profileImage"}]}
    });
    if (!User) {
      throw new NotFoundException("No account matching");
    }
    return User;
    }
  async allFriendsRequest(user: HydratedDocument<IUser>) {
      const User = await this.UserRepository.findOne({
      filter: { _id: user._id, confirmedAt: { $exists: true } },
      projection : "friendsRequest createdAt",
      options : {populate : [{path : "friendsRequest.userId" , select : "firstName lastName profileImage"}]}
    });
    if (!User) {
      throw new NotFoundException("No account matching");
    }
    return User;
    }
  async react(user: HydratedDocument<IUser>, Query: ReactDTOQuey): Promise<HydratedDocument<IReact> | string> {
    const { targetId, targetType, type } = Query;
    let target;
    const TargetId = TransformToObjectId(targetId as string);
    switch (targetType) {
      case ReactTargetEnum.COMMENT:
        target = await this.CommentRepository.findOne({filter : { _id: TargetId  }});
        break;
      case ReactTargetEnum.POST:
        target = await this.PostRepository.findOne({filter : { _id: TargetId , $or : getAvalibilaty(user)} });
        break;
      case ReactTargetEnum.STORY:
        target = await this.StoryRepository.findOne({filter : { _id: TargetId , $or : getAvalibilaty(user)} });
        break;

      default:
        throw new BadRequestException("Invalid targetType");
    }
    if (!target) {
      throw new NotFoundException(`${targetType} not Found`);
    }
    const reactTargetExist = await this.ReactRepository.findOne({
      filter: {
        userId: user._id,
        targetId: TargetId,
        targetType: targetType as string,
      },
    });
    if ( targetType === ReactTargetEnum.STORY && target.userId.toString() === user._id.toString()){
      throw new BadRequestException("you can't react with your story by your account")
    }
    if (!reactTargetExist) {
      const React = await this.ReactRepository.create({
        data: { userId: user._id, targetId: TargetId, targetType, type },
      });
      const title =
        targetType === ReactTargetEnum.POST
          ? `${user.userName} racted with your post `
          : targetType === ReactTargetEnum.COMMENT
            ? `${user.userName} reacted with your comment`
            : targetType === ReactTargetEnum.STORY 
            ? `${user.userName} reacted with your Story`
            : "";
      const body =
        targetType === ReactTargetEnum.POST
          ? target.content?.slice(0, 20) || "Post"
          : targetType === ReactTargetEnum.COMMENT
            ? target.content?.slice(0, 20) || "Comment"
          : targetType === ReactTargetEnum.STORY
            ? "❤️"
            : "";
      await this.NotificationRepository.create({
        data: {
          senderId: user._id,
          recipientId: target.userId,
          referenceId: targetId,
          referenceModel: targetType,
          title,
          body,
        },
      });
      const tokens = await this.redis.getFCMs(target.userId);
      if (tokens?.length) {
        await this.notification.sendNotifications({
          tokens,
          data: { title, body },
        });
      }
      return React;
    }
    if (reactTargetExist.type === type) {
      const removeReact = await this.ReactRepository.deleteOne({
        filter: { _id: reactTargetExist._id },
      });
      if (!removeReact.deletedCount) {
        throw new NotFoundException(`This ${targetType} not exist`);
      }
      return "Done";
    }
    reactTargetExist.type = type as ReactEnum;
    await reactTargetExist.save();
    return reactTargetExist;
  }
  async addFriend(
    user: HydratedDocument<IUser>,
    query: ParsedQs,
  ): Promise<string> {
    const { userId } = query;
    const _id = TransformToObjectId(userId as string);
    const userExists = await this.UserRepository.findById({ _id });
    if (!userExists) {
      throw new NotFoundException("This user is not exist");
    }
    await this.isFriendRequestExists({ user, targetUserId: _id });
    await this.isFriendRequestExists({ user: userExists , targetUserId: user._id});
    const tokens = await this.redis.getFCMs(userExists._id);
    if (tokens) {
      await this.notification.sendNotifications({
        tokens,
        data: {
          title: "Friend Request",
          body: `${user.userName} sent you a friend request`,
          extra: { userId: user._id.toString() },
        },
      });
    }
    return "Send Request Successfuly";
  }
  async getAllNofitications( user: HydratedDocument<IUser>): Promise<HydratedDocument<INotification>[]> {
    const notifications = await this.NotificationRepository.find({filter : {recipientId : user._id} , options : {sort : {createdAt : -1}}})
    if (!notifications.length) {
      throw new NotFoundException("There'nt any Notifications")
    }
    return notifications
  }
  async readNotifications( user: HydratedDocument<IUser> , notificationID : string): Promise<HydratedDocument<INotification>> {
    const _id = TransformToObjectId(notificationID)
    const notification = await this.NotificationRepository.findOne({filter : {_id , recipientId : user._id} , options : {sort : {createdAt : -1}}})
    if (!notification) {
      throw new NotFoundException("This notification not exist or expire")
    }
    notification.isRead = true
    await notification.save()
    return notification
  }
  async actionOfRequestFriend(
    user: HydratedDocument<IUser>,
    data: actionFriendRequestDTO,
  ): Promise<string> {
    const { userId, status } = data;
    const _id = TransformToObjectId(userId as string);
    const userExistsInMyList = await this.UserRepository.findOne({
      filter: { _id: user._id, "friendsRequest.userId": _id },
    });
    if (!userExistsInMyList) {
      throw new NotFoundException(
        "This user is not exist in your list friends request",
      );
    }
    switch (status) {
      case StatusEnum.ACCEPT:
        await Promise.all([
          this.UserRepository.updateOne({
            filter: { _id: user._id },
            update: {
              $pull: { friendsRequest: { userId: _id } },
              $addToSet: { friends: _id },
            },
          }),
          this.UserRepository.updateOne({
            filter: { _id },
            update: {
              $pull: { friendsRequest: { userId: user._id } },
              $addToSet: { friends: user._id },
            },
          }),
        ]);
        break;

      case StatusEnum.CANCEL:
        await Promise.all([
          this.UserRepository.updateOne({
            filter: { _id: user._id },
            update: {
              $pull: { friendsRequest: { userId: _id } },
            },
          }),
          this.UserRepository.updateOne({
            filter: { _id },
            update: {
              $pull: { friendsRequest: { userId: user._id } },
            },
          }),
        ]);
        break;
    }
    return `${status} Successfuly`;
  }
  async profileImage(
    user: HydratedDocument<IUser>,
    file: Express.Multer.File,
  ): Promise<IUser> {
    const oldProfileImage = user?.profileImage;
    const { Key } = await this.s3.uploadLargAsset({
      file,
      path: `users/${user._id.toString()}/profile`,
      ContentType: file.mimetype,
    });
    user.profileImage = Key as string;
    await user.save();
    if (oldProfileImage) {
      await this.s3.deleteAsset({ Key: oldProfileImage });
    }
    return user;
  }
  async coverImage(
    user: HydratedDocument<IUser>,
    file: Express.Multer.File,
  ): Promise<IUser> {
    const oldCover = user?.coverImage;
    const { Key } = await this.s3.uploadLargAsset({
      file,
      path: `users/${user._id.toString()}/cover`,
      ContentType: file.mimetype,
    });
    user.coverImage = Key as string;
    await user.save();
    if (oldCover) {
      await this.s3.deleteAsset({ Key: oldCover });
    }
    return user;
  }
  async updatePassword(
    data: { oldPassword: string; newPassword: string },
    user: HydratedDocument<IUser>,
  ): Promise<string> {
    const { oldPassword, newPassword } = data;
    if (!(await compareHash(oldPassword, user.password))) {
      throw new NotFoundException("Invalid Password");
    }
    user.password = await generateHash(newPassword);
    await user.save();
    return "Update Password successfuly";
  }
  async rotateToken(
    user: HydratedDocument<IUser>,
    issure: string,
    decodedToken: JwtPayload,
  ): Promise<IGenerateToken> {
    await this.redis.sadd(
      this.redis.RevokeTokenKey(String(user._id)),
      String(decodedToken.jti),
    );
    const now = Math.floor(Date.now() / 1000);
    const ttl = (decodedToken.exp as number) - now;
    if (now < (decodedToken.iat as number) + ACCESS_EXPIRES_IN) {
      throw new ConflictException("Current access session still valid");
    }
    await this.redis.sadd(
      this.redis.RevokeTokenKey(String(user._id)),
      String(decodedToken.jti),
    );
    await this.redis.expire(this.redis.RevokeTokenKey(String(user._id)), ttl);
    return await this.tokenService.createLoginCredentials(user, issure);
  }
  async logout(
    { flag }: { flag: number },
    user: HydratedDocument<IUser>,
    decodedToken: JwtPayload,
  ): Promise<number> {
    let status = 200;
    const now = Math.floor(Date.now() / 1000);
    const ttl = (decodedToken.exp as number) - now;

    switch (flag) {
      case LogoutEnum.ALL:
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.set({
          key: this.redis.RevokeAllTokenKey(String(user._id)),
          value: now,
        });
        break;
      default:
        user.changeCredentialsTime = new Date();
        await user.save();
        await this.redis.sadd(
          this.redis.RevokeTokenKey(String(user._id)),
          String(decodedToken.jti),
        );
        await this.redis.expire(
          this.redis.RevokeTokenKey(String(user._id)),
          ttl,
        );
        status = 201;
        break;
    }
    return status;
  }
  async freezeUser(Query: ParsedQs): Promise<string> {
    const { userId } = Query;
    const user = await this.UserRepository.findOne({
      filter: { _id: TransformToObjectId(userId as string) },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.freezedAt) {
      throw new ConflictException("User is already frozen");
    }
    const account = await this.UserRepository.updateOne({
      filter: { _id: TransformToObjectId(userId as string) },
      update: { freezedAt: new Date() },
    });
    return "User frozen successfully";
  }
  async unFreezeUser(Query: ParsedQs): Promise<string> {
    const { userId } = Query;
    const user = await this.UserRepository.findOne({
      filter: { _id: TransformToObjectId(userId as string) },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.unfreezedAt) {
      throw new ConflictException("User is already unfrozen");
    }
    const account = await this.UserRepository.updateOne({
      filter: { _id: new Types.ObjectId(userId as string) },
      update: { unfreezedAt: new Date() },
    });
    return "User unfrozen successfully";
  }
  async softDelete(Query: ParsedQs): Promise<string> {
    const { userId } = Query;
    const user = await this.UserRepository.findOne({
      filter: { _id: TransformToObjectId(userId as string) },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.deletedAt) {
      throw new ConflictException("User is already in archive");
    }
    const account = await this.UserRepository.updateOne({
      filter: { _id: TransformToObjectId(userId as string) },
      update: { deletedAt: new Date() },
    });
    return "User add to archive successfuly";
  }
  async restoreUser(Query: ParsedQs): Promise<string> {
    const { userId } = Query;
    const user = await this.UserRepository.findOne({
      filter: { _id: TransformToObjectId(userId as string) },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (user.restoredAt) {
      throw new ConflictException("User is already restored");
    }
    const account = await this.UserRepository.updateOne({
      filter: { _id: TransformToObjectId(userId as string), paranoid: false },
      update: { restoredAt: new Date() },
    });
    return "User Restored Successful";
  }
  async hardDelete(user: HydratedDocument<IUser>): Promise<string> {
    const account = await this.UserRepository.deleteOne({
      filter: { _id: user._id, force: true },
    });
    if (!account.deletedCount) {
      throw new NotFoundException("Invalid account");
    }
    Promise.allSettled([ 
      this.s3.deleteFolderByPreifx({ Prefix: `users/${user._id.toString()}`}),
      this.s3.deleteFolderByPreifx({ Prefix: `posts/${user._id.toString()}`}),
      this.s3.deleteFolderByPreifx({ Prefix: `comments/${user._id.toString()}`}),
      this.s3.deleteFolderByPreifx({ Prefix: `stories/${user._id.toString()}`})
    ])
    return "User Deleted Successful";
  }
}
export const userService = new UserService();
