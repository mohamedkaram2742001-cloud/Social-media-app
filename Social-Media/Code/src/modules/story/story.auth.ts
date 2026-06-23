import { RoleEnum } from "../../common/enum";

export const endPoint = {
  GeneralAuth: [RoleEnum.SUPERVISER ,  RoleEnum.ADMIN, RoleEnum.USER],
  SensiveAuth : [RoleEnum.SUPERVISER , RoleEnum.ADMIN]
};
