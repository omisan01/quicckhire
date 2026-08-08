import dotenv from "dotenv";
dotenv.config()

import app from "./app";
import { db } from "./config/db"
import { connectRedis } from "./config/redis";

const PORT = process.env.PORT || 5000

async function bootsrap() {
    try {
        await connectRedis()

        await db.$connect();
        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`)
        })
    }
    catch (error) {
        console.error('Failed to start server', error)
        process.exit(1)
    }
}

bootsrap()