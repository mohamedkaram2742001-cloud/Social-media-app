import { RedisTypeEnum, RedisActionsEnum } from "./../enum/redis.enum";
import { createClient, RedisClientType } from "redis";
import { REDIS_URI } from "../../config/config";
import { Types } from "mongoose";
type RedisKeyParams = {
  type?: string;
  key?: string;
  action?: (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum] | undefined;
  blockAction?:
    | (typeof RedisActionsEnum)[keyof typeof RedisActionsEnum]
    | undefined;
};

type SetParams<T = any> = {
  key: string;
  value: T;
  ttl?: number;
  parse?: boolean;
};

type GetParams = {
  key: string;
  parse?: boolean;
};

export class RedisService {
  private client: RedisClientType;
  constructor() {
    this.client = createClient({
      url: REDIS_URI,
    });
    this.handleEvents()
  }
  private handleEvents(){
    this.client.on('connect',()=>{console.log(`Redis connected Successfuly ❤️🌞`)})
    this.client.on('error',(error)=>{console.log(`Fail to Connect Redis ❌ ${error}`)})
  }

  async connect(){
    await this.client.connect()
  }
    //======================== Set ==========================
  async set<T>({
    key,
    value,
    ttl,
    parse = false,
  }: SetParams<T>): Promise<string | null> {
    const Value = parse ? JSON.stringify(value) : (value as any);

    if (ttl) {
      return await this.client.set(key, Value, { EX: ttl });
    }

    return await this.client.set(key, Value);
  }

  //======================== Get ==========================
  async get<T = any>({
    key,
    parse = false,
  }: GetParams): Promise<T | string | null> {
    const data = await this.client.get(key);

    if (!data) return null;

    return parse ? (JSON.parse(data) as T) : data;
  }

  //======================== Delete =======================
  async deleteKey(key: string | string[]): Promise<number> {
    if (!key) return 0;
    return await this.client.del(key);
  }

  //======================== Exists =======================
  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  //======================== Expire =======================
  async expire(key: string, ttl: number): Promise<number> {
    return await this.client.expire(key, ttl);
  }

  //======================== TTL ==========================
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  //======================== Incr =========================
  async incr(key: string): Promise<number> {
    return await this.client.incr(key);
  }
  //======================== Decr =========================
  async decr(key: string): Promise<number> {
    return await this.client.decr(key);
  }

  //======================== mGet =========================
  async mGet(keys: string[]): Promise<(string | null)[]> {
    if (!keys.length) return [];
    return await this.client.mGet(keys);
  }

  //======================== Keys =========================
  async keys(prefix: string): Promise<string[]> {
    return await this.client.keys(`${prefix}*`);
  }
  //======================== SADD =========================
  async sadd(key: string, value: string): Promise<number> {
    return await this.client.sAdd(key, value);
  }

  //======================== SISMEMBER ====================
  async sismember(key: string, value: string): Promise<boolean> {
    const result = await this.client.sIsMember(key, value);
    return result === 1;
  }
  //======================== SISMEMBER ====================
  async smembers(key: string): Promise<string[]> {
    const result = await this.client.sMembers(key);
    return result
  }

  //======================== Login out ======================
  RevokeTokenKey(userId: string | Types.ObjectId): string {
    return `revoke:${userId}`;
  }

  RevokeAllTokenKey(userId: string | Types.ObjectId): string {
    return `revoke_all:${userId}`;
  }
//======================== attampet Formate ====================

  baseRedis({
    type = RedisTypeEnum.CONFIRMEMAIL,
    key = RedisActionsEnum.REQUEST, 
    action,
    blockAction,
  }: RedisKeyParams): string {
    return blockAction
      ? `${type}::${key}::${blockAction}`
      : action
        ? `${type}::${key}::${action}`
        : `${type}::${key}`;
  }

  baseProfileRedis(key: string): string {
    return `profile::view::${key}`;
  }

  RedisKey(params: RedisKeyParams = {}): string {
    return this.baseRedis(params);
  }

  RedisMaxRequestKey(params: RedisKeyParams = {}): string {
    return this.baseRedis(params);
  }

  RedisBlockKey(params: RedisKeyParams = {}): string {
    return this.baseRedis(params);
  }
  
  //===================== Notification ====================
  FCM_Key(userId : Types.ObjectId | string){
    return  `user:FCM:${userId}`;
  }
  
  async addFCM(userId : Types.ObjectId | string, FCMToken : string) {
    return await this.client.sAdd(this.FCM_Key(userId), FCMToken);
  }

  async  removeFCM(userId : Types.ObjectId | string, FCMToken : string) {
    return await this.client.sRem(this.FCM_Key(userId), FCMToken);
  }

  async  getFCMs(userId : Types.ObjectId | string) {
    return await this.client.sMembers(this.FCM_Key(userId));
  }

  async  hasFCMs(userId : Types.ObjectId | string) {
    return await this.client.sCard(this.FCM_Key(userId));
  }

  async  removeFCMUser(userId : Types.ObjectId | string) {
    return await this.client.del(this.FCM_Key(userId));
  }
  async getFCMsMulti(users: (Types.ObjectId | string)[]) {
  const multi = this.client.multi();
  for (const id of users) {
    multi.sMembers(this.FCM_Key(id))
  }
  const results = await multi.exec();
  return results.flat().filter(Boolean);
  }
  //===================== Story ====================
  Story_Key(storyId : Types.ObjectId | string){
    return  `story:viewes:${storyId}`;
  }
  
  async addViewer(storyId : Types.ObjectId | string, viewerId : string , viewedAt : number) {
    return await this.client.zAdd(this.Story_Key(storyId), {score : viewedAt , value : viewerId });
  }

  async  removeViewer(storyId : Types.ObjectId | string, viewerId : string) {
    return await this.client.zRem(this.Story_Key(storyId), viewerId);
  }

  async  getViewers(storyId : Types.ObjectId | string) {
    return await this.client.zRange(this.Story_Key(storyId) , 0 , -1 , {REV : true }); // for sorting oldest to newlest
  }
  async  getViewersWithDate(storyId : Types.ObjectId | string) {
    return await this.client.zRangeWithScores(this.Story_Key(storyId) , 0 , -1 ); // for sorting oldest to newlest
  }
  async isViewed( storyId: Types.ObjectId | string, viewerId: string){
   const result = await this.client.zScore(this.Story_Key(storyId),viewerId);
   return result !== null;
  }
  async  viewerCount(storyId : Types.ObjectId | string) {
    return await this.client.zCard(this.Story_Key(storyId));
  }

  async  removeStoryUser(storyId : Types.ObjectId | string) {
    return await this.client.del(this.Story_Key(storyId));
  }

}

export const redisService = new RedisService()