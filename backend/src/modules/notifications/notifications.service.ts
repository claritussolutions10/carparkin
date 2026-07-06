import pool from "../../config/database";

export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "new_booking"
  | "support_replied"
  | "new_support_ticket"
  | "listing_approved"
  | "listing_rejected"
  | "listing_suspended"
  | "listing_reactivated"
  | "new_pending_listing"
  | "payout_paid"
  | "review_replied"
  | "kyc_bank_submitted"
  | "kyc_reviewed"
  | "bank_reviewed";

// Internal helper other modules call at their real mutation points - never
// exposed as its own endpoint since notifications are always a side effect
// of something else happening, not a thing created directly by an API caller.
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  link?: string
) {
  await pool.query(
    `INSERT INTO notifications (id, user_id, type, title, message, link)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)`,
    [userId, type, title, message ?? null, link ?? null]
  );
}

export async function notifyAdmins(type: NotificationType, title: string, message?: string, link?: string) {
  const admins = await pool.query("SELECT id FROM users WHERE role = 'admin' AND is_active = true");
  await Promise.all(admins.rows.map((a) => createNotification(a.id, type, title, message, link)));
}

export async function getNotifications(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    pool.query("SELECT COUNT(*) FROM notifications WHERE user_id = $1", [userId]),
  ]);
  return { notifications: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function getUnreadCount(userId: string) {
  const result = await pool.query(
    "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false",
    [userId]
  );
  return parseInt(result.rows[0].count);
}

export async function markRead(id: string, userId: string) {
  const result = await pool.query(
    "UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, userId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Notification not found"), { status: 404 });
}

export async function markAllRead(userId: string) {
  await pool.query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false", [userId]);
}
