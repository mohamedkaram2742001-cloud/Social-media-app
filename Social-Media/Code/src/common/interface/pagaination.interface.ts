import { HydratedDocument } from "mongoose"

export interface IPagination<TRawDocument> {
    docs : HydratedDocument<TRawDocument>[]
    currentPage : number | undefined
    totalPages : number | undefined
}