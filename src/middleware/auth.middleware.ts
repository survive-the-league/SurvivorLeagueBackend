import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email
      };
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    res.status(500).json({ error: 'Error en la autenticación' });
  }
}; 