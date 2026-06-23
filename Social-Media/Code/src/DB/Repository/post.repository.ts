import { BaseRepository } from "./base.repository";
import {PostModel} from '../models'
import { IPost } from "../../common/interface/post.interface";
export class PostRepository extends BaseRepository<IPost>{
    constructor(){
        super(PostModel)
    }
}