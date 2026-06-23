import { Types } from "mongoose"

export const TransformToObjectId = (id : string) : Types.ObjectId=>{
    return new Types.ObjectId(id)
}