// MODULES //
import { Router } from "express";

// CONTROLLERS //
import { AuthController } from "@/controllers/auth.controller";

// OTHERS //
import { requireAuth } from "@/middlewares/auth.middleware";
import { rateLimiter } from "@/middlewares/ratelimiter.middleware";

const router = Router();

const authLimiter = rateLimiter({
    windowInSeconds: 15 * 60, // 15 minutes
    maxRequests: 5,           // 5 attempts per window
    keyPrefix: 'auth_strict',
});

router.post("/register", authLimiter, AuthController.register)
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected Routes
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);

export default router