import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../../config/database";
import { generateAdminId, generateOwnerId, generateUserId } from "../../utils/ulid";
import { sendEmail } from "../../utils/email";
import { AuthPayload, UserRole, UserRow } from "../../types";

const RESET_TOKEN_TTL_MINUTES = 30;
const VERIFY_TOKEN_TTL_MINUTES = 60 * 24;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signToken(user: UserRow): string {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  const expiresInSeconds = parseInt(process.env.JWT_EXPIRES_IN || "604800");
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: expiresInSeconds });
}

function sanitizeUser(user: UserRow) {
  const { password_hash, ...rest } = user;
  return rest;
}

function generateIdForRole(role: UserRole): string {
  switch (role) {
    case 'admin': return generateAdminId();
    case 'owner': return generateOwnerId();
    case 'user': return generateUserId();
  }
}

async function sendVerificationEmail(user: UserRow) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_TTL_MINUTES * 60 * 1000);

  await pool.query("UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [user.id]);
  await pool.query(
    "INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [user.id, hashToken(rawToken), expiresAt]
  );

  const verifyLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Verify your Carparkin.in email address",
    text: `Welcome to Carparkin! Please verify your email address: ${verifyLink}\n\nThis link expires in 24 hours.`,
    html: `<p>Welcome to Carparkin! Please verify your email address:</p><p><a href="${verifyLink}">${verifyLink}</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function signup(
  fullName: string,
  email: string,
  rawPassword: string,
  phoneNumber: string,
  role: UserRole = 'user'
) {
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const id = generateIdForRole(role);
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  const result = await pool.query<UserRow>(
    `INSERT INTO users (id, email, password_hash, full_name, phone_number, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, email, passwordHash, fullName, phoneNumber, role]
  );

  const user = result.rows[0]!;

  try {
    await sendVerificationEmail(user);
  } catch {
    // Account creation should never fail just because the verification
    // email couldn't be sent - the user can request another one later.
  }

  return { token: signToken(user), user: sanitizeUser(user) };
}

export async function verifyEmail(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const result = await pool.query(
    `SELECT * FROM email_verification_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  const record = result.rows[0];
  if (!record) {
    throw Object.assign(new Error("This verification link is invalid or has expired"), { status: 400 });
  }

  await pool.query("UPDATE users SET is_email_verified = true, updated_at = NOW() WHERE id = $1", [record.user_id]);
  await pool.query("UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1", [record.id]);
}

export async function resendVerificationEmail(userId: string) {
  const result = await pool.query<UserRow>("SELECT * FROM users WHERE id = $1", [userId]);
  const user = result.rows[0];
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });
  if (user.is_email_verified) {
    throw Object.assign(new Error("Email is already verified"), { status: 400 });
  }
  await sendVerificationEmail(user);
}

export async function login(email: string, rawPassword: string) {
  const result = await pool.query<UserRow>(
    "SELECT * FROM users WHERE email = $1 AND is_active = true",
    [email]
  );
  const user = result.rows[0];
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const valid = await bcrypt.compare(rawPassword, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  return { token: signToken(user), user: sanitizeUser(user) };
}

export async function requestPasswordReset(email: string) {
  const result = await pool.query<UserRow>("SELECT * FROM users WHERE email = $1 AND is_active = true", [email]);
  const user = result.rows[0];
  // Always behave the same whether or not the account exists - the caller
  // (controller) returns an identical generic response either way, so this
  // function silently no-ops for unknown emails rather than throwing.
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [user.id]);
  await pool.query(
    "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES (gen_random_uuid()::text, $1, $2, $3)",
    [user.id, hashToken(rawToken), expiresAt]
  );

  const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Carparkin.in password",
    text: `We received a request to reset your password. This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes: ${resetLink}\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your password. This link expires in ${RESET_TOKEN_TTL_MINUTES} minutes:</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);
  const result = await pool.query(
    `SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
    [tokenHash]
  );
  const record = result.rows[0];
  if (!record) {
    throw Object.assign(new Error("This reset link is invalid or has expired"), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, record.user_id]);
  await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [record.id]);
}

export async function getUserById(id: string) {
  const result = await pool.query<UserRow>(
    "SELECT * FROM users WHERE id = $1 AND is_active = true",
    [id]
  );
  const user = result.rows[0];
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return sanitizeUser(user);
}
