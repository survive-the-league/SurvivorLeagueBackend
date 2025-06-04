import { Request, Response } from "express";
import { AuthService } from "../../services/auth/auth.service";
import { RegisterDto, LoginDto, GoogleLoginDto } from "../../dto";

export const login = async (req: Request, res: Response): Promise<void> => {
  const [errorMessage, loginDto] = LoginDto.create(req.body);
  if (errorMessage) {
    res.status(400).json({ ok: false, error: errorMessage });
    return;
  }

  try {
    const { email, password } = loginDto!;
    const result = await AuthService.login(email, password);

    res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      ok: false,
      error: "Error en el proceso de login",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [errorMessage, registerDto] = RegisterDto.create(req.body);
    if (errorMessage) {
      res.status(400).json({ ok: false, error: errorMessage });
      return;
    }

    const { email, password, username } = registerDto!;
    const result = await AuthService.register(email, password, username);
    res.status(201).json({
      ok: true,
      message: "User registered successfully",
      result,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      ok: false,
      error: "Error en el proceso de registro",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const result = await AuthService.verifyToken(token);
    
    if (!result.isValid) {
      res.status(401).json({ ok: false, error: 'Invalid token' });
      return;
    }

    res.status(200).json({ 
      ok: true, 
      message: 'Token is valid',
      user: result.user 
    });
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(500).json({
      ok: false,
      error: "Error verifying token",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ ok: false, error: 'No token provided' });
      return;
    }

    const refreshToken = authHeader.split('Bearer ')[1];
    if (!refreshToken) {
      res.status(400).json({ ok: false, error: 'Refresh token is required' });
      return;
    }

    const result = await AuthService.refreshToken(refreshToken);
    res.status(200).json({ 
      ok: true, 
      message: 'Tokens refreshed successfully',
      result 
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      ok: false,
      error: "Error refreshing token",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const [errorMessage, googleLoginDto] = GoogleLoginDto.create(req.body);
    if (errorMessage) {
      res.status(400).json({ ok: false, error: errorMessage });
      return;
    }

    const { email, displayName, photoURL, uid, idToken } = googleLoginDto!;
    const result = await AuthService.loginWithGoogle(email, displayName, photoURL, uid, idToken);
    res.status(200).json({ ok: true, result });
  } catch (error) {
    console.error("Error in Google login:", error);
    res.status(500).json({
      ok: false,
      error: "Error in Google authentication",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
