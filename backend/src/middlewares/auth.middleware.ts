import { AuthenticatedReq } from "@/types/auth.types";
import { Response } from "express";
import { sendError } from "@/utils/response";
import { NextFunction } from "express";
import { verifyAccessToken } from "@/utils/token";


export const requireAuth = (req: AuthenticatedReq,
    res: Response,
    next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return sendError({ res, message: "Authentication token missing or malformed", statusCode: 401 })
        }

        const token = authHeader.split(" ")[1];
        const decodedPayload = verifyAccessToken(token);
        req.user = decodedPayload;

        next();

    } catch (e) {
        return sendError({ res, message: "Invalid or expired token", statusCode: 401 })
    }
}

export const requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedReq, res: Response, next: NextFunction) => {
        if (!req.user) {
            return sendError({ res, message: "User not authenticated", statusCode: 401 })
        }
        if (!allowedRoles.includes(req.user.role)) {
            return sendError({ res, message: "Forbidden: You do not have permission to access this resource", statusCode: 403 })
        }
        next();
    }
}