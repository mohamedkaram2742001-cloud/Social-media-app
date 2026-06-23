import { NextFunction, Request, Response } from "express";
import { BadRequestException, ForbiddenException } from "../common/exception";
import { RoleEnum, TokenTypeEnum } from "../common/enum";
import {tokenService} from '../common/service/index'

export const authentication = (tokenType = TokenTypeEnum.ACCESS) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers?.authorization) {
      throw new BadRequestException("Missing authorization key");
    }
    const { authorization } = req.headers;
    const [flag, credential] = authorization.split(" ") as [string, string];
    const { user, decode } = await tokenService.decodedToken({
      token: credential as string,
      tokenType,
    });
    ((req.user = user), (req.decode = decode));
    next();
  };
};

export const authorization =  (accessRole: RoleEnum[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenException("User not authenticated");
    }
    if (!accessRole.includes(req.user.role)) {
      throw new ForbiddenException("Not allowed account");
    }
    next();
  };
};
