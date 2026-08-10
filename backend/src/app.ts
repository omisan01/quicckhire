import express, { Express, Request, Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import authRoutes from "./routes/auth.routes"

const app: Express = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL || "https://localhost:3000",
    credentials: true
}))

app.use("/api/v1/auth", authRoutes)

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: "Quicchire API is healthy"
    })
})

export default app