import { Request, Response } from "express";
import * as authService from "./auth.service";
import { UserRole } from "../../types";

export async function signup(req: Request, res: Response) {
  const { full_name, email, password, phone_number, role } = req.body;

  if (!full_name || !email || !password || !phone_number) {
    res.status(400).json({ error: "full_name, email, password, and phone_number are required" });
    return;
  }

  const allowedRoles: UserRole[] = ['user', 'owner'];
  const userRole: UserRole = allowedRoles.includes(role) ? role : 'user';

  try {
    const result = await authService.signup(full_name, email, password, phone_number, userRole);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Signup failed" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Login failed" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  try {
    await authService.requestPasswordReset(email);
  } catch {
    // Fall through to the generic response below regardless - never reveal
    // whether the lookup or email-send failed vs. the account not existing.
  }
  res.json({ message: "If an account exists for that email, we've sent a password reset link." });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: "token and newPassword are required" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    await authService.resetPassword(token, newPassword);
    res.json({ message: "Password updated. You can now log in with your new password." });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed to reset password" });
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  try {
    await authService.verifyEmail(token);
    res.json({ message: "Email verified." });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed to verify email" });
  }
}

export async function resendVerification(req: Request, res: Response) {
  try {
    await authService.resendVerificationEmail(req.user!.userId);
    res.json({ message: "Verification email sent." });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed to resend verification email" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = await authService.getUserById(req.user!.userId);
    res.json({ user });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed to get user" });
  }
}
