// MODULES //
import { Request, Response } from "express";

// SERVICES //
import { AuthService } from "@/services/auth.service";

// UTILS //
import { LoginSchema, RegisterSchema } from "@/utils/auth.schema";
import { sendError, sendSuccess } from "@/utils/response";
import { AuthenticatedReq } from "@/types/auth.types";

const COOKIE_OPTION = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

export class AuthController {

    /** Register User */
    static async register(req: Request, res: Response) {
        try {
            const validatedData = RegisterSchema.parse(req.body);
            const user = await AuthService.register(validatedData);

            return sendSuccess({
                res,
                statusCode: 201,
                message: 'User registered successfully with initial wallet balance',
                data: user,
            })
        } catch (e) {
            return sendError({ res, message: "Registration failed", statusCode: 400 })
        }
    }

    /** Login User */
    static async login(req: Request, res: Response) {
        try {
            const validatedData = LoginSchema.parse(req.body);
            const { user, accessToken, refreshToken } = await AuthService.login(validatedData)

            res.cookie("refreshToken", refreshToken, COOKIE_OPTION)
            return sendSuccess({
                res,
                statusCode: 201,
                message: 'User logged in successfully',
                data: {
                    user,
                    accessToken
                }
            })
        } catch (e) {
            return sendError({ res, message: "Authentication failed", statusCode: 401 })
        }
    }

    /** Refresh Access Token */
    static async refreshToken(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) {
                return sendError({ res, message: "Refresh token not found", statusCode: 401 })
            }

            const { accessToken } = await AuthService.refreshToken(refreshToken)
            return sendSuccess({
                res,
                statusCode: 200,
                message: 'Access token refreshed successfully',
                data: { accessToken }
            })
        } catch (e) {
            return sendError({ res, message: "Token refresh failed", statusCode: 401 })
        }
    }

    /** Logout User */
    static async logout(req: AuthenticatedReq, res: Response) {
        try {
            const userId = req.user?.userId;
            if (userId) {
                await AuthService.logout(userId)
            }

            res.clearCookie("refreshToken", COOKIE_OPTION)
            return sendSuccess({
                res,
                statusCode: 200,
                message: 'User logged out successfully',
            })
        } catch (e) {
            return sendError({ res, message: "Logout failed", statusCode: 500 })
        }
    }

    /** Get Current User */
    static async getMe(req: AuthenticatedReq, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                return sendError({ res, message: "User not authenticated", statusCode: 401 })
            }

            const user = await AuthService.getMe(userId)
            return sendSuccess({
                res,
                statusCode: 200,
                message: 'User retrieved successfully',
                data: user
            })
        } catch (e) {
            return sendError({ res, message: "Failed to retrieve user", statusCode: 500 })
        }
    }
}