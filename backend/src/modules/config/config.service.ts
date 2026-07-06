import pool from "../../config/database";
import { logAdminAction } from "../admin/admin.service";

export async function getPlatformSettings() {
  const result = await pool.query(`SELECT * FROM platform_settings WHERE id = 1`);
  return result.rows[0];
}

export async function updatePlatformSettings(data: {
  commissionRate?: number;
  requireListingApproval?: boolean;
  supportPhone?: string;
  supportEmail?: string;
  supportHours?: string;
}, adminId: string) {
  const sets: string[] = [];
  const params: any[] = [];

  if (data.commissionRate !== undefined) { params.push(data.commissionRate); sets.push(`commission_rate = $${params.length}`); }
  if (data.requireListingApproval !== undefined) { params.push(data.requireListingApproval); sets.push(`require_listing_approval = $${params.length}`); }
  if (data.supportPhone !== undefined) { params.push(data.supportPhone); sets.push(`support_phone = $${params.length}`); }
  if (data.supportEmail !== undefined) { params.push(data.supportEmail); sets.push(`support_email = $${params.length}`); }
  if (data.supportHours !== undefined) { params.push(data.supportHours); sets.push(`support_hours = $${params.length}`); }
  if (sets.length === 0) return getPlatformSettings();

  sets.push(`updated_at = NOW()`);
  const result = await pool.query(
    `UPDATE platform_settings SET ${sets.join(", ")} WHERE id = 1 RETURNING *`,
    params
  );
  await logAdminAction(adminId, "platform_settings.update", "platform_settings", null, data as Record<string, unknown>);
  return result.rows[0];
}
