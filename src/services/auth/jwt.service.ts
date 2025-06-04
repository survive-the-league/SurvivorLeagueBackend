import jwt, { SignOptions } from "jsonwebtoken";
import { JWT_CONFIG } from "../../config/jwt";
import { User } from "../../interfaces";

export class JwtService {
  static generateToken(user: User): string {
    const payload = {
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    const options: SignOptions = {
      expiresIn: JWT_CONFIG.expiresIn as unknown as number,
    };

    return jwt.sign(payload, JWT_CONFIG.secret, options);
  }

  static generateRefreshToken(user: User): string {
    const payload = {
      uid: user.id,
      email: user.email,
      displayName: user.displayName,
    };

    const options: SignOptions = {
      expiresIn: JWT_CONFIG.refreshExpiresIn,
    };

    return jwt.sign(payload, JWT_CONFIG.secret, options);
  }

  static verifyToken(token: string): {
    uid: string;
    email?: string;
    displayName?: string;
  } {
    try {
      const decoded = jwt.verify(token, JWT_CONFIG.secret) as {
        uid: string;
        email?: string;
        displayName?: string;
      };
      return decoded;
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  static decodeToken(
    token: string
  ): { uid: string; email?: string; displayName?: string } | null {
    try {
      return jwt.decode(token) as {
        uid: string;
        email?: string;
        displayName?: string;
      };
    } catch (error) {
      return null;
    }
  }
}
