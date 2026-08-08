import { email, z } from "zod";

export const RoleEnum = z.enum(["CLIENT", "FREELANCER", "ADMIN"]);

export const RegisterSchema = z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters")
        .max(50, "Name cannot exceed 50 characters")
        .trim(),
    email: z.email({
        error: "Email is required"
    })
        .toLowerCase()
        .trim(),
    password: z.string({ error: "Password is required" })
        .min(6, "Password must be atleast 6 characters")
        .max(50, "Password is too long"),
    role: RoleEnum.default("CLIENT")
})

export const LoginSchema = z.object({
    email: z.email({
        error: "Email is required"
    })
        .toLowerCase()
        .trim(),
    password: z.string({ error: "Password cannot be empty" })
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>