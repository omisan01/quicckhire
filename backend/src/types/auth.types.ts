import { Role } from "@/generated/prisma/enums";

export interface JwtPayload {
    userId: string;
    email: string;
    role: Role
}

export interface AuthenticatedReq extends Request {
    user?: JwtPayload
}