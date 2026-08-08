import jwt from "jsonwebtoken";
import { redis } from "@/config/redis";
import { JwtPayload } from "@/types/auth.types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh';

const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60

/** Generate short lived Access Token */
export const generateAccessToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

/** Generate long lived Refresh Token */
export const generateRefreshToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

/** Verify an Access Token */
export const verifyAccessToken = (token: string): JwtPayload => {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload
}

/** Verify a Refresh Token */
export const verifyRefreshToken = (token: string): JwtPayload => {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload
}

/**
 * Stores a user's Refresh Token in Redis mapped to their userId.
 * Key format: "refresh_token:<userId>"
 */
export const storeRefreshTokenInRedis = async (userId: string, refreshToken: string): Promise<void> => {
    const key = `refresh_token:${userId}`
    await redis.set(key, refreshToken, {
        expiration: { type: "EX", value: REFRESH_TOKEN_TTL }
    })
}

/**
 * Retrieves the stored Refresh Token from Redis for a given user.
 */
export const getRefreshTokenFromRedis = async (userId: string): Promise<string | null> => {
    const key = `refresh_token:${userId}`;
    return await redis.get(key)
}

/**
 * Removes a user's Refresh Token from Redis (used during Logout / Token Revocation).
 */
export const deleteRefreshTokenFromRedis = async (userId: string): Promise<void> => {
    const key = `refresh_token:${userId}`;
    await redis.del(key)
}