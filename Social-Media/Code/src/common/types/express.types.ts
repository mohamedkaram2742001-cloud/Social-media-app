import { HydratedDocument } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../interface/user.interface';

declare global {
  namespace Express {
    interface Request {
      user: HydratedDocument<IUser>;
      decode: JwtPayload;
    }
  }
}
