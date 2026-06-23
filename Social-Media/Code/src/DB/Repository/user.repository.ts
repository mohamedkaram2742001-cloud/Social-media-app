import { BaseRepository } from './base.repository';
import { UserModel } from '../models';
import { IUser } from '../../common/interface/user.interface';
export class UserRepository extends BaseRepository<IUser>{
    constructor(){
        super(UserModel)
    }
}