export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    ESCROW_LOCK = 'ESCROW_LOCK',
    ESCROW_RELEASE = 'ESCROW_RELEASE',
    ESCROW_REFUND = 'ESCROW_REFUND',
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

export interface WalletBalanceResponse {
    id: string;
    balance: number;
    userId: string;
    createdAt: Date;
    updatedAt: Date
}

export interface WalletTransactionItem {
    id: string;
    walletId: string;
    amount: number;
    type: TransactionType;
    description: string | null;
    referenceId: string | null;
    createdAt: Date
}

export interface PaginatedTransactionsResult {
    transactions: WalletTransactionItem[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface DepositInput {
    amount: number;
    description?: string;
}

export interface WithdrawInput {
    amount: number;
    description?: string;
}

export interface TransactionQueryFilters {
    page?: number;
    limit?: number;
    type?: TransactionType;
    status?: TransactionStatus;
}