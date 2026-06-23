import { ParsedQs } from 'qs';
import { HydratedDocument, Types } from 'mongoose';
import {  NotificationService, notificationService, redisService, RedisService } from '../../common/service';
import { StoryRepository, UserRepository , ReactRepository, NotificationRepository } from '../../DB/Repository';
import { NotFoundException } from '../../common/exception';
import { IUser, IStory, IReact} from '../../common/interface';
import { TransformToObjectId } from '../../common/utils/ObjectId';
import { deleteStoryParamsDTO, updateStoryParamsDTO } from './story.dto';
import { getAvalibilaty } from '../../common/utils/post';
import { notificationModelEnum } from '../../common/enum';
class StoryService {
    private readonly userRepository : UserRepository
    private readonly storyRepository : StoryRepository
    private readonly reactRepository : ReactRepository
    private readonly notification: NotificationService;
    private readonly NotificationRepository: NotificationRepository;
    private readonly redis: RedisService;
    constructor(){
        this.userRepository = new UserRepository()
        this.storyRepository = new StoryRepository()
        this.reactRepository = new ReactRepository()
        this.NotificationRepository = new NotificationRepository()
        this.notification = notificationService;
        this.redis = redisService;
    }
    // Create Story
    async createStory(user : HydratedDocument<IUser> , data : HydratedDocument<IStory> ) : Promise<IStory>{
        const { mentions , tags} = data
        const mentionedUsers  = await this.userRepository.find({filter : {_id : {$in : mentions as Types.ObjectId[] }}})
        if (mentions?.length && mentionedUsers.length !== mentions.length) {
            throw new NotFoundException("Some mentioned users are invalid");
        }       
        const taggedUsers = await this.userRepository.find({filter : {_id : {$in : tags as Types.ObjectId[]}}})       
        if (tags?.length && taggedUsers.length !== tags.length) {
            throw new NotFoundException("Some tagged users are invalid");
        }
        const story = await this.storyRepository.create({data : {...data , userId : user._id}})
        const tokens = await this.redis.getFCMs(user._id)
        if (tokens) {
            await this.notification.sendNotifications({tokens , data : {title : "Your story has been successfully published" , body : "✅"}})
        }
        if (user.friends?.length) {
            const friendsTokens = await this.redis.getFCMsMulti(user.friends)
            if (friendsTokens.length) {
                await this.notification.sendNotifications({tokens : friendsTokens as unknown as string[], data : {title : `${user.userName} published a new story` , body : "✅"}})
                await this.NotificationRepository.create({data : {senderId : user.id , recipientId : {$in : user.friends} , title : `${user.userName} publish a new story` , body : "✅" , referenceModel : notificationModelEnum.STORY , referenceId : story._id }})
            }
        }
        return story
    }
    //update Story
    async updateStory(user : HydratedDocument<IUser> , data : HydratedDocument<IStory> , {storyId} : updateStoryParamsDTO ) : Promise<HydratedDocument<IStory>>{
        const { mentions} = data
        const story = await this.storyRepository.findOne({filter : {_id : TransformToObjectId(storyId) , userId : user._id , expiresAt: { $gt: new Date() }}})
        if (!story) {
            throw new NotFoundException("Can't found this story")
        }
        const mentionedUsers  = await this.userRepository.find({filter : {_id : {$in : mentions as Types.ObjectId[] }}})
        if (mentions?.length && mentionedUsers.length !== mentions.length) {
            throw new NotFoundException("Some mentioned users are invalid");
        }       
        const updatestory = await this.storyRepository.findOneAndUpdate({
            filter: { _id: TransformToObjectId(storyId), userId: user._id , expiresAt: { $gt: new Date() } },
            update: {
                $set: {
                    availability: data.availability ?? story?.availability,
                    mentions: (data.mentions || []).map(id => TransformToObjectId(id as unknown as string)) ?? story.mentions,
                }
            }
        });
        if (!updatestory) {
            throw new NotFoundException("Fail to update this story")
        }
        return updatestory
    }
    // get ALL Story
    async getStories(user : HydratedDocument<IUser>):Promise<HydratedDocument<IStory>[]>{
        const stories = await this.storyRepository.find({filter : {$or : getAvalibilaty(user) , expiresAt: { $gt: new Date() }}, options : {sort : {createdAt : -1} , populate : [{path : "userId" , select : "firstName lastName profileImage"}]}})
        if (!stories.length) {
            throw new NotFoundException("There no't any stories")
        }
        const storiesWithMeta = await Promise.all(
            stories.map(async (story:any) => {
                const viewsCount = await this.redis.viewerCount(story._id);
                const isViewed = await this.redis.isViewed( story._id,user._id.toString());
                const reacts  = await this.reactRepository.find({filter : {targetId : story._id} , options : {populate : [{path : "userId" , select : "firstName lastName profileImage"}]} , projection : "updatedAt createdAt type userId"})
                const stories = user._id.toString() === story?.userId.toString() ? { ...story.toObject(), viewsCount, isViewed , reacts , reactsCounts : reacts?.length} : { ...story.toObject(), isViewed}
                return stories
            })
        );
        return  storiesWithMeta
    }
    // get post
    async getStory(user : HydratedDocument<IUser> , {storyId} : deleteStoryParamsDTO , {type} : ParsedQs ) : Promise<{story : HydratedDocument<IStory> , viewers : {viewerId : string , viewedAt : string}[] | null , viewsCount : number | null , reacts : HydratedDocument<IReact>[] | null , reactsCount :  number | null}>{
        const story = await this.storyRepository.findOne({filter : { _id : TransformToObjectId(storyId), $or : getAvalibilaty(user) , expiresAt: { $gt: new Date() }} , options : {populate : [{path : "userId" , select : "firstName lastName profileImage"}]}})
        if (!story) {
            throw new NotFoundException("This story not Exist")
        }
        if (user._id.toString() !== story?.userId._id.toString()) {
            await this.redis.addViewer(story._id , user?._id.toHexString() , Date.now())
            return {story , viewers : null , reacts : null , viewsCount : null , reactsCount : null}
        }
        let filter : any ={
            targetId : story?._id
        }
        if (type) {
            filter.type = type
        }
        const viewers = await this.redis.getViewersWithDate(story._id)        
        const viewsCount = await this.redis.viewerCount(story._id)
        const reacts = await this.reactRepository.find({filter , options : {populate : [{path : "userId" , select : "firstName lastName profileImage"}]} , projection : "updatedAt createdAt type userId"})
        return {
            story , 
            viewers : viewers.map((v : any)=>{
                return { viewerId : v.value , viewedAt : new Date(v.score).toLocaleTimeString()}}) ,
            viewsCount,
            reacts,
            reactsCount : reacts.length
        }
    }
    // delete post
    async deleteStory(user : HydratedDocument<IUser> , {storyId} : deleteStoryParamsDTO ) : Promise<string>{
        const story = await this.storyRepository.findOneAndDelete({filter : {userId : user._id , _id : TransformToObjectId(storyId) , expiresAt: { $gt: new Date() }}})
        if (!story) {
            throw new NotFoundException("This story not Exist")
        }
        return `Story deleted successfuly`
    }

}
export const storyService = new StoryService()