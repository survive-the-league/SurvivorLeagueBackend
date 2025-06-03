import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import userRoutes from './users/user.routes';
//import matchRoutes from './matches/';
//import predictionRoutes from './predictions/prediction.routes';

const router = Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de usuarios
router.use('/users', userRoutes);

// Rutas de partidos
//router.use('/matches', matchRoutes);

// Rutas de predicciones
//router.use('/predictions', predictionRoutes);

export default router; 