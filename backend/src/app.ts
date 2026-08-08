import express, { Express, Request, Response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app: Express = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(cors({
    origin: process.env.CLIENT_URL || "https://localhost:3000",
    credentials: true
}))

app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: 'OK',
        message: "Quicchire API is healthy"
    })
})

export default app