import { Request, Response } from 'express';
import { UserService } from '../../services/users/user.service';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ message: 'No autorizado' });
        return;
      }

      const profile = await this.userService.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ message: 'Error al obtener perfil' });
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ message: 'No autorizado' });
        return;
      }

      const updatedProfile = await this.userService.updateUserProfile(userId, req.body);
      res.json(updatedProfile);
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ message: 'Error al actualizar perfil' });
    }
  };

  getUserPredictions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ message: 'No autorizado' });
        return;
      }

      const predictions = await this.userService.getUserPredictions(userId);
      res.json(predictions);
    } catch (error) {
      console.error('Error al obtener predicciones:', error);
      res.status(500).json({ message: 'Error al obtener predicciones' });
    }
  };

  getUserStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        res.status(401).json({ message: 'No autorizado' });
        return;
      }

      const stats = await this.userService.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
  };
} 