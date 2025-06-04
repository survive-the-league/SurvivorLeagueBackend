import { Router } from "express";
import {
  login,
  register,
  verifyToken,
  refreshToken,
  loginWithGoogle
} from "../../controllers/auth/auth.controller";

const router = Router();

// Login
router.post("/login", login);

// Registro
router.post("/register", register);

// Google Login
router.post("/google", loginWithGoogle);

// Refresh Token
router.get("/refresh", refreshToken);

// TODO: Reset password
//router.post('/reset-password', resetPassword);

export default router;
