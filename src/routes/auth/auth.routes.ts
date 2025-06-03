import { Router } from "express";
import {
  login,
  register,
  loginWithGoogle,
  logout,
  verifyToken,
} from "../../controllers/auth/auth.controller";

const router = Router();

// Login
router.post("/login", login);

// Registro
router.post("/register", register);

// Google Login
router.post("/google", loginWithGoogle);

router.post("/logout", logout);

// Verify Token
router.get("/verify", verifyToken);

// TODO: Reset password
//router.post('/reset-password', resetPassword);

export default router;
