import cron from "node-cron";
import { ReactRepository, StoryRepository } from "../../DB/Repository";
import { s3Service, S3Service } from "../service";
export class CronJobs {
    private readonly reactRepository : ReactRepository
    private readonly storyRepository : StoryRepository
    private readonly s3 : S3Service
    constructor(){
        this.storyRepository = new StoryRepository()
        this.reactRepository = new ReactRepository()
        this.s3 = s3Service
        cron.schedule('* * * * *', async () => {
            const expiredStories = await this.storyRepository.find({filter: { expiresAt: { $lte: new Date() }}});
            if (!expiredStories.length) return;
            const ids = expiredStories.map(id => id._id)
            const imageKeys = expiredStories.flatMap(story =>story.attachments?.image?.map(img => ({Key: img})) || []);
            const videoKeys = expiredStories.flatMap(story => story.attachments?.video?.map(video => ({ Key: video})) || []);
            const allKeys = [...imageKeys, ...videoKeys];
            await Promise.allSettled([
                this.reactRepository.deleteMany({ filter: { targetId: { $in: ids}}}),
                ...(allKeys.length ? [this.s3.deleteAssets({ Keys: allKeys })] : []),
                this.storyRepository.deleteMany({filter : {_id : {$in : ids}}}),
            ])
        })
    }
}
export const cronJobs = new CronJobs()