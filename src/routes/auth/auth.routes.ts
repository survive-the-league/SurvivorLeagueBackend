import { Router } from 'express';
import { login, register } from '../../controllers/auth/auth.controller';

const router = Router();

// Login
router.post('/login', login);

// Registro
router.post('/register', register);

//TODO: Renew token
//router.post('/renew-token', renewToken);

// TODO: Reset password
//router.post('/reset-password', resetPassword);

export default router; 