import { Request, Response } from "express";
import { AuthService } from "../../services/auth/auth.service";
import { RegisterDto } from "../../dto/auth/register.dto";
import { LoginDto } from "../../dto/auth/login.dto";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const [errorMessage, loginDto] = LoginDto.create(req.body);
    if (errorMessage) {
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { email, password } = loginDto!;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      error: "Error en el proceso de login",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const [errorMessage, registerDto] = RegisterDto.create(req.body);
    if (errorMessage) {
      res.status(400).json({ error: errorMessage });
      return;
    }

    const { email, password, username } = registerDto!;
    const user = await AuthService.register(email, password, username);
    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({
      error: "Error en el proceso de registro",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    await AuthService.resetPassword(email);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error al resetear contraseña:", error);
    res.status(500).json({
      error: "Error al resetear la contraseña",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
