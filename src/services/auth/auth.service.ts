import { User } from "../../interfaces";
import { db, auth } from "../../config/firebase";
import { env } from "../../config/env";

export class AuthService {
  private static readonly initialLives = 3;
  private static readonly FIREBASE_AUTH_URL =
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";
  private static readonly FIREBASE_CUSTOM_TOKEN_URL =
    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken";

  private static async createUserToken(userId: string): Promise<string> {
    return await auth.createCustomToken(userId);
  }

  private static async exchangeCustomTokenForIdToken(customToken: string): Promise<string> {
    const response = await fetch(
      `${AuthService.FIREBASE_CUSTOM_TOKEN_URL}?key=${env.firebase.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Error al intercambiar el custom token");
    }

    const data = (await response.json()) as { idToken: string };
    return data.idToken;
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: User }> {
    try {
      const userRecord = await auth.getUserByEmail(email);

      const response = await fetch(
        `${AuthService.FIREBASE_AUTH_URL}?key=${env.firebase.apiKey}`,
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

      const customToken = await AuthService.createUserToken(userRecord.uid);
      const idToken = await AuthService.exchangeCustomTokenForIdToken(customToken);

      return {
        token: idToken,
        user: {
          id: userRecord.uid,
          email: userRecord.email || "",
          displayName: userRecord.displayName || "",
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

      const customToken = await AuthService.createUserToken(userRecord.uid);
      const idToken = await AuthService.exchangeCustomTokenForIdToken(customToken);

      return {
        token: idToken,
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

  static async logout(token: string): Promise<void> {
    try {
      const decodedToken = await auth.verifyIdToken(token);

      await auth.revokeRefreshTokens(decodedToken.uid);
    } catch (error) {
      console.error("Error en logout:", error);
      throw new Error("Error al cerrar sesión");
    }
  }

  static async resetPassword(email: string): Promise<void> {
    try {
      await auth.generatePasswordResetLink(email);
    } catch (error) {
      throw new Error("Error al resetear la contraseña");
    }
  }

  static async verifyToken(
    token: string
  ): Promise<{ isValid: boolean; user?: User }> {
    try {
      let idToken = token;
      
      // Try to exchange the token if it's a custom token
      try {
        const response = await fetch(
          `${AuthService.FIREBASE_CUSTOM_TOKEN_URL}?key=${env.firebase.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: token,
              returnSecureToken: true,
            }),
          }
        );

        if (response.ok) {
          const data = (await response.json()) as { idToken: string };
          idToken = data.idToken;
        }
      } catch (error) {
        // If the exchange fails, assume it's not a custom token and continue with the original token
        console.log("Token is not a custom token, proceeding with original token");
      }

      const decodedToken = await auth.verifyIdToken(idToken);

      const userDoc = await db.collection("users").doc(decodedToken.uid).get();

      if (!userDoc.exists) {
        return { isValid: false };
      }

      const userData = userDoc.data() as User;

      return {
        isValid: true,
        user: {
          id: decodedToken.uid,
          email: decodedToken.email || "",
          displayName: decodedToken.name || "",
          lives: userData.lives,
          predictions: userData.predictions || [],
          photoURL: userData.photoURL,
        },
      };
    } catch (error) {
      console.error("Error verifying token:", error);
      return { isValid: false };
    }
  }

  static async loginWithGoogle(
    email: string,
    displayName: string,
    photoURL: string | null,
    uid: string,
    googleToken: string
  ): Promise<{ token: string; user: User }> {
    try {
      // First, exchange the Google ID token for a Firebase ID token
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

      const authData = (await response.json()) as { idToken: string };
      const firebaseToken = authData.idToken;

      // Create a custom token for the user
      const customToken = await AuthService.createUserToken(uid);
      
      // Exchange the custom token for a Firebase ID token
      const idToken = await AuthService.exchangeCustomTokenForIdToken(customToken);

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
        };

        await db.collection("users").doc(uid).set(userData);
      } else {
        userData = userDoc.data() as User;
      }

      return {
        token: idToken,
        user: userData,
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
