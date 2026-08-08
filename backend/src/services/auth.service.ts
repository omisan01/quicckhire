import { db } from "@/config/db";
import { RegisterInput, LoginInput } from "@/utils/auth.schema";
import { hashPassword } from "@/utils/password";

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
}