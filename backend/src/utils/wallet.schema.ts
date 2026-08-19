import { z } from "zod";
import { TransactionStatus, TransactionType } from "@/types/wallet.types";

const amountValidator = z.number({
    error: "Amount is required",
}).positive("Amount must be greater than 0")
    .min(100, "Minimum transaction is ₹100")
    .max(100000, "Maximum transaction is ₹1,00,000")
    .refine((val) => {
        const decimalPart = val.toString().split('.')[1];
        return !decimalPart || decimalPart.length <= 2
    }, { message: 'Amount cannot have more than 2 decimal places' })


export const DepositSchema = z.object({
    amount: amountValidator,
    description: z.string().max(255, 'Description cannot exceed 255 characters').optional(),
})

export const WithdrawSchema = z.object({
    amount: amountValidator,
    description: z.string().max(255, 'Description cannot exceed 255 characters').optional(),
});

export const TransactionQuerySchema = z.object({
    page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val > 0, { message: 'Page must be greater than 0' }),
    limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => val > 0 && val <= 50, { message: 'Limit must be between 1 and 50' }),
    type: z.enum(TransactionType).optional(),
});

export type DepositDTO = z.infer<typeof DepositSchema>;
export type WithdrawDTO = z.infer<typeof WithdrawSchema>;
export type TransactionQueryDTO = z.infer<typeof TransactionQuerySchema>;