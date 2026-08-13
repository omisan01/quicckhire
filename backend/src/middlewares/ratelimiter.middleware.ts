import { redis } from "@/config/redis";
import { sendError } from "@/utils/response";
import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
    windowInSeconds: number;
    maxRequests: number;
    keyPrefix: string
}

export const rateLimiter = (options: RateLimitOptions) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const clientIp = req.ip || req.socket.remoteAddress || 'unknown_ip';
            const key = `rate_limit:${options.keyPrefix}:${clientIp}`

            const currentCount = await redis.incr(key)
            if (currentCount === 1) {
                await redis.expire(key, options.windowInSeconds)
            }

            if (currentCount > options.maxRequests) {
                const ttl = await redis.ttl(key)
                return sendError({
                    res, statusCode: 429, message: `Too many attempts. Please try again in ${Math.ceil(ttl / 60)} minutes.`
                })
            }

            next();
        } catch (e) {
            console.error('Rate Limiter Redis Error:', e);
            next();
        }
    }
}