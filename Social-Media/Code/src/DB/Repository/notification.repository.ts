import { BaseRepository } from "./base.repository";
import {NotificationModel} from '../models'
import { INotification } from "../../common/interface/notification.interface";
export class NotificationRepository extends BaseRepository<INotification>{
    constructor(){
        super(NotificationModel)
    }
}