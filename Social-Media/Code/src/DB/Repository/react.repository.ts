import { BaseRepository } from "./base.repository";
import {ReactModel} from '../models'
import { IReact } from "../../common/interface/react.interface";
export class ReactRepository extends BaseRepository<IReact>{
    constructor(){
        super(ReactModel)
    }
}