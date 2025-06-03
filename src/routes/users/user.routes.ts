import { Router } from 'express';
import { UserController } from '../../controllers/users/user.controller';

const router = Router();
const userController = new UserController();

// Obtener perfil del usuario actual
router.get('/profile', userController.getProfile);

// Actualizar perfil del usuario
router.put('/profile', userController.updateProfile);

// Obtener predicciones del usuario
router.get('/predictions', userController.getUserPredictions);

// Obtener estadísticas del usuario
router.get('/stats', userController.getUserStats);

export default router; 