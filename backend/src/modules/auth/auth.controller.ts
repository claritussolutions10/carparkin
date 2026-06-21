import { Request, Response } from "express";
import * as authService from "./auth.service";

export async function signup(req: Request, res: Response) {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "Name, email, and password are required" });
    return;
  }

  try {
    const result = await authService.signup(name, email, password, phone);
    res.status(201).json(result);
  } catch (err: any) {
    res
      .status(err.status || 500)
      .json({ error: err.message || "Signup failed" });
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
    res
      .status(err.status || 500)
      .json({ error: err.message || "Login failed" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const user = await authService.getUserById(req.user!.userId);
    res.json({ user });
  } catch (err: any) {
    res
      .status(err.status || 500)
      .json({ error: err.message || "Failed to get user" });
  }
}
