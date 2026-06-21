import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../../config/database";
import { AuthPayload, UserRow } from "../../types";

function signToken(user: UserRow): string {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const expiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN || "604800");
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: expiresInSeconds,
  });
}

function sanitizeUser(user: UserRow) {
  const { password, ...rest } = user;
  return rest;
}

export async function signup(
  name: string,
  email: string,
  rawPassword: string,
  phone?: string
) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
    email,
  ]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const hashed = await bcrypt.hash(rawPassword, 12);
  const result = await pool.query<UserRow>(
    "INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) RETURNING *",
    [name, email, hashed, phone || null]
  );

  const user = result.rows[0]!;
  return { token: signToken(user), user: sanitizeUser(user) };
}

export async function login(email: string, rawPassword: string) {
  const result = await pool.query<UserRow>(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  const valid = await bcrypt.compare(rawPassword, user.password);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), {
      status: 401,
    });
  }

  return { token: signToken(user), user: sanitizeUser(user) };
}

export async function getUserById(id: number) {
  const result = await pool.query<UserRow>(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
  const user = result.rows[0];
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return sanitizeUser(user);
}
