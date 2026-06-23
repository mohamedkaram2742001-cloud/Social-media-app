import { HydratedDocument, model, models, MongooseBaseQueryOptions, QueryFilter, Schema, Types } from "mongoose";
import { availabilityEnum } from "../../common/enum";
import { IPost } from "../../common/interface/post.interface";
import { BadRequestException, NotFoundException } from "../../common/exception";

const PostScehma = new Schema<IPost>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: function () {
        !this.attachments;
      },
    },
    attachments: {
      _id : false,
      image: [String],
      video: [String],
    },
    tags: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    mentions: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    availability: {
      type: Number,
      enum: availabilityEnum,
      default: availabilityEnum.PUBLIC,
    },
    deletedAt: {
      type: Date,
    },
    restoredAt: {
      type: Date,
    },
    freezedAt: {
      type: Date,
    },
    unfreezedAt: {
      type: Date,
    },
  },
  {
    strict: true,
    strictQuery: true,
    timestamps: true,
  },
);
  PostScehma.pre("validate" , function(){
    if (!this.content && (!this.attachments || (!this.attachments.image?.length && !this.attachments.video?.length))) {
      throw new BadRequestException("Content is Required")
    }
  })
  PostScehma.pre(["find" , "findOne" , "countDocuments"] , function(){
    const query = this.getQuery()
    if (query.paranoid === false) {
      this.setQuery({...query})
    }else{
      this.setQuery({...query , deletedAt : {$exists : false}})
    }
  })
  PostScehma.pre(["updateOne" , "findOneAndUpdate"] , async function(){
    const update = this.getUpdate() as HydratedDocument<IPost>
    const query = this.getQuery()
    type updateManyFn = (
        filter : QueryFilter<IPost>,
        options?: MongooseBaseQueryOptions<IPost>
      )=> ReturnType<typeof PostModel.updateMany >
      const updateManyPosts = PostModel.updateMany.bind(PostModel) as updateManyFn 
    if (update.deletedAt) {
      this.setUpdate({...update , $unset : {restoredAt : 1}})
      await updateManyPosts({ userId : query._id },{ $set: { deletedAt: new Date(Date.now()) } })
    }
    if (update.restoredAt) {
      this.setQuery({...this.getQuery() , deletedAt : {$exists : true}})
      this.setUpdate({...update , $unset : {deletedAt : 1}})
      await updateManyPosts({ userId : query._id },{ $set: { restoredAt: new Date(Date.now()) } })
    }
    if (update.freezedAt) {
      this.setUpdate({...update, $unset : {unfreezedAt : 1}})
    }
    if (update.unfreezedAt) {
      this.setQuery({...this.getQuery() , freezedAt : {$exists : true}})
      this.setUpdate({...update , $unset : {freezedAt : 1}})
    }
    if (query.paranoid === false) {
      this.setQuery({...query})
    }else{
      this.setQuery({...query , deletedAt : {$exists : false}})
    }
  })
  PostScehma.pre(["deleteOne" , "findOneAndDelete"] , async function(){
    const query = this.getQuery()
    const post = await this.model.findOne(query);
    if (!post) {
      throw new NotFoundException("Post not found");
    };
    const force = query?.force;
    if (!post.deletedAt && !force) {
      throw new BadRequestException(
        "Post is not soft deleted. Use force delete to permanently remove it."
      );
    }
      this.setQuery({...query})
      type deleteManyFn = (
        filter : QueryFilter<IPost>,
        options?: MongooseBaseQueryOptions<IPost>
      )=> ReturnType<typeof PostModel.deleteMany >
      const deleteManyPosts = PostModel.deleteMany.bind(PostModel) as deleteManyFn 
      await deleteManyPosts({userId : query._id})
  })
export const PostModel = models.Post || model<IPost>("Post", PostScehma);
PostModel.syncIndexes()
