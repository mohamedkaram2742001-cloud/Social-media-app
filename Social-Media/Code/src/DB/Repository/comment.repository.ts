import { BaseRepository } from "./base.repository";
import {CommentModel} from '../models'
import { IComment } from "../../common/interface/comment.interface";
export class CommentRepository extends BaseRepository<IComment>{
    constructor(){
        super(CommentModel)
    }
}