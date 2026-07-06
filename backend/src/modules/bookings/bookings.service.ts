import pool from "../../config/database";
import { generateBookingId, generateEarningId } from "../../utils/ulid";
import { createNotification } from "../notifications/notifications.service";
import { sendEmail } from "../../utils/email";

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function sendBookingConfirmationEmail(bookingId: string) {
  const result = await pool.query(
    `SELECT b.booking_start_date, b.booking_end_date, b.total_price,
            u.email, u.full_name,
            pl.title AS listing_title, pl.address AS listing_address
     FROM bookings b
     JOIN users u ON u.id = b.user_id
     JOIN parking_listings pl ON pl.id = b.parking_listing_id
     WHERE b.id = $1`,
    [bookingId]
  );
  const b = result.rows[0];
  if (!b) return;

  const period = `${fmtDate(b.booking_start_date)} - ${fmtDate(b.booking_end_date)}`;
  await sendEmail({
    to: b.email,
    subject: `Booking confirmed: ${b.listing_title}`,
    text: `Hi ${b.full_name},\n\nYour booking at "${b.listing_title}" (${b.listing_address}) is confirmed for ${period}.\nTotal paid: Rs. ${Number(b.total_price).toLocaleString("en-IN")}\n\nYou can view your booking and download a receipt any time from My Bookings.`,
    html: `<p>Hi ${b.full_name},</p><p>Your booking at <strong>${b.listing_title}</strong> (${b.listing_address}) is confirmed for <strong>${period}</strong>.</p><p>Total paid: <strong>Rs. ${Number(b.total_price).toLocaleString("en-IN")}</strong></p><p>You can view your booking and download a receipt any time from My Bookings.</p>`,
  });
}

export async function checkAvailability(listingId: string, start: Date, end: Date) {
  const [result, blackout] = await Promise.all([
    pool.query(
      `SELECT
         pl.total_spaces,
         COUNT(b.id) AS active_bookings
       FROM parking_listings pl
       LEFT JOIN bookings b ON b.parking_listing_id = pl.id
         AND b.status IN ('pending','confirmed')
         AND b.booking_start_date < $2
         AND b.booking_end_date > $1
       WHERE pl.id = $3 AND pl.is_active = true
       GROUP BY pl.total_spaces`,
      [start, end, listingId]
    ),
    pool.query(
      `SELECT 1 FROM parking_blackout_dates
       WHERE parking_listing_id = $1 AND start_date <= $3::date AND end_date >= $2::date
       LIMIT 1`,
      [listingId, start, end]
    ),
  ]);

  if (!result.rows[0]) {
    return { isAvailable: false, availableSpaces: 0, totalSpaces: 0, message: "Listing not found or inactive" };
  }

  const { total_spaces, active_bookings } = result.rows[0];

  if (blackout.rows[0]) {
    return { isAvailable: false, availableSpaces: 0, totalSpaces: total_spaces, message: "Not available for the selected dates - blocked by the owner" };
  }

  const available = total_spaces - parseInt(active_bookings);
  return {
    isAvailable: available > 0,
    availableSpaces: available,
    totalSpaces: total_spaces,
    message: available > 0 ? `${available} space${available === 1 ? "" : "s"} available` : "No spaces available for selected dates",
  };
}

async function getCommissionRate(): Promise<number> {
  const result = await pool.query(`SELECT commission_rate FROM platform_settings WHERE id = 1`);
  return result.rows[0] ? parseFloat(result.rows[0].commission_rate) / 100 : 0.1;
}

function calcPricing(listing: any, durationDays: number, commissionRate: number) {
  let totalPrice = 0;
  let durationType = "day";
  const breakdown: Record<string, any> = {};

  if (durationDays >= 30 && listing.price_per_month) {
    const months = Math.floor(durationDays / 30);
    const monthTotal = listing.price_per_month * months;
    totalPrice += monthTotal;
    breakdown.months = { count: months, priceEach: listing.price_per_month, total: monthTotal };
    durationType = "month";
    const remainingDays = durationDays % 30;
    if (remainingDays > 0 && listing.price_per_day) {
      const dayTotal = listing.price_per_day * remainingDays;
      totalPrice += dayTotal;
      breakdown.remainingDays = { count: remainingDays, priceEach: listing.price_per_day, total: dayTotal };
    }
  } else if (durationDays >= 7 && listing.price_per_week) {
    const weeks = Math.floor(durationDays / 7);
    const weekTotal = listing.price_per_week * weeks;
    totalPrice += weekTotal;
    breakdown.weeks = { count: weeks, priceEach: listing.price_per_week, total: weekTotal };
    durationType = "week";
    const remainingDays = durationDays % 7;
    if (remainingDays > 0 && listing.price_per_day) {
      const dayTotal = listing.price_per_day * remainingDays;
      totalPrice += dayTotal;
      breakdown.remainingDays = { count: remainingDays, priceEach: listing.price_per_day, total: dayTotal };
    }
  } else {
    const dayTotal = (listing.price_per_day || 0) * durationDays;
    totalPrice += dayTotal;
    breakdown.days = { count: durationDays, priceEach: listing.price_per_day, total: dayTotal };
    durationType = "day";
  }

  const commission = parseFloat((totalPrice * commissionRate).toFixed(2));
  const ownerPayout = parseFloat((totalPrice - commission).toFixed(2));
  return { totalPrice, commission, ownerPayout, durationType, breakdown };
}

export async function getPricingEstimate(listingId: string, startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) throw Object.assign(new Error("End date must be after start date"), { status: 400 });

  const result = await pool.query(
    "SELECT id, title, price_per_month, price_per_week, price_per_day FROM parking_listings WHERE id = $1 AND is_active = true",
    [listingId]
  );
  if (!result.rows[0]) throw Object.assign(new Error("Listing not found"), { status: 404 });

  const listing = result.rows[0];
  const durationDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const commissionRate = await getCommissionRate();
  const { totalPrice, commission, ownerPayout, breakdown } = calcPricing(listing, durationDays, commissionRate);

  return {
    listingId,
    listingTitle: listing.title,
    startDate,
    endDate,
    durationDays,
    priceBreakdown: breakdown,
    subtotal: totalPrice,
    platformCommission: commission,
    totalPrice,
    ownerPayout,
  };
}

export async function createBooking(
  userId: string,
  data: { listingId: string; vehicleId: string; startDate: string; endDate: string }
) {
  const { listingId, vehicleId, startDate, endDate } = data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start >= end) throw Object.assign(new Error("End date must be after start date"), { status: 400 });
  if (start < new Date()) throw Object.assign(new Error("Start date cannot be in the past"), { status: 400 });

  const [vehicleCheck, listingCheck] = await Promise.all([
    pool.query("SELECT id FROM vehicles WHERE id = $1 AND user_id = $2 AND is_active = true", [vehicleId, userId]),
    pool.query(
      "SELECT id, owner_id, title, price_per_month, price_per_week, price_per_day FROM parking_listings WHERE id = $1 AND is_active = true AND is_approved = true",
      [listingId]
    ),
  ]);

  if (!vehicleCheck.rows[0]) throw Object.assign(new Error("Vehicle not found or not yours"), { status: 404 });
  if (!listingCheck.rows[0]) throw Object.assign(new Error("Listing not found or not approved"), { status: 404 });

  const listing = listingCheck.rows[0];

  const avail = await checkAvailability(listingId, start, end);
  if (!avail.isAvailable) throw Object.assign(new Error(avail.message!), { status: 409 });

  const durationDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const commissionRate = await getCommissionRate();
  const { totalPrice, commission, ownerPayout, durationType } = calcPricing(listing, durationDays, commissionRate);

  const bookingId = generateBookingId();
  const result = await pool.query(
    `INSERT INTO bookings
       (id, user_id, parking_listing_id, vehicle_id, booking_start_date, booking_end_date,
        duration_days, duration_type, total_price, platform_commission, owner_payout, status, payment_status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending','pending')
     RETURNING *`,
    [bookingId, userId, listingId, vehicleId, start, end, durationDays, durationType, totalPrice, commission, ownerPayout]
  );

  await createNotification(
    listing.owner_id, "new_booking", "New booking received",
    `You have a new booking request for "${listing.title}".`, "/owner/bookings"
  );

  return result.rows[0];
}

export async function confirmBooking(bookingId: string, userId: string, razorpayPaymentId?: string) {
  const check = await pool.query(
    "SELECT id, user_id, status, parking_listing_id, total_price, platform_commission, owner_payout FROM bookings WHERE id = $1",
    [bookingId]
  );
  if (!check.rows[0]) throw Object.assign(new Error("Booking not found"), { status: 404 });

  const booking = check.rows[0];
  if (booking.user_id !== userId) throw Object.assign(new Error("Not authorized"), { status: 403 });
  if (booking.status !== "pending") throw Object.assign(new Error("Only pending bookings can be confirmed"), { status: 400 });

  const ownerResult = await pool.query("SELECT owner_id FROM parking_listings WHERE id = $1", [booking.parking_listing_id]);
  const ownerId = ownerResult.rows[0]?.owner_id;

  const updated = await pool.query(
    `UPDATE bookings
     SET status = 'confirmed', payment_status = 'completed',
         razorpay_payment_id = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [razorpayPaymentId || null, bookingId]
  );

  if (ownerId) {
    await pool.query(
      `INSERT INTO owner_earnings (id, owner_id, booking_id, gross_amount, commission_amount, net_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,'pending')
       ON CONFLICT DO NOTHING`,
      [generateEarningId(), ownerId, bookingId, booking.total_price, booking.platform_commission, booking.owner_payout]
    );
  }

  try {
    await sendBookingConfirmationEmail(bookingId);
  } catch {
    // Booking confirmation must succeed regardless of email delivery - the
    // in-app notification and My Bookings page are the source of truth.
  }

  return updated.rows[0];
}

export async function completeBooking(bookingId: string) {
  const result = await pool.query(
    `UPDATE bookings
     SET status = 'completed', updated_at = NOW()
     WHERE id = $1 AND status = 'confirmed' AND booking_end_date <= CURRENT_DATE
     RETURNING *`,
    [bookingId]
  );
  if (!result.rows[0]) throw Object.assign(new Error("Booking not found or not yet past end date"), { status: 400 });
  return result.rows[0];
}

export async function getBookingDetails(bookingId: string) {
  const result = await pool.query(
    `SELECT
       b.*,
       pl.title AS listing_title, pl.address, pl.latitude, pl.longitude,
       pl.has_cctv, pl.has_security_guard, pl.access_type,
       pt.name AS parking_type,
       owner.full_name AS owner_name, owner.phone_number AS owner_phone, owner.email AS owner_email,
       usr.full_name AS user_name, usr.email AS user_email,
       v.registration_number, v.vehicle_type, v.make, v.model, v.color,
       r.id AS review_id, r.rating AS review_rating, r.review_text,
       json_agg(DISTINCT jsonb_build_object('id', pli.id, 'url', pli.cloudinary_url, 'order', pli.display_order))
         FILTER (WHERE pli.id IS NOT NULL) AS images,
       json_agg(DISTINCT a.name) FILTER (WHERE a.id IS NOT NULL) AS amenities
     FROM bookings b
     JOIN parking_listings pl ON b.parking_listing_id = pl.id
     JOIN parking_types pt ON pl.parking_type_id = pt.id
     JOIN users owner ON pl.owner_id = owner.id
     JOIN users usr ON b.user_id = usr.id
     JOIN vehicles v ON b.vehicle_id = v.id
     LEFT JOIN reviews r ON r.booking_id = b.id
     LEFT JOIN parking_listing_images pli ON pli.parking_listing_id = pl.id
     LEFT JOIN parking_listing_amenities pla ON pla.parking_listing_id = pl.id
     LEFT JOIN amenities a ON pla.amenity_id = a.id
     WHERE b.id = $1
     GROUP BY b.id, pl.id, pt.id, owner.id, usr.id, v.id, r.id`,
    [bookingId]
  );
  return result.rows[0] || null;
}

export async function getBookingHistory(filters: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}) {
  const { status, startDate, endDate, page, limit } = filters;
  const offset = (page - 1) * limit;
  const params: unknown[] = [];
  let where = "1=1";

  if (status) { where += ` AND b.status = $${params.length + 1}`; params.push(status); }
  if (startDate) { where += ` AND b.booking_start_date >= $${params.length + 1}`; params.push(startDate); }
  if (endDate) { where += ` AND b.booking_end_date <= $${params.length + 1}`; params.push(endDate); }

  const result = await pool.query(
    `SELECT
       b.id, b.status, b.payment_status, b.total_price,
       b.booking_start_date, b.booking_end_date, b.duration_days, b.duration_type, b.created_at,
       pl.title AS listing_title, pl.address,
       usr.full_name AS user_name, usr.email AS user_email
     FROM bookings b
     JOIN parking_listings pl ON b.parking_listing_id = pl.id
     JOIN users usr ON b.user_id = usr.id
     WHERE ${where}
     ORDER BY b.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM bookings b WHERE ${where}`,
    params
  );

  return { bookings: result.rows, total: parseInt(countResult.rows[0].count), page, limit };
}
