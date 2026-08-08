import { createClient } from "redis";

export const redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
})

redis.on('error', (err) => console.error('Redis Client Error', err));
redis.on('connect', () => console.log('Redis Client Connected'));

export const connectRedis = async () => {
    if (!redis.isOpen) {
        await redis.connect()
    }
}