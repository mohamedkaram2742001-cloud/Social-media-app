import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import geoip from "geoip-lite";
import { redisService } from "../common/service";
import { WINDOW } from "../config/config";

import type { Store } from "express-rate-limit";

class RedisStore implements Store {
  public prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  async increment(key: string) {
    const realKey = `${this.prefix}:${key}`;

    const count = await redisService.incr(realKey);

    if (count === 1) {
      await redisService.expire(realKey, WINDOW);
    }

    return {
      totalHits: count,
      resetTime: new Date(Date.now() + WINDOW * 1000),
    };
  }

  async decrement(key: string) {
    await redisService.decr(`${this.prefix}:${key}`);
  }

  async resetKey(key: string) {
    await redisService.deleteKey(`${this.prefix}:${key}`);
  }
}
export const createRedisStore = (prefix: string) => {
  return new RedisStore(prefix);
};
export const globalLimiter = rateLimit({
  windowMs: WINDOW * 1000,
  limit: 100,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req: any) => {
    const ipV6 = ipKeyGenerator(req.headers["x-forwarded-for"], 64) || req.ip;
    return `GLOBAL::LIMIT${ipV6}-${req.path}`
  },

  store: createRedisStore("GLOBAL"),

  handler: (req, res) => {
    return res.status(429).json({
      message: "Too many requests. Slow down.",
    });
  },
});
export const userLimiter = rateLimit({
  windowMs: WINDOW * 1000,

  limit: (req) => {
    const geo = geoip.lookup(req?.ip as string);

    return geo?.country === "EG" ? 60 : 20;
  },

  keyGenerator: (req : any) => {
    const userId = req?.user?._id;

    if (userId) {
      return `USER::LIMIT::${userId}`;
    }
    const ipV6 = ipKeyGenerator(req.headers["x-forwarded-for"], 64) || req.ip;
    return `${ipV6}-${req.path}`
  },
  store: createRedisStore("USER"),

  standardHeaders: true,
  legacyHeaders: false,
});
export const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  keyGenerator: (req : any) => {
    const userId = req?.user?._id;
     const ipV6 = ipKeyGenerator(req.headers["x-forwarded-for"], 64) || req.ip;
    return userId ? `POST::LIMIT::${userId}` : `${ipV6}-${req.path}`
  },
  skipFailedRequests: true,
  store: createRedisStore("POST")
});
export const storyLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  skipFailedRequests: true,
  keyGenerator: (req : any) => {
    const userId = req?.user?._id;
    const ipV6 = ipKeyGenerator(req.headers["x-forwarded-for"], 64) || req.ip;
    return userId ? `STORY::LIMIT::${userId}` : `${ipV6}-${req.path}`;
  },
  store: createRedisStore("STORY")
});
export const commentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  keyGenerator: (req : any) => {
    const userId = req?.user?._id;
    const ipV6 = ipKeyGenerator(req.headers["x-forwarded-for"], 64) || req.ip;
    return userId ? `COMMENT::LIMIT::${userId}` : `${ipV6}-${req.path}`;
  },
  skipFailedRequests: true,
  store: createRedisStore("COMMENT")
});
