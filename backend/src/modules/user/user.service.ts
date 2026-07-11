import pool from "../../config/database";
import { generateVehicleId, generateReviewId } from "../../utils/ulid";
import { VehicleRow } from "../../types";
import { notifyAdmins, createNotification } from "../notifications/notifications.service";
import razorpay from "../../config/razorpay";
import { normalizeRazorpayError } from "../../lib/razorpayError";

export async function getUserBookings(
  userId: string,
  status?: string,
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;
  const params: unknown[] = [userId];

  let where = "b.user_id = $1";
  if (status) {
    where += ` AND b.status = $${params.length + 1}`;
    params.push(status);
  }

  const result = await pool.query(
    `SELECT
       b.id, b.status, b.payment_status, b.total_price,
       b.booking_start_date, b.booking_end_date,
       b.duration_days, b.duration_type,
       pl.id AS listing_id, pl.title AS listing_title,
       pl.address AS listing_address, pl.latitude, pl.longitude,
       v.registration_number, v.make, v.model, v.color,
       u.full_name AS owner_name, u.phone_number AS owner_phone,
       r.id AS review_id, r.rating AS review_rating
     FROM bookings b
     JOIN parking_listings pl ON b.parking_listing_id = pl.id
     JOIN vehicles v ON b.vehicle_id = v.id
     JOIN users u ON pl.owner_id = u.id
     LEFT JOIN reviews r ON r.booking_id = b.id
     WHERE ${where}
     ORDER BY b.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM bookings b WHERE ${where}`,
    params
  );

  return {
    bookings: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  };
}

export async function getUserVehicles(userId: string) {
  const result = await pool.query<VehicleRow>(
    `SELECT * FROM vehicles
     WHERE user_id = $1 AND is_active = true
     ORDER BY is_primary DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addVehicle(
  userId: string,
  data: {
    vehicleType: string;
    registrationNumber: string;
    make?: string;
    model?: string;
    color?: string;
    yearManufactured?: number;
    isPrimary?: boolean;
  }
) {
  const id = generateVehicleId();

  if (data.isPrimary) {
    await pool.query(
      "UPDATE vehicles SET is_primary = false WHERE user_id = $1",
      [userId]
    );
  }

  const result = await pool.query<VehicleRow>(
    `INSERT INTO vehicles
       (id, user_id, vehicle_type, registration_number, make, model, color, year_manufactured, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      id, userId,
      data.vehicleType, data.registrationNumber,
      data.make || null, data.model || null,
      data.color || null, data.yearManufactured || null,
      data.isPrimary || false,
    ]
  );
  return result.rows[0]!;
}

export async function deleteVehicle(vehicleId: string, userId: string) {
  const check = await pool.query(
    "SELECT user_id FROM vehicles WHERE id = $1 AND is_active = true",
    [vehicleId]
  );
  if (!check.rows[0]) {
    throw Object.assign(new Error("Vehicle not found"), { status: 404 });
  }
  if (check.rows[0].user_id !== userId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }
  await pool.query(
    "UPDATE vehicles SET is_active = false WHERE id = $1",
    [vehicleId]
  );
}

export async function getDashboard(userId: string) {
  const [statsResult, vehiclesResult, activeBookingsResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(DISTINCT b.id) AS total_bookings,
         COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('pending','confirmed')) AS active_bookings,
         COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') AS completed_bookings,
         COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'cancelled') AS cancelled_bookings,
         COALESCE(SUM(b.total_price) FILTER (WHERE b.payment_status = 'completed'), 0) AS total_spent,
         COUNT(DISTINCT r.id) AS reviews_written
       FROM users u
       LEFT JOIN bookings b ON b.user_id = u.id
       LEFT JOIN reviews r ON r.reviewer_id = u.id
       WHERE u.id = $1`,
      [userId]
    ),
    pool.query(
      "SELECT COUNT(*) AS total FROM vehicles WHERE user_id = $1 AND is_active = true",
      [userId]
    ),
    pool.query(
      `SELECT
         b.id, b.status, b.total_price, b.booking_start_date, b.booking_end_date,
         pl.title AS listing_title, pl.address
       FROM bookings b
       JOIN parking_listings pl ON b.parking_listing_id = pl.id
       WHERE b.user_id = $1 AND b.status IN ('pending','confirmed')
       ORDER BY b.booking_start_date ASC
       LIMIT 5`,
      [userId]
    ),
  ]);

  const s = statsResult.rows[0];
  return {
    totalBookings: parseInt(s.total_bookings),
    activeBookings: parseInt(s.active_bookings),
    completedBookings: parseInt(s.completed_bookings),
    cancelledBookings: parseInt(s.cancelled_bookings),
    totalSpent: parseFloat(s.total_spent),
    reviewsWritten: parseInt(s.reviews_written),
    totalVehicles: parseInt(vehiclesResult.rows[0].total),
    upcomingBookings: activeBookingsResult.rows,
  };
}

export async function getBookingById(bookingId: string, userId: string) {
  const result = await pool.query(
    `SELECT
       b.id, b.status, b.payment_status, b.total_price,
       b.booking_start_date, b.booking_end_date,
       b.duration_days, b.duration_type, b.created_at,
       pl.id AS listing_id, pl.title AS listing_title,
       pl.address, pl.latitude, pl.longitude,
       pl.price_per_month, pl.price_per_week, pl.price_per_day,
       pl.has_cctv, pl.has_security_guard, pl.access_type,
       pt.name AS parking_type,
       u.full_name AS owner_name, u.phone_number AS owner_phone, u.email AS owner_email,
       v.registration_number, v.vehicle_type, v.make, v.model, v.color,
       r.id AS review_id, r.rating AS review_rating, r.review_text,
       json_agg(DISTINCT jsonb_build_object('id', pli.id, 'url', pli.cloudinary_url, 'order', pli.display_order))
         FILTER (WHERE pli.id IS NOT NULL) AS images,
       json_agg(DISTINCT a.name) FILTER (WHERE a.id IS NOT NULL) AS amenities
     FROM bookings b
     JOIN parking_listings pl ON b.parking_listing_id = pl.id
     JOIN parking_types pt ON pl.parking_type_id = pt.id
     JOIN users u ON pl.owner_id = u.id
     JOIN vehicles v ON b.vehicle_id = v.id
     LEFT JOIN reviews r ON r.booking_id = b.id
     LEFT JOIN parking_listing_images pli ON pli.parking_listing_id = pl.id
     LEFT JOIN parking_listing_amenities pla ON pla.parking_listing_id = pl.id
     LEFT JOIN amenities a ON pla.amenity_id = a.id
     WHERE b.id = $1 AND b.user_id = $2
     GROUP BY b.id, pl.id, pt.id, u.id, v.id, r.id`,
    [bookingId, userId]
  );
  return result.rows[0] || null;
}

export async function cancelBooking(bookingId: string, userId: string) {
  const check = await pool.query(
    `SELECT b.user_id, b.status, b.booking_start_date, b.total_price, b.razorpay_payment_id,
            pl.owner_id, pl.title AS listing_title
     FROM bookings b
     JOIN parking_listings pl ON pl.id = b.parking_listing_id
     WHERE b.id = $1`,
    [bookingId]
  );
  if (!check.rows[0]) {
    throw Object.assign(new Error("Booking not found"), { status: 404 });
  }
  if (check.rows[0].user_id !== userId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }
  const { status, booking_start_date, total_price, razorpay_payment_id, owner_id, listing_title } = check.rows[0];
  if (status !== "pending" && status !== "confirmed") {
    throw Object.assign(new Error("Only pending or confirmed bookings can be cancelled"), { status: 400 });
  }
  // Cutoff is the booking's own start time, not an arbitrary buffer - once
  // that's passed the driver is presumed to already be parked there.
  const hoursUntilStart = (new Date(booking_start_date).getTime() - Date.now()) / 3600000;
  if (hoursUntilStart < 0) {
    throw Object.assign(new Error("This booking has already started and can no longer be cancelled"), { status: 400 });
  }

  let refundId: string | null = null;
  let refundStatus: string | null = null;
  if (status === "confirmed" && razorpay_payment_id) {
    const refund = await razorpay.payments.refund(razorpay_payment_id, {
      amount: Math.round(Number(total_price) * 100),
    }).catch((err) => { throw normalizeRazorpayError(err); });
    refundId = refund.id;
    refundStatus = refund.status;
  }

  const result = await pool.query(
    `UPDATE bookings
     SET status = 'cancelled', updated_at = NOW(),
         payment_status = CASE WHEN $2::text IS NOT NULL THEN 'refunded' ELSE payment_status END,
         refund_id = $2, refund_status = $3
     WHERE id = $1
     RETURNING *`,
    [bookingId, refundId, refundStatus]
  );

  // Voided, not deleted, so the owner's earnings history still shows what happened.
  await pool.query(
    "UPDATE owner_earnings SET status = 'cancelled', updated_at = NOW() WHERE booking_id = $1 AND status = 'pending'",
    [bookingId]
  );

  await createNotification(
    owner_id, "booking_cancelled", "Booking cancelled",
    `A booking for "${listing_title}" was cancelled by the driver.${refundId ? " A refund has been issued." : ""}`,
    "/owner/bookings"
  );

  return result.rows[0];
}

export async function getVehicleById(vehicleId: string, userId: string) {
  const result = await pool.query(
    "SELECT * FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true",
    [vehicleId, userId]
  );
  return result.rows[0] || null;
}

export async function updateVehicle(
  vehicleId: string,
  userId: string,
  data: { color?: string; isPrimary?: boolean }
) {
  const check = await pool.query(
    "SELECT user_id FROM vehicles WHERE id = $1 AND is_active = true",
    [vehicleId]
  );
  if (!check.rows[0]) {
    throw Object.assign(new Error("Vehicle not found"), { status: 404 });
  }
  if (check.rows[0].user_id !== userId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }
  if (data.isPrimary) {
    await pool.query("UPDATE vehicles SET is_primary = false WHERE user_id = $1 AND id != $2", [userId, vehicleId]);
  }
  const result = await pool.query(
    `UPDATE vehicles
     SET color = COALESCE($1, color),
         is_primary = COALESCE($2, is_primary),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [data.color ?? null, data.isPrimary ?? null, vehicleId]
  );
  return result.rows[0];
}

export async function getReviews(userId: string, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  const result = await pool.query(
    `SELECT
       r.id, r.rating, r.review_text, r.cleanliness_rating, r.security_rating,
       r.accessibility_rating, r.created_at,
       pl.title AS listing_title, pl.address,
       b.booking_start_date, b.booking_end_date
     FROM reviews r
     JOIN parking_listings pl ON r.parking_listing_id = pl.id
     JOIN bookings b ON r.booking_id = b.id
     WHERE r.reviewer_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  const countResult = await pool.query(
    "SELECT COUNT(*) FROM reviews WHERE reviewer_id = $1",
    [userId]
  );
  return {
    reviews: result.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    limit,
  };
}

export async function writeReview(
  userId: string,
  bookingId: string,
  data: {
    rating: number;
    reviewText?: string;
    cleanlinessRating?: number;
    securityRating?: number;
    accessibilityRating?: number;
  }
) {
  const bookingCheck = await pool.query(
    "SELECT parking_listing_id, user_id, status FROM bookings WHERE id = $1",
    [bookingId]
  );
  if (!bookingCheck.rows[0]) {
    throw Object.assign(new Error("Booking not found"), { status: 404 });
  }
  if (bookingCheck.rows[0].user_id !== userId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }
  if (bookingCheck.rows[0].status !== "completed") {
    throw Object.assign(new Error("You can only review a completed booking"), { status: 400 });
  }
  const existing = await pool.query("SELECT id FROM reviews WHERE booking_id = $1", [bookingId]);
  if (existing.rows.length > 0) {
    throw Object.assign(new Error("Review already exists for this booking"), { status: 409 });
  }
  const parkingListingId = bookingCheck.rows[0].parking_listing_id;
  const result = await pool.query(
    `INSERT INTO reviews
       (id, parking_listing_id, booking_id, reviewer_id, rating, review_text,
        cleanliness_rating, security_rating, accessibility_rating, is_verified_booking)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
     RETURNING *`,
    [
      generateReviewId(), parkingListingId, bookingId, userId,
      data.rating, data.reviewText ?? null,
      data.cleanlinessRating ?? null, data.securityRating ?? null, data.accessibilityRating ?? null,
    ]
  );
  await pool.query(
    `UPDATE parking_listings
     SET rating = (SELECT AVG(rating) FROM reviews WHERE parking_listing_id = $1),
         review_count = (SELECT COUNT(*) FROM reviews WHERE parking_listing_id = $1),
         updated_at = NOW()
     WHERE id = $1`,
    [parkingListingId]
  );
  return result.rows[0];
}

export async function updateProfile(userId: string, data: { fullName?: string; phoneNumber?: string; profilePicture?: string }) {
  const result = await pool.query(
    `UPDATE users
     SET full_name = COALESCE($1, full_name),
         phone_number = COALESCE($2, phone_number),
         profile_picture = COALESCE($3, profile_picture),
         updated_at = NOW()
     WHERE id = $4
     RETURNING id, email, full_name, phone_number, profile_picture, role, is_email_verified, updated_at`,
    [data.fullName ?? null, data.phoneNumber ?? null, data.profilePicture ?? null, userId]
  );
  if (!result.rows[0]) throw Object.assign(new Error("User not found"), { status: 404 });
  return result.rows[0];
}

export async function getUserProfile(userId: string) {
  const [userResult, statsResult] = await Promise.all([
    pool.query(
      "SELECT id, email, full_name, phone_number, profile_picture, role, is_email_verified, created_at FROM users WHERE id = $1",
      [userId]
    ),
    pool.query(
      `SELECT
         COUNT(*) AS total_bookings,
         COUNT(*) FILTER (WHERE status = 'completed') AS completed_bookings,
         COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
         COALESCE(SUM(total_price) FILTER (WHERE payment_status = 'completed'), 0) AS total_spent
       FROM bookings WHERE user_id = $1`,
      [userId]
    ),
  ]);

  const user = userResult.rows[0];
  if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

  return {
    ...user,
    stats: {
      totalBookings: parseInt(statsResult.rows[0].total_bookings),
      completedBookings: parseInt(statsResult.rows[0].completed_bookings),
      cancelledBookings: parseInt(statsResult.rows[0].cancelled_bookings),
      totalSpent: parseFloat(statsResult.rows[0].total_spent),
    },
  };
}

export async function createSupportTicket(
  userId: string,
  data: { subject: string; message: string; isUrgent?: boolean }
) {
  const result = await pool.query(
    `INSERT INTO support_tickets (id, user_id, subject, message, is_urgent)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
     RETURNING *`,
    [userId, data.subject, data.message, data.isUrgent ?? false]
  );
  const ticket = result.rows[0];

  const submitter = await pool.query("SELECT full_name FROM users WHERE id = $1", [userId]);
  await notifyAdmins(
    "new_support_ticket",
    data.isUrgent ? "New urgent support ticket" : "New support ticket",
    `${submitter.rows[0]?.full_name ?? "A user"} submitted a ${data.subject} ticket.`,
    "/admin/support"
  );

  return ticket;
}

export async function getMySupportTickets(userId: string) {
  const result = await pool.query(
    `SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}
