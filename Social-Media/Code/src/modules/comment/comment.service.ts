import {  HydratedDocument } from 'mongoose';
import { NotificationService, notificationService, redisService, RedisService, s3Service, S3Service } from '../../common/service';
import { PostRepository } from '../../DB/Repository/post.repository';
import { CommentRepository, NotificationRepository, ReactRepository, UserRepository } from '../../DB/Repository';
import {  NotFoundException, UnauthorizedException } from '../../common/exception';
import { IUser } from '../../common/interface/user.interface';
import { createCommenParamstDTO, createCommentDTO, getAllCommentsDTO, getCommentParamsDTO } from './comment.dto';
import { TransformToObjectId } from '../../common/utils/ObjectId';
import { IComment } from '../../common/interface/comment.interface';
import { notificationModelEnum } from '../../common/enum';
import { getAvalibilaty } from '../../common/utils/post';
import { IReact } from '../../common/interface';
class CommentService {
    private readonly postRepository : PostRepository
    private readonly userRepository : UserRepository
    private readonly reactRepository : ReactRepository
    private readonly commentRepository : CommentRepository
    private readonly NotificationRepository : NotificationRepository
    private readonly redis: RedisService;
    private readonly s3: S3Service;
    private readonly notification: NotificationService;
    constructor(){
        this.userRepository = new UserRepository()
        this.postRepository = new PostRepository()
        this.reactRepository = new ReactRepository()
        this.NotificationRepository = new NotificationRepository()
        this.commentRepository = new CommentRepository()
        this.redis = redisService;
        this.s3 = s3Service;
        this.notification = notificationService;
    }
    async createComment(user : HydratedDocument<IUser> , data : createCommentDTO , query : createCommenParamstDTO):Promise<IComment>{
        const postId = TransformToObjectId(query.postId as string)
        const PostExist = await this.postRepository.findOne({
            filter : {
                deletedAt: { $exists: false },
                _id : postId,
                }
            }
        )
        if (!PostExist) {
            throw new NotFoundException("This Post Not Exist")
        }
        const comment = await this.commentRepository.create({data : {userId : user._id , postId , ...data}})
        const tokens = await this.redis.getFCMs(user._id)
        await this.notification.sendNotifications({tokens , data : {title : `${user.userName} commented on your post` , body :  comment.content ? `${comment.content?.slice(0,20)}` : `✅`}})
        await this.NotificationRepository.create({data : {recipientId : PostExist.userId , senderId : user._id , title : `${user.userName} commented on your post` , referenceId : comment._id , referenceModel : notificationModelEnum.COMMENT , body : JSON.stringify({content : comment.content , attachments : comment.attachments || `✅`})}})
        return comment
    }
    async replyComment(user : HydratedDocument<IUser> , data : createCommentDTO , query : getCommentParamsDTO):Promise<IComment>{
        const commentId = TransformToObjectId(query.commentId)
        const postId = TransformToObjectId(query.postId)
        const PostExist = await this.postRepository.findOne({
            filter : {
                deletedAt: { $exists: false },
                _id : postId,
                $or : getAvalibilaty(user)
                }
            }
        )
        if (!PostExist) {
            throw new NotFoundException("This Post Not Exist")
        }
        const commentExist = await this.commentRepository.findById({_id : commentId})
        if (!commentExist) {
            throw new NotFoundException("This comment not exist")
        }
        const newComment = await this.commentRepository.create({data : {postId , parentComment : commentId , userId : user._id , ...data }})
        return newComment 
    }
    async getAllComments(user : HydratedDocument<IUser> , query : getAllCommentsDTO):Promise<IComment[]>{
        const postId = TransformToObjectId(query.postId as string)
        const limit = Number(query?.limit) || 5
        const cursor = query?.cursor
        const filter : any = { postId : postId , deletedAt : {$exists : false}}
        if (cursor) {
            filter._id = {$le : TransformToObjectId(cursor as string)}
        }
        const allCommentsRelatedByPost = this.commentRepository.aggregate([
            {
                $match : filter
            },
            {
                $limit : limit
            },
            {
                $lookup : {
                    from : "posts",
                    let : {postId : "$postId"},
                    pipeline : [
                        {
                            $match : {
                                $expr : {
                                    $and : [
                                        {$eq : ["$_id" , "$$postId"]},
                                        {$eq : ["$userId" , user._id]}
                                    ]
                                }
                            }
                        }
                    ],
                    as : "post"
                }
            },
            {
                $match : {post : {$ne : []}}
            },
            {
                $lookup : {
                    from : "users",
                    localField : "userId",
                    foreignField : "_id",
                    as : "user"
                }
            },
            {
                $project : {
                    "user.email" : 0,
                    "user.password" : 0,
                    "user.provider" : 0,
                    "user.role" : 0,
                    "user.DOB" : 0,
                    "user.gender" : 0,
                    "user.updatedAt" : 0,
                    "user.__v" : 0,
                    "user.confirmedAt" : 0,
                    "user.friends" : 0,
                    "user.friendsRequest" : 0,
                }
            },
            {
                $unwind : "$user"
            },
            {
                $sort : {createdAt : -1}
            }
        ])
        return allCommentsRelatedByPost
    }
    async getComment(user : HydratedDocument<IUser>  , {commentId , postId} : getCommentParamsDTO):Promise<{comment : IComment , reacts : IReact | null , reactsCounts : number | null}>{        
        const PostId = TransformToObjectId(postId)
        const CommentId =  TransformToObjectId(commentId)        
        const PostExist = await this.postRepository.findOne({filter : {_id : PostId  , $or : getAvalibilaty(user)}})
        if (!PostExist) {
            throw new NotFoundException("This Post Not Exist")
        }
        const comment = await this.commentRepository.findOne({filter : {_id : CommentId , postId : PostId }})
        if (!comment) {
            throw new NotFoundException("This comment not exist")
        }
        const reacts = await this.reactRepository.find({filter : {targetId : comment._id} , projection : "-targetType" , options : {populate : [{path : "userId" , select : "firstName lastName profileImage"}]}} )
        if (!reacts.length) {
            throw new NotFoundException("There isn't any reacts until now.")
        }
        return {comment , reacts : reacts as unknown as IReact  , reactsCounts : reacts.length}
    }
    async updateComment(user : HydratedDocument<IUser> , data : createCommentDTO  , {commentId , postId} : getCommentParamsDTO):Promise<IComment>{
        const CommentId =  TransformToObjectId(commentId)
        const PostId = TransformToObjectId(postId)
        const PostExist = await this.postRepository.findOne({
            filter : {
                deletedAt: { $exists: false },
                _id : PostId,
                $or : getAvalibilaty(user)
                }
            }
        )
        if (!PostExist) {
            throw new NotFoundException("This Post Not Exist")
        }        
        const comment = await this.commentRepository.findOneAndUpdate({filter : {_id : CommentId , postId : PostId , userId : user._id } , update : {$set : {...data}} , options : {populate : [{path : "userId" , select : "firstName lastName profileImage"}] , new : true}})
        if (!comment) {
            throw new NotFoundException("This comment not exist") 
        }
        return comment
    }
    async deleteComment(user : HydratedDocument<IUser>  , {commentId , postId} : getCommentParamsDTO):Promise<string>{
        const CommentId = TransformToObjectId(commentId)
        const PostId = TransformToObjectId(postId)
        const PostExist = await this.postRepository.findOne({
            filter : {
                deletedAt: { $exists: false },
                _id : PostId,
                $or : getAvalibilaty(user)
                }
            }
        )
        if (!PostExist) {
            throw new NotFoundException("This Post Not Exist")
        }
        const commentExist = await this.commentRepository.findOne({ filter : {_id: CommentId, postId: PostId, userId: { $in: [user._id, PostExist.userId] }}});
        if (!commentExist) {
            throw new UnauthorizedException('Unauthorized')
        }
        const imageKeys = commentExist.attachments?.image?.flatMap((ele : string)=>{
            return {Key : ele}
        })
        const videoKeys = commentExist.attachments?.video?.flatMap((ele : string)=>{
            return {Key : ele}
        })     
        const Keys = [
            ...imageKeys || [],
            ...videoKeys || []
        ]   
        const comment = Promise.allSettled([
             this.commentRepository.deleteMany({filter : {$or : [{parentComment : CommentId} , {_id : CommentId}]}}),
             this.s3.deleteAssets({Keys}),
        ])
        if (!comment) {
            throw new NotFoundException("This comment Not exist")
        }
        return "Deleted successfuly"
    }
}
export const commentService = new CommentService()