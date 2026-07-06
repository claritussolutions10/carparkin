import pool from "../../config/database";
import { createNotification, type NotificationType } from "../notifications/notifications.service";

// --- Audit log (Admin > Audit Log) ---
// Every admin mutation below calls this so there's a record of who changed
// what and when - previously these ~20 endpoints left no trace at all.

export type AuditAction =
  | "user.status_change" | "user.update"
  | "listing.status_change" | "listing.update" | "listing.approve" | "listing.reject"
  | "booking.status_change"
  | "amenity.create" | "amenity.update"
  | "parking_type.create" | "parking_type.update"
  | "subscription_plan.create" | "subscription_plan.update"
  | "support_ticket.reply"
  | "payout.mark_paid"
  | "review.delete"
  | "platform_settings.update"
  | "owner.kyc_review"
  | "owner.bank_review";

export async function logAdminAction(
  adminId: string,
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  details?: Record<string, unknown>
) {
  await pool.query(
    `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5)`,
    [adminId, action, entityType, entityId, details ? JSON.stringify(details) : null]
  );
}

export async function getAuditLog(filters: {
  adminId?: string;
  action?: string;
  entityType?: string;
  page: number;
  limit: number;
}) {
  const { adminId, action, entityType, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (adminId) { params.push(adminId); where.push(`l.admin_id = $${params.length}`); }
  if (action) { params.push(action); where.push(`l.action = $${params.length}`); }
  if (entityType) { params.push(entityType); where.push(`l.entity_type = $${params.length}`); }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT l.id, l.action, l.entity_type, l.entity_id, l.details, l.created_at,
              u.full_name AS admin_name, u.email AS admin_email
       FROM admin_audit_log l
       JOIN users u ON u.id = l.admin_id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM admin_audit_log l ${whereClause}`, params),
  ]);

  return { entries: rows.rows, total: parseInt(count.rows[0].count) };
}

function growthCounter(table: string, extraWhere = "") {
  const where = extraWhere ? `${extraWhere} AND` : "";
  return pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE ${where} DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())) AS this_month,
      COUNT(*) FILTER (WHERE ${where} DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')) AS last_month
    FROM ${table}
  `);
}

function growthPercent(thisMonth: number, lastMonth: number): number | null {
  if (lastMonth === 0) return thisMonth === 0 ? 0 : null;
  return Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10;
}

export async function getDashboardStats() {
  const [users, listings, bookings, revenue, vehicles, spaces, userGrowth, ownerGrowth, listingGrowth, bookingGrowth, vehicleGrowth] =
    await Promise.all([
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE role = 'owner') AS owners,
          COUNT(*) FILTER (WHERE role = 'user') AS regular_users
        FROM users WHERE is_active = true
      `),
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE is_active = true AND is_approved = true) AS active,
          COUNT(*) FILTER (WHERE approval_status = 'pending') AS pending
        FROM parking_listings
      `),
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status IN ('pending','confirmed')) AS active,
          COUNT(*) FILTER (WHERE status = 'completed') AS completed
        FROM bookings
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(total_price), 0) AS total,
          COALESCE(SUM(total_price) FILTER (
            WHERE DATE_TRUNC('month', booking_start_date) = DATE_TRUNC('month', NOW())
          ), 0) AS this_month
        FROM bookings WHERE status IN ('confirmed','completed')
      `),
      pool.query(`SELECT COUNT(*) AS total FROM vehicles WHERE is_active = true`),
      pool.query(`SELECT COALESCE(SUM(total_spaces), 0) AS total, COALESCE(SUM(available_spaces), 0) AS available FROM parking_listings WHERE is_active = true`),
      growthCounter("users", "role = 'user'"),
      growthCounter("users", "role = 'owner'"),
      growthCounter("parking_listings"),
      growthCounter("bookings"),
      growthCounter("vehicles"),
    ]);

  const u = users.rows[0];
  const l = listings.rows[0];
  const b = bookings.rows[0];
  const r = revenue.rows[0];
  const v = vehicles.rows[0];
  const sp = spaces.rows[0];

  const growth = (rows: any[]) => {
    const thisMonth = parseInt(rows[0].this_month);
    const lastMonth = parseInt(rows[0].last_month);
    return growthPercent(thisMonth, lastMonth);
  };

  return {
    totalAccounts: parseInt(u.total),
    totalOwners: parseInt(u.owners),
    totalUsers: parseInt(u.regular_users),
    totalListings: parseInt(l.total),
    activeListings: parseInt(l.active),
    pendingApprovals: parseInt(l.pending),
    totalBookings: parseInt(b.total),
    activeBookings: parseInt(b.active),
    completedBookings: parseInt(b.completed),
    totalRevenue: parseFloat(r.total),
    monthRevenue: parseFloat(r.this_month),
    totalVehicles: parseInt(v.total),
    totalSpaces: parseInt(sp.total),
    availableSpaces: parseInt(sp.available),
    trends: {
      users: growth(userGrowth.rows),
      owners: growth(ownerGrowth.rows),
      listings: growth(listingGrowth.rows),
      bookings: growth(bookingGrowth.rows),
      vehicles: growth(vehicleGrowth.rows),
    },
  };
}

export async function getBookingVolume(days: number) {
  const result = await pool.query(
    `SELECT
       TO_CHAR(d.day, 'YYYY-MM-DD') AS date,
       COUNT(b.id) AS bookings
     FROM generate_series(
       CURRENT_DATE - ($1::int - 1) * INTERVAL '1 day',
       CURRENT_DATE,
       INTERVAL '1 day'
     ) AS d(day)
     LEFT JOIN bookings b ON DATE(b.created_at) = d.day
     GROUP BY d.day
     ORDER BY d.day`,
    [days]
  );
  return result.rows.map((r) => ({ date: r.date, bookings: parseInt(r.bookings) }));
}

export async function getOwners(filters: {
  search?: string;
  status?: string;
  joinedFrom?: string;
  joinedTo?: string;
  page: number;
  limit: number;
}) {
  const { search, status, joinedFrom, joinedTo, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = ["u.role = 'owner'"];

  if (status === "active") where.push("u.is_active = true AND COALESCE(os.kyc_verified, false) AND COALESCE(os.bank_account_verified, false)");
  if (status === "pending") where.push("u.is_active = true AND NOT (COALESCE(os.kyc_verified, false) AND COALESCE(os.bank_account_verified, false))");
  if (status === "suspended") where.push("u.is_active = false");
  if (search) {
    params.push(`%${search}%`);
    where.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone_number ILIKE $${params.length} OR u.id ILIKE $${params.length})`);
  }
  if (joinedFrom) { params.push(joinedFrom); where.push(`u.created_at >= $${params.length}`); }
  if (joinedTo) { params.push(joinedTo); where.push(`u.created_at <= $${params.length}`); }

  const whereClause = `WHERE ${where.join(" AND ")}`;

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT
         u.id, u.full_name, u.email, u.phone_number, u.profile_picture, u.is_active, u.created_at,
         COALESCE(os.kyc_verified, false) AS kyc_verified,
         COALESCE(os.bank_account_verified, false) AS bank_account_verified,
         COUNT(DISTINCT pl.id) AS listing_count,
         COALESCE(SUM(b.total_price) FILTER (WHERE b.status IN ('confirmed', 'completed')), 0) AS revenue
       FROM users u
       LEFT JOIN owner_settings os ON os.owner_id = u.id
       LEFT JOIN parking_listings pl ON pl.owner_id = u.id
       LEFT JOIN bookings b ON b.parking_listing_id = pl.id
       ${whereClause}
       GROUP BY u.id, os.kyc_verified, os.bank_account_verified
       ORDER BY u.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM users u LEFT JOIN owner_settings os ON os.owner_id = u.id ${whereClause}`,
      params
    ),
  ]);

  return { owners: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function getUsers(filters: {
  search?: string;
  role?: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const { search, role, status, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (role) { params.push(role); where.push(`role = $${params.length}`); }
  if (status === "active") where.push("is_active = true");
  if (status === "suspended") where.push("is_active = false");
  if (search) {
    params.push(`%${search}%`);
    where.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length} OR id ILIKE $${params.length})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT id, full_name, email, role, phone_number, profile_picture, is_active, is_email_verified, created_at
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM users ${whereClause}`, params),
  ]);

  return { users: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function updateUserStatus(userId: string, isActive: boolean, adminId: string) {
  const result = await pool.query(
    `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id`,
    [isActive, userId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("User not found"), { status: 404 });
  await logAdminAction(adminId, "user.status_change", "user", userId, { isActive });
}

export async function updateUser(
  userId: string,
  data: { fullName?: string; phoneNumber?: string; role?: "user" | "owner" },
  adminId: string
) {
  const sets: string[] = [];
  const params: any[] = [];

  if (data.fullName !== undefined) { params.push(data.fullName); sets.push(`full_name = $${params.length}`); }
  if (data.phoneNumber !== undefined) { params.push(data.phoneNumber); sets.push(`phone_number = $${params.length}`); }
  if (data.role !== undefined) { params.push(data.role); sets.push(`role = $${params.length}`); }
  if (sets.length === 0) return;

  sets.push(`updated_at = NOW()`);
  params.push(userId);
  const result = await pool.query(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (result.rowCount === 0) throw Object.assign(new Error("User not found"), { status: 404 });
  await logAdminAction(adminId, "user.update", "user", userId, data as Record<string, unknown>);
}

export async function getListings(filters: {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const { search, status, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (status === "pending") where.push("pl.approval_status = 'pending'");
  if (status === "active") where.push("pl.is_active = true AND pl.is_approved = true AND pl.available_spaces > 0");
  if (status === "full") where.push("pl.is_active = true AND pl.is_approved = true AND pl.available_spaces = 0");
  if (status === "inactive") where.push("pl.is_active = false");
  if (search) {
    params.push(`%${search}%`);
    where.push(`(pl.title ILIKE $${params.length} OR pl.address ILIKE $${params.length} OR pl.id ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT pl.id, pl.title, pl.address, pl.total_spaces, pl.available_spaces,
              pl.price_per_day AS daily_price, pl.price_per_month AS monthly_price,
              pl.is_approved, pl.is_active, pl.created_at,
              u.full_name AS owner_name, u.email AS owner_email,
              img.cloudinary_url AS thumbnail
       FROM parking_listings pl
       JOIN users u ON pl.owner_id = u.id
       LEFT JOIN LATERAL (
         SELECT cloudinary_url FROM parking_listing_images
         WHERE parking_listing_id = pl.id ORDER BY display_order LIMIT 1
       ) img ON true
       ${whereClause}
       ORDER BY pl.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM parking_listings pl JOIN users u ON pl.owner_id = u.id ${whereClause}`,
      params
    ),
  ]);

  return { listings: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function getLocationStats() {
  const [counts, totalGrowth, pendingGrowth] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE approval_status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE is_active = true AND is_approved = true AND available_spaces > 0) AS active,
        COUNT(*) FILTER (WHERE is_active = true AND is_approved = true AND available_spaces = 0) AS full
      FROM parking_listings
    `),
    growthCounter("parking_listings"),
    growthCounter("parking_listings", "approval_status = 'pending'"),
  ]);

  const c = counts.rows[0];
  return {
    total: parseInt(c.total),
    pending: parseInt(c.pending),
    active: parseInt(c.active),
    full: parseInt(c.full),
    trends: {
      total: growthPercent(parseInt(totalGrowth.rows[0].this_month), parseInt(totalGrowth.rows[0].last_month)),
      pending: growthPercent(parseInt(pendingGrowth.rows[0].this_month), parseInt(pendingGrowth.rows[0].last_month)),
    },
  };
}

export async function updateListingStatus(listingId: string, isActive: boolean, adminId: string) {
  const result = await pool.query(
    `UPDATE parking_listings SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, owner_id, title`,
    [isActive, listingId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Listing not found"), { status: 404 });
  const l = result.rows[0];
  await createNotification(
    l.owner_id,
    isActive ? "listing_reactivated" : "listing_suspended",
    isActive ? "Listing reactivated" : "Listing suspended",
    isActive ? `"${l.title}" is visible to renters again.` : `"${l.title}" has been hidden from search by an admin.`,
    "/owner/locations"
  );
  await logAdminAction(adminId, "listing.status_change", "listing", listingId, { isActive, title: l.title });
}

export async function updateListing(listingId: string, data: { title?: string; address?: string }, adminId: string) {
  const sets: string[] = [];
  const params: any[] = [];

  if (data.title !== undefined) { params.push(data.title); sets.push(`title = $${params.length}`); }
  if (data.address !== undefined) { params.push(data.address); sets.push(`address = $${params.length}`); }
  if (sets.length === 0) return;

  sets.push(`updated_at = NOW()`);
  params.push(listingId);
  const result = await pool.query(
    `UPDATE parking_listings SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING id`,
    params
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Listing not found"), { status: 404 });
  await logAdminAction(adminId, "listing.update", "listing", listingId, data as Record<string, unknown>);
}

export async function getPendingListings(search?: string) {
  const params: any[] = [];
  const where: string[] = ["pl.approval_status = 'pending'"];
  if (search) {
    params.push(`%${search}%`);
    where.push(`(pl.title ILIKE $${params.length} OR pl.address ILIKE $${params.length} OR pl.id ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`);
  }

  const result = await pool.query(
    `SELECT pl.id, pl.title, pl.address, pl.total_spaces, pl.available_spaces,
            pl.price_per_day AS daily_price, pl.price_per_month AS monthly_price, pl.created_at,
            u.full_name AS owner_name, u.email AS owner_email, u.profile_picture AS owner_avatar,
            COALESCE(
              (SELECT json_agg(cloudinary_url ORDER BY display_order) FROM parking_listing_images WHERE parking_listing_id = pl.id),
              '[]'
            ) AS images,
            COALESCE(
              (SELECT json_agg(a.name) FROM parking_listing_amenities pla JOIN amenities a ON a.id = pla.amenity_id WHERE pla.parking_listing_id = pl.id),
              '[]'
            ) AS amenities
     FROM parking_listings pl
     JOIN users u ON pl.owner_id = u.id
     WHERE ${where.join(" AND ")}
     ORDER BY pl.created_at ASC`,
    params
  );
  return result.rows;
}

export async function getApprovalStats() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE approval_status = 'pending') AS total_pending,
      COUNT(*) FILTER (WHERE approval_status = 'approved' AND DATE(approved_at) = CURRENT_DATE) AS approved_today,
      COUNT(*) FILTER (WHERE approval_status = 'rejected' AND DATE(rejected_at) = CURRENT_DATE) AS rejected_today,
      MODE() WITHIN GROUP (ORDER BY rejection_reason) FILTER (WHERE approval_status = 'rejected' AND DATE(rejected_at) = CURRENT_DATE) AS top_rejection_reason
    FROM parking_listings
  `);
  const r = result.rows[0];
  return {
    totalPending: parseInt(r.total_pending),
    approvedToday: parseInt(r.approved_today),
    rejectedToday: parseInt(r.rejected_today),
    topRejectionReason: r.top_rejection_reason as string | null,
  };
}

export async function approveListing(listingId: string, adminId: string) {
  const result = await pool.query(
    `UPDATE parking_listings
     SET is_approved = true, is_active = true, approval_status = 'approved', approved_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING id, owner_id, title`,
    [listingId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Listing not found"), { status: 404 });
  const l = result.rows[0];
  await createNotification(
    l.owner_id, "listing_approved", "Listing approved",
    `"${l.title}" is now live and visible to renters.`, "/owner/locations"
  );
  await logAdminAction(adminId, "listing.approve", "listing", listingId, { title: l.title });
}

export async function rejectListing(listingId: string, reason: string | undefined, adminId: string) {
  const result = await pool.query(
    `UPDATE parking_listings
     SET is_approved = false, is_active = false, approval_status = 'rejected', rejected_at = NOW(),
         rejection_reason = $2, updated_at = NOW()
     WHERE id = $1 RETURNING id, owner_id, title`,
    [listingId, reason ?? null]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Listing not found"), { status: 404 });
  const l = result.rows[0];
  await createNotification(
    l.owner_id, "listing_rejected", "Listing rejected",
    reason ? `"${l.title}" was rejected: ${reason}` : `"${l.title}" was rejected.`, "/owner/locations"
  );
  await logAdminAction(adminId, "listing.reject", "listing", listingId, { title: l.title, reason: reason ?? null });
}

export async function getBookings(filters: {
  search?: string;
  status?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}) {
  const { search, status, locationId, dateFrom, dateTo, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (status) { params.push(status); where.push(`b.status = $${params.length}`); }
  if (locationId) { params.push(locationId); where.push(`pl.id = $${params.length}`); }
  if (dateFrom) { params.push(dateFrom); where.push(`b.booking_start_date >= $${params.length}`); }
  if (dateTo) { params.push(dateTo); where.push(`b.booking_start_date <= $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(usr.full_name ILIKE $${params.length} OR pl.title ILIKE $${params.length} OR b.id ILIKE $${params.length} OR v.registration_number ILIKE $${params.length})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT b.id, b.status, b.payment_status, b.total_price, b.booking_start_date, b.booking_end_date,
              b.duration_type, b.created_at,
              pl.id AS listing_id, pl.title AS listing_title, pl.address AS listing_address,
              usr.full_name AS user_name, usr.email AS user_email, usr.profile_picture AS user_avatar,
              owner.full_name AS owner_name,
              v.registration_number, v.vehicle_type
       FROM bookings b
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       JOIN users usr ON b.user_id = usr.id
       JOIN users owner ON pl.owner_id = owner.id
       JOIN vehicles v ON b.vehicle_id = v.id
       ${whereClause}
       ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM bookings b
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       JOIN users usr ON b.user_id = usr.id
       JOIN users owner ON pl.owner_id = owner.id
       JOIN vehicles v ON b.vehicle_id = v.id
       ${whereClause}`,
      params
    ),
  ]);

  return { bookings: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function getBookingStats() {
  const [counts, revenue, activeGrowth, pendingGrowth] = await Promise.all([
    pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'confirmed') AS active_count,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_count
      FROM bookings
    `),
    pool.query(`
      SELECT
        COALESCE(SUM(total_price) FILTER (
          WHERE DATE_TRUNC('month', booking_start_date) = DATE_TRUNC('month', NOW())
        ), 0) AS this_month,
        COALESCE(SUM(total_price) FILTER (
          WHERE DATE_TRUNC('month', booking_start_date) = DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        ), 0) AS last_month
      FROM bookings WHERE status IN ('confirmed', 'completed')
    `),
    growthCounter("bookings", "status = 'confirmed'"),
    growthCounter("bookings", "status = 'pending'"),
  ]);

  const c = counts.rows[0];
  const r = revenue.rows[0];

  return {
    activeCount: parseInt(c.active_count),
    pendingCount: parseInt(c.pending_count),
    monthRevenue: parseFloat(r.this_month),
    trends: {
      active: growthPercent(parseInt(activeGrowth.rows[0].this_month), parseInt(activeGrowth.rows[0].last_month)),
      pending: growthPercent(parseInt(pendingGrowth.rows[0].this_month), parseInt(pendingGrowth.rows[0].last_month)),
      revenue: growthPercent(parseFloat(r.this_month), parseFloat(r.last_month)),
    },
  };
}

export async function updateBookingStatus(bookingId: string, status: "confirmed" | "cancelled" | "completed", adminId: string) {
  const result = await pool.query(
    `UPDATE bookings b SET status = $1, updated_at = NOW()
     FROM parking_listings pl
     WHERE b.id = $2 AND b.parking_listing_id = pl.id
     RETURNING b.id, b.user_id, pl.title AS listing_title`,
    [status, bookingId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Booking not found"), { status: 404 });
  const b = result.rows[0];
  const copy: Record<typeof status, { type: NotificationType; title: string }> = {
    confirmed: { type: "booking_confirmed", title: "Booking confirmed" },
    cancelled: { type: "booking_cancelled", title: "Booking cancelled" },
    completed: { type: "booking_completed", title: "Booking completed" },
  };
  const { type, title } = copy[status];
  await createNotification(b.user_id, type, title, `Your booking at "${b.listing_title}" is now ${status}.`, "/bookings");
  await logAdminAction(adminId, "booking.status_change", "booking", bookingId, { status });
}

// --- Amenities master list (Admin > Configuration) ---
// Owner's "Add Location" amenity picker and User's search filters both read
// from the same public /parkings/amenities endpoint, so anything managed
// here reflects in both modules automatically with no further code changes.

export async function getAllAmenities() {
  const result = await pool.query(`SELECT * FROM amenities ORDER BY name`);
  return result.rows;
}

export async function createAmenity(data: { name: string; description?: string; icon?: string }, adminId: string) {
  const result = await pool.query(
    `INSERT INTO amenities (name, description, icon) VALUES ($1, $2, $3) RETURNING *`,
    [data.name, data.description ?? null, data.icon ?? null]
  );
  await logAdminAction(adminId, "amenity.create", "amenity", String(result.rows[0].id), { name: data.name });
  return result.rows[0];
}

export async function updateAmenity(id: number, data: { name?: string; description?: string; icon?: string; isActive?: boolean }, adminId: string) {
  const sets: string[] = [];
  const params: any[] = [];
  if (data.name !== undefined) { params.push(data.name); sets.push(`name = $${params.length}`); }
  if (data.description !== undefined) { params.push(data.description); sets.push(`description = $${params.length}`); }
  if (data.icon !== undefined) { params.push(data.icon); sets.push(`icon = $${params.length}`); }
  if (data.isActive !== undefined) { params.push(data.isActive); sets.push(`is_active = $${params.length}`); }
  if (sets.length === 0) return;

  sets.push(`updated_at = NOW()`);
  params.push(id);
  const result = await pool.query(
    `UPDATE amenities SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Amenity not found"), { status: 404 });
  await logAdminAction(adminId, "amenity.update", "amenity", String(id), data as Record<string, unknown>);
  return result.rows[0];
}

// --- Parking types master list (Admin > Configuration) ---
// Owner's "Add Location" form uses this same list for its parking-type
// dropdown via the public /parkings/types endpoint.

export async function getAllParkingTypes() {
  const result = await pool.query(`SELECT * FROM parking_types ORDER BY name`);
  return result.rows;
}

export async function createParkingType(data: { name: string; description?: string }, adminId: string) {
  const result = await pool.query(
    `INSERT INTO parking_types (name, description) VALUES ($1, $2) RETURNING *`,
    [data.name, data.description ?? null]
  );
  await logAdminAction(adminId, "parking_type.create", "parking_type", String(result.rows[0].id), { name: data.name });
  return result.rows[0];
}

export async function updateParkingType(id: number, data: { name?: string; description?: string; isActive?: boolean }, adminId: string) {
  const sets: string[] = [];
  const params: any[] = [];
  if (data.name !== undefined) { params.push(data.name); sets.push(`name = $${params.length}`); }
  if (data.description !== undefined) { params.push(data.description); sets.push(`description = $${params.length}`); }
  if (data.isActive !== undefined) { params.push(data.isActive); sets.push(`is_active = $${params.length}`); }
  if (sets.length === 0) return;

  sets.push(`updated_at = NOW()`);
  params.push(id);
  const result = await pool.query(
    `UPDATE parking_types SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Parking type not found"), { status: 404 });
  await logAdminAction(adminId, "parking_type.update", "parking_type", String(id), data as Record<string, unknown>);
  return result.rows[0];
}

// --- Subscription plans (Admin > Configuration) ---
// The real single source of truth for what Owner's Subscription page shows
// and what /subscriptions/activate can assign - previously the Owner Portal
// ignored this table entirely and used a hardcoded frontend array instead.

export async function getAllSubscriptionPlans() {
  const result = await pool.query(`SELECT * FROM subscription_plans ORDER BY price`);
  return result.rows;
}

export async function createSubscriptionPlan(data: {
  name: string; price: number; maxListings?: number; billingCycle?: string; features?: object;
}, adminId: string) {
  const result = await pool.query(
    `INSERT INTO subscription_plans (name, price, currency, max_listings, billing_cycle, features)
     VALUES ($1, $2, 'INR', $3, $4, $5) RETURNING *`,
    [data.name, data.price, data.maxListings ?? null, data.billingCycle ?? "monthly", JSON.stringify(data.features ?? {})]
  );
  await logAdminAction(adminId, "subscription_plan.create", "subscription_plan", String(result.rows[0].id), { name: data.name, price: data.price });
  return result.rows[0];
}

export async function updateSubscriptionPlan(id: number, data: {
  name?: string; price?: number; maxListings?: number; billingCycle?: string; features?: object; isActive?: boolean;
}, adminId: string) {
  const sets: string[] = [];
  const params: any[] = [];
  if (data.name !== undefined) { params.push(data.name); sets.push(`name = $${params.length}`); }
  if (data.price !== undefined) { params.push(data.price); sets.push(`price = $${params.length}`); }
  if (data.maxListings !== undefined) { params.push(data.maxListings); sets.push(`max_listings = $${params.length}`); }
  if (data.billingCycle !== undefined) { params.push(data.billingCycle); sets.push(`billing_cycle = $${params.length}`); }
  if (data.features !== undefined) { params.push(JSON.stringify(data.features)); sets.push(`features = $${params.length}`); }
  if (data.isActive !== undefined) { params.push(data.isActive); sets.push(`is_active = $${params.length}`); }
  if (sets.length === 0) return;

  sets.push(`updated_at = NOW()`);
  params.push(id);
  const result = await pool.query(
    `UPDATE subscription_plans SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`,
    params
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Plan not found"), { status: 404 });
  await logAdminAction(adminId, "subscription_plan.update", "subscription_plan", String(id), data as Record<string, unknown>);
  return result.rows[0];
}

// --- Support tickets (Admin > Support) ---
// Real destination for the User Portal's "Send us a message" form, which
// previously submitted into nothing.

export async function getSupportTickets(filters: { status?: string; urgentOnly?: boolean; page: number; limit: number }) {
  const { status, urgentOnly, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (status) { params.push(status); where.push(`t.status = $${params.length}`); }
  if (urgentOnly) where.push(`t.is_urgent = true`);

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT t.*, u.full_name AS user_name, u.email AS user_email
       FROM support_tickets t
       JOIN users u ON u.id = t.user_id
       ${whereClause}
       ORDER BY t.is_urgent DESC, t.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(`SELECT COUNT(*) FROM support_tickets t ${whereClause}`, params),
  ]);

  return { tickets: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function getSupportTicketStats() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'open') AS open_count,
      COUNT(*) FILTER (WHERE status = 'open' AND is_urgent = true) AS urgent_count,
      COUNT(*) FILTER (WHERE status = 'resolved' AND DATE(replied_at) = CURRENT_DATE) AS resolved_today
    FROM support_tickets
  `);
  const r = result.rows[0];
  return {
    openCount: parseInt(r.open_count),
    urgentCount: parseInt(r.urgent_count),
    resolvedToday: parseInt(r.resolved_today),
  };
}

export async function replySupportTicket(id: string, reply: string, adminId: string) {
  const result = await pool.query(
    `UPDATE support_tickets
     SET admin_reply = $1, status = 'resolved', replied_at = NOW(), updated_at = NOW()
     WHERE id = $2 RETURNING *`,
    [reply, id]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Ticket not found"), { status: 404 });
  const t = result.rows[0];
  await createNotification(t.user_id, "support_replied", "Support replied to your ticket", reply, "/support");
  await logAdminAction(adminId, "support_ticket.reply", "support_ticket", id, { reply });
  return result.rows[0];
}

// --- Payouts (Admin > Payouts) ---
// owner_earnings rows are created 'pending' whenever a booking payment
// completes (see bookings.service.ts) but nothing has ever moved them to
// 'paid' - this is the screen and mutation that actually closes that loop.

export async function getPayoutStats() {
  const result = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
      COALESCE(SUM(net_amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount,
      COALESCE(SUM(net_amount) FILTER (
        WHERE status = 'paid' AND DATE_TRUNC('month', transaction_date) = DATE_TRUNC('month', NOW())
      ), 0) AS paid_this_month,
      COUNT(DISTINCT owner_id) FILTER (WHERE status = 'pending') AS owners_awaiting
    FROM owner_earnings
  `);
  const r = result.rows[0];
  return {
    pendingCount: parseInt(r.pending_count),
    pendingAmount: parseFloat(r.pending_amount),
    paidThisMonth: parseFloat(r.paid_this_month),
    ownersAwaiting: parseInt(r.owners_awaiting),
  };
}

export async function getPayouts(filters: { status?: string; search?: string; page: number; limit: number }) {
  const { status, search, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (status) { params.push(status); where.push(`oe.status = $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR pl.title ILIKE $${params.length})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT oe.id, oe.gross_amount, oe.commission_amount, oe.net_amount, oe.status,
              oe.transaction_date, oe.created_at,
              u.id AS owner_id, u.full_name AS owner_name, u.email AS owner_email,
              pl.title AS listing_title, b.booking_start_date, b.booking_end_date
       FROM owner_earnings oe
       JOIN users u ON u.id = oe.owner_id
       JOIN bookings b ON b.id = oe.booking_id
       JOIN parking_listings pl ON pl.id = b.parking_listing_id
       ${whereClause}
       ORDER BY oe.status ASC, oe.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM owner_earnings oe
       JOIN users u ON u.id = oe.owner_id
       JOIN bookings b ON b.id = oe.booking_id
       JOIN parking_listings pl ON pl.id = b.parking_listing_id
       ${whereClause}`,
      params
    ),
  ]);

  return { payouts: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function markPayoutsPaid(ids: string[], adminId: string) {
  if (ids.length === 0) return { updated: 0 };

  const result = await pool.query(
    `UPDATE owner_earnings
     SET status = 'paid', transaction_date = NOW(), updated_at = NOW()
     WHERE id = ANY($1) AND status = 'pending'
     RETURNING id, owner_id, net_amount`,
    [ids]
  );

  const byOwner = new Map<string, number>();
  for (const row of result.rows) {
    byOwner.set(row.owner_id, (byOwner.get(row.owner_id) ?? 0) + parseFloat(row.net_amount));
  }
  await Promise.all(
    Array.from(byOwner.entries()).map(([ownerId, amount]) =>
      createNotification(
        ownerId, "payout_paid", "Payout received",
        `A payout of ₹${amount.toFixed(2)} has been credited to your account.`, "/owner/earnings"
      )
    )
  );

  await logAdminAction(adminId, "payout.mark_paid", "payout", null, {
    count: result.rowCount,
    totalAmount: result.rows.reduce((sum, r) => sum + parseFloat(r.net_amount), 0),
  });

  return { updated: result.rowCount };
}

// --- Reviews (Admin > Reviews) ---
// The reviews table has stood since the original schema with no admin
// visibility or way to remove an abusive one - listing rating/review_count
// are recomputed after deletion the same way user.service.ts does on create.

export async function getReviews(filters: { search?: string; maxRating?: number; page: number; limit: number }) {
  const { search, maxRating, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: any[] = [];
  const where: string[] = [];

  if (maxRating) { params.push(maxRating); where.push(`r.rating <= $${params.length}`); }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(r.review_text ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR pl.title ILIKE $${params.length})`);
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT r.id, r.rating, r.review_text, r.cleanliness_rating, r.security_rating,
              r.accessibility_rating, r.is_verified_booking, r.is_flagged, r.created_at,
              u.full_name AS reviewer_name, u.email AS reviewer_email,
              pl.id AS listing_id, pl.title AS listing_title
       FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       JOIN parking_listings pl ON pl.id = r.parking_listing_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM reviews r
       JOIN users u ON u.id = r.reviewer_id
       JOIN parking_listings pl ON pl.id = r.parking_listing_id
       ${whereClause}`,
      params
    ),
  ]);

  return { reviews: rows.rows, total: parseInt(count.rows[0].count) };
}

export async function deleteReview(id: string, adminId: string) {
  const result = await pool.query(
    `DELETE FROM reviews WHERE id = $1 RETURNING parking_listing_id, rating`,
    [id]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Review not found"), { status: 404 });
  const parkingListingId = result.rows[0].parking_listing_id;

  await pool.query(
    `UPDATE parking_listings
     SET rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE parking_listing_id = $1), 0),
         review_count = (SELECT COUNT(*) FROM reviews WHERE parking_listing_id = $1),
         updated_at = NOW()
     WHERE id = $1`,
    [parkingListingId]
  );

  await logAdminAction(adminId, "review.delete", "review", id, { listingId: parkingListingId, rating: result.rows[0].rating });
}

// --- Reports (Admin > Reports) ---
// Monthly revenue/commission breakdown beyond the Dashboard's live snapshot.
// Named "Revenue & Commission Report" rather than a tax/GST filing - there is
// no separate tax field or rate modeled anywhere in this schema, so calling
// it a GST summary would overclaim what the numbers actually are.

export async function getRevenueReport(months: number) {
  const result = await pool.query(
    `SELECT
       TO_CHAR(DATE_TRUNC('month', b.booking_start_date), 'YYYY-MM') AS month,
       COUNT(*) AS bookings,
       COALESCE(SUM(b.total_price), 0) AS gross_revenue,
       COALESCE(SUM(b.platform_commission), 0) AS commission_revenue,
       COALESCE(SUM(b.owner_payout), 0) AS owner_payouts
     FROM bookings b
     WHERE b.status IN ('confirmed', 'completed')
       AND b.booking_start_date >= DATE_TRUNC('month', NOW()) - ($1 || ' months')::INTERVAL
     GROUP BY DATE_TRUNC('month', b.booking_start_date)
     ORDER BY DATE_TRUNC('month', b.booking_start_date) DESC`,
    [months]
  );

  return result.rows.map((r) => ({
    month: r.month,
    bookings: parseInt(r.bookings),
    grossRevenue: parseFloat(r.gross_revenue),
    commissionRevenue: parseFloat(r.commission_revenue),
    ownerPayouts: parseFloat(r.owner_payouts),
  }));
}

export async function getRevenueSummary() {
  const result = await pool.query(`
    SELECT
      COALESCE(SUM(total_price) FILTER (WHERE status IN ('confirmed','completed')), 0) AS lifetime_gross,
      COALESCE(SUM(platform_commission) FILTER (WHERE status IN ('confirmed','completed')), 0) AS lifetime_commission,
      COALESCE(SUM(total_price) FILTER (
        WHERE status IN ('confirmed','completed') AND DATE_TRUNC('month', booking_start_date) = DATE_TRUNC('month', NOW())
      ), 0) AS month_gross,
      COALESCE(SUM(platform_commission) FILTER (
        WHERE status IN ('confirmed','completed') AND DATE_TRUNC('month', booking_start_date) = DATE_TRUNC('month', NOW())
      ), 0) AS month_commission
    FROM bookings
  `);
  const r = result.rows[0];
  return {
    lifetimeGross: parseFloat(r.lifetime_gross),
    lifetimeCommission: parseFloat(r.lifetime_commission),
    monthGross: parseFloat(r.month_gross),
    monthCommission: parseFloat(r.month_commission),
  };
}

// --- Owner KYC / bank verification review (Admin > Owners) ---
// owner_settings.kyc_verified and bank_account_verified previously had no
// submission for admin to actually review - just booleans nobody could set
// except by hand in the database.

export async function getOwnerVerification(ownerId: string) {
  const result = await pool.query(
    `SELECT
       kyc_document_url, kyc_document_type, kyc_submitted_at, kyc_verified, kyc_rejected_reason,
       bank_account_number, bank_ifsc, bank_account_holder_name, bank_submitted_at,
       bank_account_verified, bank_rejected_reason
     FROM owner_settings WHERE owner_id = $1`,
    [ownerId]
  );
  if (!result.rows[0]) throw Object.assign(new Error("Owner settings not found"), { status: 404 });
  return result.rows[0];
}

export async function reviewOwnerKyc(ownerId: string, verified: boolean, reason: string | undefined, adminId: string) {
  const result = await pool.query(
    `UPDATE owner_settings
     SET kyc_verified = $1, kyc_rejected_reason = $2, updated_at = NOW()
     WHERE owner_id = $3
     RETURNING owner_id`,
    [verified, verified ? null : (reason ?? "Rejected by admin"), ownerId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Owner settings not found"), { status: 404 });
  await createNotification(
    ownerId, "kyc_reviewed", verified ? "KYC verified" : "KYC rejected",
    verified ? "Your identity verification has been approved." : `Your KYC submission was rejected: ${reason ?? "no reason given"}. Please resubmit.`,
    "/owner/settings"
  );
  await logAdminAction(adminId, "owner.kyc_review", "owner", ownerId, { verified, reason: reason ?? null });
}

export async function reviewOwnerBank(ownerId: string, verified: boolean, reason: string | undefined, adminId: string) {
  const result = await pool.query(
    `UPDATE owner_settings
     SET bank_account_verified = $1, bank_rejected_reason = $2, updated_at = NOW()
     WHERE owner_id = $3
     RETURNING owner_id`,
    [verified, verified ? null : (reason ?? "Rejected by admin"), ownerId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Owner settings not found"), { status: 404 });
  await createNotification(
    ownerId, "bank_reviewed", verified ? "Bank account verified" : "Bank details rejected",
    verified ? "Your bank account is verified and ready to receive payouts." : `Your bank details were rejected: ${reason ?? "no reason given"}. Please resubmit.`,
    "/owner/settings"
  );
  await logAdminAction(adminId, "owner.bank_review", "owner", ownerId, { verified, reason: reason ?? null });
}
