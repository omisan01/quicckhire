import { PrismaClient } from "@prisma/client/extension";

export const db = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});