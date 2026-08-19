import { db } from "@/config/db";
import { DepositInput, PaginatedTransactionsResult, TransactionQueryFilters, TransactionType, WalletBalanceResponse } from "@/types/wallet.types";

interface LockedWalletRow {
    id: string;
    user_id: string;
    balance: string; // Postgres Decimal returns as string in raw queries
    currency: string;
    created_at: Date;
    updated_at: Date;
}

export class WalletService {
    /** Retrieves the wallet by user id */
    static async getWalletByUserId(userId: string): Promise<WalletBalanceResponse> {
        const wallet = await db.wallet.findUnique({
            where: { user_id: userId }
        })

        if (!wallet) {
            throw new Error("Wallet not found for this user");
        }

        return {
            id: wallet.id,
            userId: wallet.user_id,
            balance: Number(wallet.balance),
            createdAt: wallet.created_at,
            updatedAt: wallet.updated_at,

        }
    }

    private static async lockWalletRow(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0], userId: string): Promise<LockedWalletRow> {
        const rows = await tx.$queryRaw<LockedWalletRow[]>`
        SELECT * FROM "Wallet"
        WHERE user_id = ${userId}
        FOR UPDATE
        `;
        if (!rows || rows.length === 0) {
            throw new Error("Wallet not found or cannot be locked")
        }

        return rows[0]
    }

    /** Deposit virtual funds into user's wallet atomically */
    static async depositFunds(userId: string, input: DepositInput) {
        return await db.$transaction(async (tx) => {
            // Lock wallet row
            const lockedWallet = await this.lockWalletRow(tx, userId)
            const currentBalance = Number(lockedWallet.balance);
            const newBalance = currentBalance + input.amount;

            // Update wallet balance
            const updatedWallet = await tx.wallet.update({
                where: { id: lockedWallet.id },
                data: { balance: newBalance }
            })

            const transaction = await tx.walletTransaction.create({
                data: {
                    wallet_id: updatedWallet.id,
                    amount: input.amount,
                    type: TransactionType.DEPOSIT,
                    description: input.description || 'Virtual wallet deposit'
                }
            })

            return {
                wallet: {
                    id: updatedWallet.id,
                    userId: updatedWallet.user_id,
                    balance: Number(updatedWallet.balance),
                },
                transaction: {
                    id: transaction.id,
                    amount: Number(transaction.amount),
                    type: transaction.type,
                    description: transaction.description,
                    createdAt: transaction.created_at,
                },
            }
        })
    }

    /** Escrow lock : Freezes client funds for a contract */
    static async lockEscrowFunds(tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
        clientUserId: string,
        amount: number,
        contractId: string) {
        const lockedWallet = await this.lockWalletRow(tx, clientUserId);
        const currentBalance = Number(lockedWallet.balance)

        if (currentBalance < amount) {
            throw new Error('Client has insufficient balance to fund contract escrow');
        }

        const newBalance = currentBalance - amount;

        await tx.wallet.update({
            where: { id: lockedWallet.id },
            data: { balance: newBalance }
        })

        return await tx.walletTransaction.create({
            data: {
                wallet_id: lockedWallet.id,
                amount: amount,
                description: `Escrow hold for contract ${contractId}`,
                type: TransactionType.ESCROW_LOCK,
                reference_id: contractId
            }
        })
    }

    /** Escrow release */
    static async releaseEscrowFunds(
        tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
        freelancerUserId: string,
        amount: number,
        contractId: string
    ) {
        const lockedWallet = await this.lockWalletRow(tx, freelancerUserId);
        const currentBalance = lockedWallet.balance;
        const newBalance = currentBalance + amount;

        await tx.wallet.update({
            where: { id: lockedWallet.id },
            data: {
                balance: newBalance
            }
        })

        return await tx.walletTransaction.create({
            data: {
                wallet_id: lockedWallet.id,
                amount: amount,
                type: TransactionType.ESCROW_RELEASE,
                description: `Escrow payout released for contract ${contractId}`,
                reference_id: contractId,
            }
        })
    }

    /** Escrow Refund: Returns locked funds to client if contract is cancelled/refunded. */
    static async refundEscrowFunds(
        tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
        clientUserId: string,
        amount: number,
        contractId: string
    ) {
        const lockedWallet = await this.lockWalletRow(tx, clientUserId);
        const currentBalance = Number(lockedWallet.balance);
        const newBalance = currentBalance + amount;

        await tx.wallet.update({
            where: { id: lockedWallet.id },
            data: { balance: newBalance },
        });

        return await tx.walletTransaction.create({
            data: {
                wallet_id: lockedWallet.id,
                amount: amount,
                type: TransactionType.ESCROW_REFUND,
                description: `Escrow refund returned for contract ${contractId}`,
                reference_id: contractId,
            },
        });
    }

    /** Get paginated transaction history for a user's wallet */
    static async getTransactionHistory(userId: string, filters: TransactionQueryFilters): Promise<PaginatedTransactionsResult> {
        const wallet = await db.wallet.findUnique({
            where: { user_id: userId }
        })

        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const skip = (page - 1) * limit;

        const whereClause: any = { wallet_id: wallet.id }

        if (filters.type) whereClause.type = filters.type;

        const [total, transactions] = await Promise.all([
            db.walletTransaction.count({ where: whereClause }),
            db.walletTransaction.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            })
        ])

        const totalPages = Math.ceil(total / limit)

        return {
            transactions: transactions.map((tx) => ({
                id: tx.id,
                walletId: tx.wallet_id,
                amount: Number(tx.amount),
                type: tx.type as TransactionType,
                description: tx.description,
                referenceId: tx.reference_id,
                createdAt: tx.created_at,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }
    }

}