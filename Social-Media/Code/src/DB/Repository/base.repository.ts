import { AnyKeys, CreateOptions, DeleteResult, FlattenMaps, HydratedDocument, Model, MongooseBaseQueryOptions, MongooseUpdateQueryOptions, PopulateOptions, ProjectionType, Query, QueryFilter, QueryOptions, QueryWithHelpers, ReturnsNewDoc, Types, UpdateQuery, UpdateWithAggregationPipeline, UpdateWriteOpResult ,  } from "mongoose";
import { AggregateOptions } from "node:sqlite";
import { IPagination } from "../../common/interface";
// import  mongodb  from "mongodb";
export abstract class BaseRepository<TRawDocument> {
    constructor(protected readonly model : Model<TRawDocument> ){}
    async create({data} : {data : AnyKeys<TRawDocument>}) :  Promise<HydratedDocument<TRawDocument>>
    async create({data , options} : {data : AnyKeys<TRawDocument>[] , options? : CreateOptions}) :  Promise<HydratedDocument<TRawDocument>[]>
    async create({data , options} : {data : AnyKeys<TRawDocument>[] | AnyKeys<TRawDocument> , options? : CreateOptions}) :  Promise<HydratedDocument<TRawDocument>[] | HydratedDocument<TRawDocument>>{
       return await this.model.create(data as any  , options) 
    }
    async createOne({data,options}: {data: AnyKeys<TRawDocument>,options?: CreateOptions}): Promise<HydratedDocument<TRawDocument>> {
       const [doc] = await this.model.create(data as any, options) ;
       return doc as HydratedDocument<TRawDocument>
    }   
    async find({filter , projection , options} : {filter? :  QueryFilter<TRawDocument> , projection? : ProjectionType<TRawDocument>  , options? : QueryOptions}) : Promise<HydratedDocument<TRawDocument>[]>{
        return await this.model.find(filter || {} , projection , options)
    }
    async findOne({filter , projection , options}: {filter : QueryFilter<TRawDocument>, projection? : ProjectionType<TRawDocument> | null | undefined , options?: QueryOptions<TRawDocument> & {lean? : false , populate? : PopulateOptions[]}}): Promise<HydratedDocument<TRawDocument> | null>
    async findOne({filter , projection , options}: {filter : QueryFilter<TRawDocument>, projection? : ProjectionType<TRawDocument> | null | undefined, options?: QueryOptions<TRawDocument> & {lean? : true , populate? : PopulateOptions[]}}): Promise<FlattenMaps<TRawDocument> | null> 
    async findOne({filter , projection , options}: {filter : QueryFilter<TRawDocument>, projection? : ProjectionType<TRawDocument> | null | undefined  , options?: QueryOptions<TRawDocument>}): Promise<HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null> {
        const doc = this.model.findOne(filter , projection)
        if (options?.lean) {doc.lean(options.lean)}
        if (options?.populate) {doc.populate(options.populate as PopulateOptions[])}
        return await doc.exec()
    }
    async findById({_id , projection , options}: {_id : Types.ObjectId, projection? : ProjectionType<TRawDocument> | null | undefined , options?: QueryOptions<TRawDocument> & {lean? : false , populate? : PopulateOptions[] | string}}): Promise<HydratedDocument<TRawDocument> | null>
    async findById({_id , projection , options}: {_id : Types.ObjectId, projection? : ProjectionType<TRawDocument> | null | undefined, options?: QueryOptions<TRawDocument> & {lean? : true , populate? : PopulateOptions[] | string}}): Promise<FlattenMaps<TRawDocument> | null> 
    async findById({_id , projection , options}: {_id : Types.ObjectId, projection? : ProjectionType<TRawDocument> | null | undefined  , options?: QueryOptions<TRawDocument>}): Promise<HydratedDocument<TRawDocument> | FlattenMaps<TRawDocument> | null> {
        const doc = this.model.findById(_id , projection)
        if (options?.lean) {doc.lean()}
        if (options?.populate) {doc.populate(options.populate as PopulateOptions[])}
        return await doc.exec()
    }
    async paginate({filter , projection , options = {} , page = undefined , size = 5} : {filter? :  QueryFilter<TRawDocument> , projection? : ProjectionType<TRawDocument>  , options : QueryOptions , page : number | string | undefined , size : number | string | undefined}) : Promise<IPagination<TRawDocument>>{
        let count;
        if (Number(page) > 0) {
            const skip = (Number(page) - 1)*Number(size)
            options.skip = skip
            options.limit = Number(size)
            count = await this.model.countDocuments(filter)
        }
      const docs = await this.model.find(filter || {} , projection , options)
      return {docs , currentPage : page ? Number(page) : undefined , totalPages : page ? Math.ceil(Number(count)/Number(size)) : undefined}
    }
    async updateOne({filter = {} , update , options}:{filter: QueryFilter<HydratedDocument<TRawDocument>> ,update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,options?: (MongooseUpdateQueryOptions<TRawDocument>) | ( MongooseUpdateQueryOptions<TRawDocument>) | null}):Promise<UpdateWriteOpResult>{
        if (Array.isArray(update)) {
            update.push({$set : {__v : {$add : ["$__v",1]}}})
            return await this.model.updateOne(filter , update ,  {...options , updatePipeline : true})
        }
        return await this.model.updateOne(filter , {...update , $inc : {__v : 1}} , options)
    }
    async updateMany({filter = {} , update , options}:{filter: QueryFilter<TRawDocument>,update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,options?: (MongooseUpdateQueryOptions<TRawDocument>) | null}):Promise<UpdateWriteOpResult>{
        return await this.model.updateMany(filter ,  {...update , $inc : {__v : 1}} , options)
    }
    async findOneAndUpdate({filter = {} , update , options = { returnDocument: "after" }}:{filter: QueryFilter<TRawDocument>,update: UpdateQuery<TRawDocument>,options?: QueryOptions<TRawDocument> & ReturnsNewDoc | QueryOptions<TRawDocument>}):Promise<HydratedDocument<TRawDocument> | null>{
        if (Array.isArray(update)) {
            update.push({$set : {__v : {$add : ["$__v",1]}}})
            return await this.model.findOneAndUpdate(filter , update , {...options , updatePipeline : true})
        }
        return await this.model.findOneAndUpdate(filter ,{...update , $inc : {__v : 1}}  , options) 
    }
    async findByIdAndUpdate({_id , update , options = { returnDocument: "after" }}:{_id: Types.ObjectId,update: UpdateQuery<TRawDocument> | UpdateWithAggregationPipeline,options?: (QueryOptions<TRawDocument>) | null}):Promise<HydratedDocument<TRawDocument> | null>{
        if (Array.isArray(update)) {
            update.push({$set : {__v : {$add : ["$__v",1]}}})
            return await this.model.findByIdAndUpdate(_id ,  {update , $inc : {__v : 1}} , {...options , updatePipeline : true}) 
        }
        return await this.model.findByIdAndUpdate(_id ,  {update , $inc : {__v : 1}} , options) 
    }
    async deleteOne({filter = {}}:{filter: QueryFilter<TRawDocument>}):Promise<DeleteResult>{
        return await this.model.deleteOne(filter)
    }
    async deleteMany({filter = {}}:{filter: QueryFilter<TRawDocument>}):Promise<DeleteResult>{
        return await this.model.deleteMany(filter)
    }
    async findOneAndDelete({filter = {} , options}:{filter: QueryFilter<TRawDocument> , options? : QueryOptions<TRawDocument>}):Promise<HydratedDocument<TRawDocument> | null>{
        return await this.model.findOneAndDelete(filter , options ) 
    }
    async findByIdAndDelete({_id , options}:{_id: Types.ObjectId, options? : QueryOptions<TRawDocument>}):Promise<HydratedDocument<TRawDocument> | null>{
        return await this.model.findByIdAndDelete(_id , options) 
    }
    async aggregate(pipeline : any[] , options?: Partial<AggregateOptions> & {allowDeleted : boolean}) {
        const Pipeline = pipeline.length ? pipeline : [{ $match: {} }];
        return this.model.aggregate(Pipeline, options);
    }
    async countDocuments({filter ,options} : {filter?: QueryFilter<TRawDocument>,options?: QueryOptions<TRawDocument>}):Promise<QueryWithHelpers<number,HydratedDocument<TRawDocument>,TRawDocument,'countDocuments'>>
    async countDocuments({filter , options}:{filter?: QueryFilter<TRawDocument>,options?: QueryOptions<TRawDocument>}):Promise<QueryWithHelpers<number,HydratedDocument<TRawDocument>,TRawDocument,'countDocuments'>>
    async countDocuments({filter = {} , options} : {filter? : QueryFilter<TRawDocument> | undefined, options?: QueryOptions<TRawDocument>}):Promise<number | QueryWithHelpers<number,HydratedDocument<TRawDocument>,TRawDocument,'countDocuments'> >{
        return await this.model.countDocuments(filter as any , options as any) 
    }
}