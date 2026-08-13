import jwt from "jsonwebtoken";
import { redis } from "@/config/redis";
import { JwtPayload } from "@/types/auth.types";
import { v4 as uuidv4 } from 'uuid';

export interface RefreshTokenPayload extends JwtPayload {
    tokenId: string;
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60

/** Generate short lived Access Token */
export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

/** Generate long lived Refresh Token */
export const generateRefreshToken = (payload: JwtPayload): { token: string; tokenId: string } => {
    const tokenId = uuidv4();
    const token = jwt.sign({ ...payload, tokenId }, REFRESH_SECRET, { expiresIn: '7d' })
    return { token, tokenId }
}

/** Verify an Access Token */
export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload
}

/** Verify a Refresh Token */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
    return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload
}

/**
 * Stores a user's Refresh Token in Redis mapped to their userId.
 * Key format: "refresh_token:<userId>:<tokenId>"
 */
export const storeRefreshTokenInRedis = async (userId: string, refreshToken: string, tokenId: string): Promise<void> => {
    const key = `refresh_token:${userId}:${tokenId}`
    await redis.set(key, refreshToken, {
        expiration: { type: "EX", value: REFRESH_TOKEN_TTL }
    })
}

/**
 * Validates a user's Refresh Token by checking if it exists in Redis.
 * Returns the token if valid, or null if invalid.
 */
export const validateRefreshTokenInRedis = async (userId: string, tokenId: string): Promise<boolean> => {
    const key = `refresh_token:${userId}:${tokenId}`
    const exists = await redis.exists(key)

    return exists !== null
}

/**
 * Removes a user's Refresh Token from Redis (used during Logout / Token Revocation).
 */
export const deleteRefreshTokenFromRedis = async (userId: string, tokenId: string): Promise<void> => {
    const key = `refresh_token:${userId}:${tokenId}`;
    await redis.del(key)
}

/**
 * Security measure: Deletes all refresh tokens for a user from Redis (used during Logout / Token Revocation) token reuse/theft is detected..

 */
export const deleteAllRefreshTokensForUser = async (userId: string): Promise<void> => {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
        await redis.del(keys);
    }
}