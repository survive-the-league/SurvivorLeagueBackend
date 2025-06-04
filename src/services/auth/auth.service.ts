import { User, UserWithoutPassword } from "../../interfaces";
import { db, auth } from "../../config/firebase";
import { JwtService } from "./jwt.service";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../config/env";

export class AuthService {
  private static readonly initialLives = 3;

  static async login(
    email: string,
    password: string
  ): Promise<{
    token: string;
    user: UserWithoutPassword;
  }> {
    try {
      const userRecord = await auth.getUserByEmail(email);

      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${env.firebase.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            returnSecureToken: true,
            returnIdpCredential: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Credenciales inválidas");
      }

      const userDoc = await db.collection("users").doc(userRecord.uid).get();

      if (!userDoc.exists) {
        throw new Error("Usuario no encontrado en la base de datos");
      }

      const userData = userDoc.data() as User;
      const token = JwtService.generateToken(userData);

      const { password: _, ...userWithoutPassword } = userData;

      return {
        token,
        user: userWithoutPassword,
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
  ): Promise<{
    token: string;
    user: UserWithoutPassword;
  }> {
    try {
      const userDoc = await db
        .collection("users")
        .where("email", "==", email)
        .get();

      if (!userDoc.empty) {
        throw new Error("El email ya está registrado");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = db.collection("users").doc().id;

      const newUser: User = {
        id: userId,
        email: email,
        displayName: username,
        password: hashedPassword,
        lives: AuthService.initialLives,
        predictions: [],
      };

      console.log("Guardando usuario con password hasheado:", {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        hasPassword: !!newUser.password,
        passwordLength: newUser.password.length,
        lives: newUser.lives,
      });

      await db.collection("users").doc(userId).set(newUser);

      const token = JwtService.generateToken(newUser);

      const { password: _, ...userWithoutPassword } = newUser;

      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error("Error en registro:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error en el registro");
    }
  }

  static async verifyToken(
    token: string
  ): Promise<{ isValid: boolean; user?: UserWithoutPassword }> {
    try {
      const decodedToken = JwtService.verifyToken(token);
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();

      if (!userDoc.exists) {
        return { isValid: false };
      }

      const userData = userDoc.data() as User;
      const { password: _, ...userWithoutPassword } = userData;

      return {
        isValid: true,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error("Error verifying token:", error);
      return { isValid: false };
    }
  }

  static async refreshToken(
    refreshToken: string
  ): Promise<{ token: string; user: UserWithoutPassword }> {
    try {
      const decodedToken = JwtService.verifyToken(refreshToken);
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();

      if (!userDoc.exists) {
        throw new Error("Usuario no encontrado");
      }

      const userData = userDoc.data() as User;
      const { password: _, ...userWithoutPassword } = userData;
      const newToken = JwtService.generateToken(userData);

      return {
        token: newToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new Error("Token de actualización inválido");
    }
  }

  static async loginWithGoogle(
    email: string,
    displayName: string,
    photoURL: string | null,
    uid: string,
    googleToken: string
  ): Promise<{
    token: string;
    user: UserWithoutPassword;
  }> {
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${env.firebase.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postBody: `id_token=${googleToken}&providerId=google.com`,
            requestUri: "http://localhost",
            returnSecureToken: true,
            returnIdpCredential: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message: string };
        };
        console.error("Firebase auth error:", errorData);
        throw new Error(
          `Error al autenticar con Google: ${
            errorData.error?.message || "Error desconocido"
          }`
        );
      }

      const userDoc = await db.collection("users").doc(uid).get();
      let userData: User;

      if (!userDoc.exists) {
        userData = {
          id: uid,
          email: email,
          displayName: displayName,
          photoURL: photoURL,
          lives: AuthService.initialLives,
          predictions: [],
          password: "", // Usuarios de Google no tienen password
        };

        await db.collection("users").doc(uid).set(userData);
      } else {
        userData = userDoc.data() as User;
      }

      const token = JwtService.generateToken(userData);

      const { password: _, ...userWithoutPassword } = userData;

      return {
        token,
        user: userWithoutPassword,
      };
    } catch (error) {
      console.error("Error in Google login:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Error en la autenticación con Google");
    }
  }
}
