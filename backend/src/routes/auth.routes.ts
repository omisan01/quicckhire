// MODULES //
import { Router } from "express";

// CONTROLLERS //
import { AuthController } from "@/controllers/auth.controller";

// OTHERS //
import { requireAuth } from "@/middlewares/auth.middleware";

const router = Router();

router.post("/register", AuthController.register)
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);

// Protected Routes
router.post('/logout', requireAuth, AuthController.logout);
router.get('/me', requireAuth, AuthController.getMe);

export default router