import pool from "../../config/database";
import { createNotification, notifyAdmins } from "../notifications/notifications.service";

export async function getOwnerDashboard(ownerId: string) {
  const [listingStats, earningStats, recentBookings] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) AS total_listings,
         SUM(total_spaces) AS total_spaces,
         SUM(available_spaces) AS available_spaces,
         COUNT(*) FILTER (WHERE is_active = true) AS active_listings
       FROM parking_listings
       WHERE owner_id = $1`,
      [ownerId]
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(oe.net_amount), 0) AS total_earnings,
         COALESCE(SUM(oe.net_amount) FILTER (WHERE DATE_TRUNC('month', oe.created_at) = DATE_TRUNC('month', NOW())), 0) AS this_month_earnings,
         COUNT(DISTINCT b.id) AS total_bookings,
         COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed') AS active_bookings
       FROM parking_listings pl
       LEFT JOIN bookings b ON pl.id = b.parking_listing_id
       LEFT JOIN owner_earnings oe ON b.id = oe.booking_id
       WHERE pl.owner_id = $1`,
      [ownerId]
    ),
    pool.query(
      `SELECT
         b.id, b.status, b.payment_status, b.total_price,
         b.booking_start_date, b.booking_end_date, b.duration_type,
         pl.title AS listing_title, pl.address AS listing_address,
         u.full_name AS user_name, u.phone_number AS user_phone,
         v.registration_number, v.make, v.model
       FROM bookings b
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       JOIN users u ON b.user_id = u.id
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE pl.owner_id = $1
       ORDER BY b.created_at DESC
       LIMIT 5`,
      [ownerId]
    ),
  ]);

  const listings = listingStats.rows[0];
  const earnings = earningStats.rows[0];

  return {
    listings: {
      total: parseInt(listings.total_listings),
      active: parseInt(listings.active_listings),
      totalSpaces: parseInt(listings.total_spaces) || 0,
      availableSpaces: parseInt(listings.available_spaces) || 0,
    },
    earnings: {
      total: parseFloat(earnings.total_earnings),
      thisMonth: parseFloat(earnings.this_month_earnings),
      totalBookings: parseInt(earnings.total_bookings),
      activeBookings: parseInt(earnings.active_bookings),
    },
    recentBookings: recentBookings.rows,
  };
}

export async function getOwnerEarnings(
  ownerId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const [earningsResult, summaryResult] = await Promise.all([
    pool.query(
      `SELECT
         oe.id, oe.gross_amount, oe.commission_amount, oe.net_amount,
         oe.status, oe.created_at,
         b.booking_start_date, b.booking_end_date, b.duration_type,
         pl.title AS listing_title,
         u.full_name AS user_name
       FROM owner_earnings oe
       JOIN bookings b ON oe.booking_id = b.id
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       JOIN users u ON b.user_id = u.id
       WHERE oe.owner_id = $1
       ORDER BY oe.created_at DESC
       LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset]
    ),
    pool.query(
      `SELECT
         COALESCE(SUM(net_amount), 0) AS total_earned,
         COALESCE(SUM(net_amount) FILTER (WHERE status = 'paid'), 0) AS paid_amount,
         COALESCE(SUM(net_amount) FILTER (WHERE status = 'pending'), 0) AS pending_amount,
         COUNT(*) AS total_transactions
       FROM owner_earnings
       WHERE owner_id = $1`,
      [ownerId]
    ),
  ]);

  return {
    earnings: earningsResult.rows,
    summary: {
      totalEarned: parseFloat(summaryResult.rows[0].total_earned),
      paidAmount: parseFloat(summaryResult.rows[0].paid_amount),
      pendingAmount: parseFloat(summaryResult.rows[0].pending_amount),
      totalTransactions: parseInt(summaryResult.rows[0].total_transactions),
    },
    page,
    limit,
  };
}

export async function getOwnerBookings(
  ownerId: string,
  status?: string,
  page: number = 1,
  limit: number = 20,
  listingId?: string
) {
  const offset = (page - 1) * limit;
  const params: unknown[] = [ownerId];

  let statusFilter = "";
  if (status) {
    statusFilter = ` AND b.status = $${params.length + 1}`;
    params.push(status);
  }

  let listingFilter = "";
  if (listingId) {
    listingFilter = ` AND pl.id = $${params.length + 1}`;
    params.push(listingId);
  }

  const [bookingsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT
         b.id, b.status, b.payment_status, b.total_price,
         b.booking_start_date, b.booking_end_date,
         b.duration_days, b.duration_type,
         pl.id AS listing_id, pl.title AS listing_title, pl.address AS listing_address,
         u.full_name AS user_name, u.phone_number AS user_phone,
         u.email AS user_email,
         v.registration_number, v.vehicle_type, v.make, v.model, v.color
       FROM bookings b
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       JOIN users u ON b.user_id = u.id
       JOIN vehicles v ON b.vehicle_id = v.id
       WHERE pl.owner_id = $1${statusFilter}${listingFilter}
       ORDER BY b.booking_start_date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM bookings b
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       WHERE pl.owner_id = $1${statusFilter}${listingFilter}`,
      params
    ),
  ]);

  return {
    bookings: bookingsResult.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  };
}

export async function getPayoutHistory(
  ownerId: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const [payoutsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT
         oe.id, oe.gross_amount, oe.commission_amount, oe.net_amount,
         oe.status, oe.transaction_date, oe.created_at,
         pl.title AS listing_title,
         b.booking_start_date, b.booking_end_date, b.duration_type,
         u.full_name AS user_name
       FROM owner_earnings oe
       JOIN bookings b ON oe.booking_id = b.id
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       JOIN users u ON b.user_id = u.id
       WHERE oe.owner_id = $1
       ORDER BY oe.created_at DESC
       LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset]
    ),
    pool.query("SELECT COUNT(*) FROM owner_earnings WHERE owner_id = $1", [ownerId]),
  ]);

  return {
    payouts: payoutsResult.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  };
}

export async function getMonthlyEarnings(ownerId: string, months: number = 12) {
  const result = await pool.query(
    `SELECT
       DATE_TRUNC('month', oe.created_at)::DATE AS month,
       COUNT(DISTINCT oe.booking_id) AS transactions,
       COALESCE(SUM(oe.gross_amount), 0) AS gross_amount,
       COALESCE(SUM(oe.commission_amount), 0) AS commission,
       COALESCE(SUM(oe.net_amount), 0) AS net_amount,
       COUNT(*) FILTER (WHERE oe.status = 'paid') AS paid_count,
       COUNT(*) FILTER (WHERE oe.status = 'pending') AS pending_count
     FROM owner_earnings oe
     WHERE oe.owner_id = $1
       AND oe.created_at >= NOW() - ($2 || ' months')::INTERVAL
     GROUP BY DATE_TRUNC('month', oe.created_at)
     ORDER BY month DESC`,
    [ownerId, months]
  );
  return result.rows;
}

function maskAccountNumber(acc: string | null): string | null {
  if (!acc) return null;
  return acc.length <= 4 ? acc : `••••${acc.slice(-4)}`;
}

function verificationStatus(verified: boolean, submittedAt: Date | null, rejectedReason: string | null): "unsubmitted" | "pending" | "verified" | "rejected" {
  if (verified) return "verified";
  if (rejectedReason) return "rejected";
  if (submittedAt) return "pending";
  return "unsubmitted";
}

export async function getOwnerSettings(ownerId: string) {
  const result = await pool.query(
    `SELECT
       u.id, u.email, u.full_name, u.phone_number, u.profile_picture, u.is_email_verified,
       os.requires_listing_approval, os.listing_approval_status,
       os.kyc_verified, os.bank_account_verified,
       os.kyc_document_url, os.kyc_document_type, os.kyc_submitted_at, os.kyc_rejected_reason,
       os.bank_account_number, os.bank_ifsc, os.bank_account_holder_name,
       os.bank_submitted_at, os.bank_rejected_reason,
       os.updated_at AS settings_updated_at
     FROM users u
     LEFT JOIN owner_settings os ON u.id = os.owner_id
     WHERE u.id = $1`,
    [ownerId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    ...row,
    bank_account_number: maskAccountNumber(row.bank_account_number),
    kyc_status: verificationStatus(row.kyc_verified, row.kyc_submitted_at, row.kyc_rejected_reason),
    bank_status: verificationStatus(row.bank_account_verified, row.bank_submitted_at, row.bank_rejected_reason),
  };
}

export async function submitKyc(ownerId: string, data: { documentUrl: string; documentType: string }) {
  const result = await pool.query(
    `UPDATE owner_settings
     SET kyc_document_url = $1, kyc_document_type = $2, kyc_submitted_at = NOW(),
         kyc_verified = false, kyc_rejected_reason = NULL, updated_at = NOW()
     WHERE owner_id = $3
     RETURNING owner_id`,
    [data.documentUrl, data.documentType, ownerId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Owner settings not found"), { status: 404 });
  const owner = await pool.query("SELECT full_name FROM users WHERE id = $1", [ownerId]);
  await notifyAdmins(
    "kyc_bank_submitted", "KYC submitted for review",
    `${owner.rows[0]?.full_name ?? "An owner"} submitted a KYC document for verification.`, "/admin/owners"
  );
  return getOwnerSettings(ownerId);
}

export async function submitBankDetails(
  ownerId: string,
  data: { accountNumber: string; ifsc: string; accountHolderName: string }
) {
  const result = await pool.query(
    `UPDATE owner_settings
     SET bank_account_number = $1, bank_ifsc = $2, bank_account_holder_name = $3,
         bank_submitted_at = NOW(), bank_account_verified = false, bank_rejected_reason = NULL,
         updated_at = NOW()
     WHERE owner_id = $4
     RETURNING owner_id`,
    [data.accountNumber, data.ifsc.toUpperCase(), data.accountHolderName, ownerId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Owner settings not found"), { status: 404 });
  const owner = await pool.query("SELECT full_name FROM users WHERE id = $1", [ownerId]);
  await notifyAdmins(
    "kyc_bank_submitted", "Bank details submitted for review",
    `${owner.rows[0]?.full_name ?? "An owner"} submitted bank account details for verification.`, "/admin/owners"
  );
  return getOwnerSettings(ownerId);
}

export async function updateOwnerSettings(
  ownerId: string,
  data: { fullName?: string; phoneNumber?: string; profilePicture?: string; requiresListingApproval?: boolean }
) {
  const { fullName, phoneNumber, profilePicture, requiresListingApproval } = data;

  if (fullName !== undefined || phoneNumber !== undefined || profilePicture !== undefined) {
    await pool.query(
      `UPDATE users
       SET full_name = COALESCE($1, full_name),
           phone_number = COALESCE($2, phone_number),
           profile_picture = COALESCE($3, profile_picture),
           updated_at = NOW()
       WHERE id = $4`,
      [fullName ?? null, phoneNumber ?? null, profilePicture ?? null, ownerId]
    );
  }

  if (requiresListingApproval !== undefined) {
    await pool.query(
      `UPDATE owner_settings
       SET requires_listing_approval = $1, updated_at = NOW()
       WHERE owner_id = $2`,
      [requiresListingApproval, ownerId]
    );
  }

  return getOwnerSettings(ownerId);
}

// --- Reviews received (Owner > Reviews) ---
// Reviews had no owner-facing surface at all - owners couldn't see reviews
// on their own listings, let alone respond to one.

export async function getOwnerReviews(ownerId: string, filters: { page: number; limit: number }) {
  const { page, limit } = filters;
  const offset = (page - 1) * limit;

  const [rows, count, stats] = await Promise.all([
    pool.query(
      `SELECT r.id, r.rating, r.review_text, r.cleanliness_rating, r.security_rating,
              r.accessibility_rating, r.is_verified_booking, r.owner_reply, r.owner_replied_at, r.created_at,
              u.full_name AS reviewer_name,
              pl.id AS listing_id, pl.title AS listing_title
       FROM reviews r
       JOIN parking_listings pl ON pl.id = r.parking_listing_id
       JOIN users u ON u.id = r.reviewer_id
       WHERE pl.owner_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [ownerId, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM reviews r
       JOIN parking_listings pl ON pl.id = r.parking_listing_id
       WHERE pl.owner_id = $1`,
      [ownerId]
    ),
    pool.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(AVG(r.rating), 0) AS average_rating,
         COUNT(*) FILTER (WHERE r.owner_reply IS NULL) AS unreplied
       FROM reviews r
       JOIN parking_listings pl ON pl.id = r.parking_listing_id
       WHERE pl.owner_id = $1`,
      [ownerId]
    ),
  ]);

  const s = stats.rows[0];
  return {
    reviews: rows.rows,
    total: parseInt(count.rows[0].count),
    stats: {
      total: parseInt(s.total),
      averageRating: parseFloat(s.average_rating),
      unreplied: parseInt(s.unreplied),
    },
  };
}

export async function replyToReview(reviewId: string, ownerId: string, reply: string) {
  const result = await pool.query(
    `UPDATE reviews r
     SET owner_reply = $1, owner_replied_at = NOW(), updated_at = NOW()
     FROM parking_listings pl
     WHERE r.id = $2 AND r.parking_listing_id = pl.id AND pl.owner_id = $3
     RETURNING r.id, r.reviewer_id, pl.id AS listing_id, pl.title AS listing_title`,
    [reply, reviewId, ownerId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Review not found"), { status: 404 });
  const r = result.rows[0];
  await createNotification(
    r.reviewer_id, "review_replied", "Owner replied to your review",
    `The owner of "${r.listing_title}" replied to your review.`, `/parking/${r.listing_id}`
  );
}

export async function getOwnerSubscription(ownerId: string) {
  const result = await pool.query(
    `SELECT
       us.id, us.status, us.start_date, us.end_date, us.is_auto_renew,
       sp.name AS plan_name, sp.price, sp.max_listings, sp.features, sp.billing_cycle
     FROM user_subscriptions us
     JOIN subscription_plans sp ON us.plan_id = sp.id
     WHERE us.owner_id = $1 AND us.status = 'active'
     ORDER BY us.created_at DESC
     LIMIT 1`,
    [ownerId]
  );
  return result.rows[0] || null;
}
