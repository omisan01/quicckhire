import { db } from "@/config/db";
import { JwtPayload } from "@/types/auth.types";
import { RegisterInput, LoginInput } from "@/utils/auth.schema";
import { comparePassword, hashPassword } from "@/utils/password";
import { deleteRefreshTokenFromRedis, generateAccessToken, generateRefreshToken, getRefreshTokenFromRedis, storeRefreshTokenInRedis, verifyRefreshToken } from "@/utils/token";

export class AuthService {
    /**
    * Registers a new user and automatically creates their initial Wallet inside a Prisma transaction.
    */
    static async register(input: RegisterInput) {
        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email: input.email }
        });

        if (existingUser) {
            throw new Error('User with this email already exists')
        }

        const hashedPassword = await hashPassword(input.password);

        const result = await db.$transaction(async (tx: any) => {
            const newUser = await tx.user.create({
                data: {
                    name: input.name,
                    email: input.email,
                    role: input.role,
                    password: hashedPassword
                }
            })

            const newWallet = await tx.wallet.create({
                data: {
                    user_id: newUser.id,
                    balance: 5000.0
                }
            })

            await tx.walletTransaction.create({
                data: {
                    wallet_id: newWallet.id,
                    amount: 5000.0,
                    type: "DEPOSIT",
                    description: "Initial virtual ledger signup bonus"
                }
            })

            return { user: newUser, wallet: newWallet }
        })

        const { password, ...userWithoutPassword } = result.user
        return userWithoutPassword
    }

    static async login(input: LoginInput) {
        const user = await db.user.findUnique({
            where: { email: input.email }
        })

        if (!user) {
            throw new Error("Invalid email or password")
        }

        const isPasswordValid = await comparePassword(input.password, user.password)
        if (!isPasswordValid) {
            throw new Error("Invalid email or password")
        }

        if (user.is_banned) {
            throw new Error("Your account has been suspended")
        }

        // Generate JWT Tokens
        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role
        }

        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        await storeRefreshTokenInRedis(user.id, refreshToken);

        const { password, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken
        }
    }

    static async refreshToken(incomingRefreshToken: string) {
        const decoded = verifyRefreshToken(incomingRefreshToken)

        const storedToken = await getRefreshTokenFromRedis(decoded.userId);

        if (!storedToken || storedToken !== incomingRefreshToken) {
            throw new Error("Invalid or expired refresh token")
        }

        const user = await db.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user || user.is_banned) {
            throw new Error('User account is invalid or suspended');
        }

        // Issue new Access Token
        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
        };

        const newAccessToken = generateAccessToken(payload);
        return { accessToken: newAccessToken };
    }

    /**
    * Logs out user by deleting their refresh token from Redis.
    */
    static async logout(userId: string) {
        await deleteRefreshTokenFromRedis(userId)
    }

    static async getMe(userId: string) {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar_url: true,
                bio: true,
                skills: true,
                company_name: true,
                is_verified: true,
                created_at: true,
                wallet: {
                    select: {
                        id: true,
                        balance: true,
                    },
                },
            }
        })

        if (!user) {
            throw new Error("User not found")
        }

        return user
    }

}