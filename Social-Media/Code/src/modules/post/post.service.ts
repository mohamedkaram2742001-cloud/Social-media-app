import { ParsedQs } from 'qs';
import { HydratedDocument, Types } from 'mongoose';
import { NotificationService, notificationService, redisService, RedisService, S3Service } from '../../common/service';
import { PostRepository } from './../../DB/Repository/post.repository';
import { CommentRepository, NotificationRepository, ReactRepository, UserRepository } from '../../DB/Repository';
import { BadRequestException, NotFoundException, UnauthorizedException } from '../../common/exception';
import { IUser } from '../../common/interface/user.interface';
import { IPost } from '../../common/interface/post.interface';
import { TransformToObjectId } from '../../common/utils/ObjectId';
import { deletePostParamsDTO, updatePostParamsDTO } from './post.dto';
import { getAvalibilaty } from '../../common/utils/post';
import { notificationModelEnum } from '../../common/enum';
class PostService {
    private readonly postRepository : PostRepository
    private readonly userRepository : UserRepository
    private readonly reactRepository : ReactRepository
    private readonly commentRepository : CommentRepository
    private readonly notification: NotificationService;
    private readonly NotificationRepository: NotificationRepository;
    private readonly redis: RedisService;
    private s3 : S3Service
    constructor(){
        this.userRepository = new UserRepository()
        this.postRepository = new PostRepository()
        this.reactRepository = new ReactRepository() 
        this.commentRepository = new CommentRepository()
        this.NotificationRepository = new NotificationRepository()
        this.s3 = new S3Service()
        this.notification = notificationService;
        this.redis = redisService;
    }

    //useing CloudFront
    // async createPost(user : HydratedDocument<IUser> , data : HydratedDocument<IPost> & {token? : string} ) : Promise<IPost>{
    //     let image = data?.attachments?.image || []
    //     let video = data?.attachments?.video || []
    //     if (image) {
    //         image = [...image].map(ele=> `${AWS_CLOUDFRONT_LINK}/${ele}` )
    //     }
    //     if (video) {
    //         video = [...video].map(ele=> `${AWS_CLOUDFRONT_LINK}/${ele}` )
    //     }
    //     const { mentions , tags} = data
    //     const mentionedUsers  = await this.UserRepository.find({filter : {_id : {$in : mentions as Types.ObjectId[] }}})
    //     if (mentions?.length && mentionedUsers.length !== mentions.length) {
    //         throw new NotFoundException("Some mentioned users are invalid");
    //     }       
    //     const taggedUsers = await this.UserRepository.find({filter : {_id : {$in : tags as Types.ObjectId[]}}})       
    //     if (tags?.length && taggedUsers.length !== tags.length) {
    //         throw new NotFoundException("Some tagged users are invalid");
    //     }
    //     const post = await this.PostRepository.create({data : {...data , userId : user._id , attachments : {image , video}}})
    //     await notificationService.sendNotification({token : data.token as string , data : {title : "Done" , body : "Publish your post successful"}})
    //     return post
    // }
    // First-Step
    async createPresignedLink({ContentType , OriginalName} : {ContentType : string , OriginalName : string}) : Promise<{url : string , Key : string}>{
        if (!ContentType && !OriginalName) {
          throw new BadRequestException("Bad Request check from your Data")
        }
        const {url , Key} =  await this.s3.createPreSignedUploadLink({ContentType , OriginalName , path :`posts` })
        return {url , Key} 
    } 
    // Create Post
    async createPost(user : HydratedDocument<IUser> , data : HydratedDocument<IPost> ) : Promise<IPost>{
        const { mentions , tags} = data
        const mentionedUsers  = await this.userRepository.find({filter : {_id : {$in : mentions as Types.ObjectId[] }}})
        if (mentions?.length && mentionedUsers.length !== mentions.length) {
            throw new NotFoundException("Some mentioned users are invalid");
        }       
        const taggedUsers = await this.userRepository.find({filter : {_id : {$in : tags as Types.ObjectId[]}}})       
        if (tags?.length && taggedUsers.length !== tags.length) {
            throw new NotFoundException("Some tagged users are invalid");
        }
        const post = await this.postRepository.create({data : {...data , userId : user._id}})
        const tokens = await this.redis.getFCMs(user._id)
        if (tokens) {
            await this.notification.sendNotifications({tokens , data : {title : "Your post has been successfully published" , body : "✅"}})
        }
        if (user.friends?.length) {
            const friendsTokens = await this.redis.getFCMsMulti(user.friends)
            if (friendsTokens.length) {
                await this.notification.sendNotifications({tokens : friendsTokens as unknown as string[] , data : {title : `${user.userName} published a new post` , body : "✅"}})
                await this.NotificationRepository.create({data : user?.friends.map(friendId => ({ senderId: user._id, recipientId: friendId, title: `${user.userName} published a new post`,body: "✅",referenceModel: notificationModelEnum.POST,referenceId: post._id}))})
            }
        }
        return post
    }
    //update post
    async updatePost(user : HydratedDocument<IUser> , data : HydratedDocument<IPost> , {postId} : updatePostParamsDTO ) : Promise<any>{
        const { mentions , tags} = data
        const post = await this.postRepository.findOne({filter : {_id : TransformToObjectId(postId) , userId : user._id}})
        if (!post) {
            throw new NotFoundException("Can't found this post")
        }
        if (!data.content && !post.content && !data.attachments?.image?.length && !data.attachments?.video?.length && !post.attachments?.image?.length && !post.attachments?.video?.length) {
            throw new BadRequestException("We can't leave empty post")
        }
        const mentionedUsers  = await this.userRepository.find({filter : {_id : {$in : mentions as Types.ObjectId[] }}})
        if (mentions?.length && mentionedUsers.length !== mentions.length) {
            throw new NotFoundException("Some mentioned users are invalid");
        }       
        const taggedUsers = await this.userRepository.find({filter : {_id : {$in : tags as Types.ObjectId[]}}})       
        if (tags?.length && taggedUsers.length !== tags.length) {
            throw new NotFoundException("Some tagged users are invalid");
        }
        const updatePost = await this.postRepository.findOneAndUpdate({
            filter: { _id: TransformToObjectId(postId), userId: user._id },
            update: {
                $set: {
                    content: data.content ?? post?.content,
                    availability: data.availability ?? post?.availability,
                    tags: (data.tags || []).map(id => TransformToObjectId(id as  unknown as string)) ?? post.tags,
                    mentions: (data.mentions || []).map(id => TransformToObjectId(id as unknown as string)) ?? post.mentions,
                    attachments: {
                    image: data.attachments?.image || post?.attachments?.image,
                    video: data.attachments?.video || post?.attachments?.video
                    }
                }
            }
        });
        if (!updatePost) {
            throw new NotFoundException("Fail to update this post")
        }
        const oldImages = post.attachments?.image || [];
        const newImages = data.attachments?.image || oldImages;
        const removedImages = (oldImages as string[]).filter((img : string) => !newImages.includes(img));
        if (removedImages.length) {
            this.s3.deleteAssets({ Keys: removedImages.map((key : string)  => ({ Key: key }))})
        }
        const oldVideo = post.attachments?.video
        const newVideo = data.attachments?.video
        const removedVideo = (oldVideo as string[]).filter(vid => !newVideo?.includes(vid))
        if (removedVideo.length) {
            await this.s3.deleteAssets({Keys : removedVideo.map((Key : string)=>({Key}))})
        }
        return updatePost
    }
    // get ALL Post
    async getPosts(user : HydratedDocument<IUser> , query : ParsedQs){
        const limit = Number(query.limit) || 5
        const cursor = query.cursor
        let filter : any = {
            deletedAt: { $exists: false },
            $or : getAvalibilaty(user)
        }
        if (cursor) {
            filter._id = {$lt : TransformToObjectId(cursor as string)}
        }
        const posts = await this.postRepository.aggregate([
            {
                $match : filter
            },
            {
                $sort : {_id : -1}
            },
            {
                $limit : limit
            },
            {
                $lookup: {
                    from: "comments",
                    let: { postId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$postId", "$$postId"] }
                            }
                        },
                        {$count: "count" }
                        ],
                    as: "comments"
                }
            },
            {
                $addFields: {
                    commentsCount: { $ifNull: [{ $arrayElemAt: ["$comments.count", 0] }, 0] }
                }
            },
//             {
//   $lookup: {
//     from: "comments",
//     let: { postId: "$_id" },
//     pipeline: [
//       {
//         $match: {
//           $expr: { $eq: ["$postId", "$$postId"] }
//         }
//       },
//       { $sort: { createdAt: -1 } }, // أحدث كومنت (غيّرها لو عايز أقدم)
//       { $limit: 1 },
//       {
//         $project: {
//           _id: 1,
//           content: 1,
//           userId: 1,
//           createdAt: 1
//         }
//       }
//     ],
//     as: "topComment"
//   }
// },
// {
//   $addFields: {
//     topComment: { $arrayElemAt: ["$topComment", 0] }
//   }
// },
            {
                $lookup : {
                    from : "reacts",
                    let : {postId : "$_id"},
                    pipeline : [
                        {
                            $match : {
                                $expr : {
                                    $and : [
                                        {$eq : ["$targetId" , "$$postId"]},
                                        {$eq : ["$targetType" , "Post"]},
                                    ]
                                }
                            }
                        },
                    {$count: "count" },
                    ],
                    as : "reacts"
                }
            },
            {
                $addFields: {
                    reactsCount: { $ifNull: [{ $arrayElemAt: ["$reacts.count", 0] }, 0] }
                }
            },
            {
                $project : {
                    comments : 0,
                    reacts : 0
                }
            }
        ])
        const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;
        return { posts, nextCursor, hasMore: posts.length === limit}
    }
    // get post
    async getPost(user : HydratedDocument<IUser> , {postId} : deletePostParamsDTO ) : Promise<IPost>{
        const post = await this.postRepository.findOne({filter : {userId : user._id , _id : TransformToObjectId(postId) , 
            deletedAt: { $exists: false },
            $or : getAvalibilaty(user)
        }})
        if (!post) {
            throw new NotFoundException("This post not Exist")
        }
        return post
    }
    // delete post
    async deletePost(user : HydratedDocument<IUser> , {postId} : deletePostParamsDTO ) : Promise<string>{
        const postExist = await this.postRepository.findOne({ filter : {_id: TransformToObjectId(postId) , userId: user._id } , projection : "attachments"});
        if (!postExist) {
            throw new UnauthorizedException('Unauthorized')
        }
        const comments = await this.commentRepository.find({ filter: { postId: TransformToObjectId(postId) },projection: " attachments" });
         const imageKeys = Array.isArray(postExist.attachments?.image) 
            ? postExist.attachments.image.map((ele: string) => ({ Key: ele}))
            : postExist.attachments?.image
            ? [{ Key: postExist.attachments.image }]
            : [];
        const videoKeys = Array.isArray(postExist.attachments?.video) 
            ? postExist.attachments.video.map((ele: string) => ({ Key: ele}))
            : postExist.attachments?.video
            ? [{ Key: postExist.attachments.video }]
            : [];
        const commentImageKeys = comments.flatMap(comment => Array.isArray(comment.attachments?.image)
            ? comment.attachments.image.map((img: string) => ({ Key: img }))
            : []
            );
        const commentVideoKeys = comments.flatMap(comment => Array.isArray(comment.attachments?.video)
            ? comment.attachments.video.map((vid: string) => ({ Key: vid }))
            : []
        );
        const Keys = [
            ...imageKeys,
            ...videoKeys,
            ...commentImageKeys,
            ...commentVideoKeys
        ]
        const post = Promise.allSettled([
             this.postRepository.deleteOne({filter : {_id : TransformToObjectId(postId) , userId : user?._id , force : true}}),
             this.commentRepository.deleteMany({filter : {postId : TransformToObjectId(postId)}}),
             this.reactRepository.deleteMany({filter : {targetId : TransformToObjectId(postId)}}),
             ...(Keys.length ? [this.s3.deleteAssets({Keys})] : []),
        ])
        if (!post) {
            throw new NotFoundException("This post not Exist")
        }
        return `Post deleted successfuly`
    }

}
export const postService = new PostService()