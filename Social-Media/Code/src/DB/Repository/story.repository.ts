import { BaseRepository } from "./base.repository";
import {StoryModel} from '../models'
import { IStory } from "../../common/interface";
export class StoryRepository extends BaseRepository<IStory>{
    constructor(){
        super(StoryModel)
    }
}