// import { Queue, Worker } from "bullmq";
// import Redis from "ioredis";
// import { S3Service } from "./s3.service";
// import { StorageApproachEnum } from "../enum";
// import { PostRepository } from "../../DB/Repository/post.repository";
// import { REDIS_URI } from "../../config/config";

// export class BullmqService {
//   private QueueName: string;
//   private redisConnection: Redis;

//   public queue: Queue;
//   private worker: Worker;

//   private s3: S3Service;
//   private postRepository: PostRepository;

//   constructor(queueName = "upload-attachments") {
//     this.QueueName = queueName;

//     this.redisConnection = new Redis(REDIS_URI, {
//       maxRetriesPerRequest: null,
//       enableAutoPipelining: true,
//     });

//     this.s3 = new S3Service();
//     this.postRepository = new PostRepository();

//     this.queue = new Queue(this.QueueName, {
//       connection: this.redisConnection,
//     });

//     this.worker = new Worker(
//       this.QueueName,
//       async (job) => {
//         const { postId, userId, files } = job.data;

//         const image: (string | number | undefined)[] = [];
//         const video: (string | number | undefined)[] = [];

//         const urls = await this.s3.uploadAssets({
//           files,
//           path: `Posts/${userId}/${Date.now()}`,
//           storageApproach: StorageApproachEnum.DISK,
//         });

//         files.forEach((file: Express.Multer.File, index: number) => {
//           const url = urls[index];
//           if (file.mimetype.startsWith("image")) {
//             image.push(url);
//           } else if (file.mimetype.startsWith("video")) {
//             video.push(url);
//           }
//         });

//         await this.postRepository.findByIdAndUpdate({
//           _id: postId,
//           update: { attachments: { image, video } },
//         });
//       },
//       {
//         connection: this.redisConnection,
//         concurrency: 5,
//       },
//     );
//   }
// }
// export const bullmqService = new BullmqService();
