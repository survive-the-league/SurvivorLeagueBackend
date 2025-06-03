import { User } from "../../models/types";
import { db, auth } from "../../config/firebase";
import { env } from "../../config/env";

export class AuthService {
  private static readonly initialLives = 3;
  private static readonly FIREBASE_AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

  private static async createUserToken(userId: string): Promise<string> {
    return await auth.createCustomToken(userId);
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: User }> {
    try {
      // Obtener el usuario de Firebase Auth
      const userRecord = await auth.getUserByEmail(email);

      // Verificar las credenciales usando el endpoint de REST
      const response = await fetch(
        `${AuthService.FIREBASE_AUTH_URL}?key=${env.firebase.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        }
      );

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const userDoc = await db.collection("users").doc(userRecord.uid).get();

      if (!userDoc.exists) {
        throw new Error("Usuario no encontrado en la base de datos");
      }

      const userData = userDoc.data() as User;

      const token = await AuthService.createUserToken(userRecord.uid);

      return {
        token,
        user: {
          id: userRecord.uid,
          email: userRecord.email || "",
          lives: userData.lives,
          predictions: userData.predictions || [],
        },
      };
    } catch (error) {
      console.error("Error en login:", error);
      if (error instanceof Error) {
        if (error.message.includes("wrong-password")) {
          throw new Error("Contraseña incorrecta");
        }
        if (error.message.includes("user-not-found")) {
          throw new Error("Usuario no encontrado");
        }
        throw error;
      }
      throw new Error("Error en la autenticación");
    }
  }

  static async register(
    email: string,
    password: string,
    username: string
  ): Promise<{ token: string; user: User }> {
    try {
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: username,
      });

      const newUser: User = {
        id: userRecord.uid,
        email: email,
        lives: AuthService.initialLives,
        predictions: [],
      };

      await db.collection("users").doc(userRecord.uid).set(newUser);

      const token = await AuthService.createUserToken(userRecord.uid);

      return {
        token,
        user: newUser,
      };
    } catch (error) {
      console.error("Error en registro:", error);
      if (error instanceof Error && error.message.includes("already exists")) {
        throw new Error("El email ya está registrado");
      }
      throw new Error("Error en el registro");
    }
  }

  /**
   * Envía un email para resetear la contraseña
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      // TODO: Implementar reset de contraseña con Firebase
      // await auth.generatePasswordResetLink(email);
    } catch (error) {
      throw new Error("Error al resetear la contraseña");
    }
  }

  /**
   * Verifica si un token es válido
   */
  static async verifyToken(token: string): Promise<boolean> {
    try {
      // TODO: Implementar verificación de token con Firebase
      // await auth.verifyIdToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }
}
