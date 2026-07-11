import crypto from "crypto";
import pool from "../../config/database";
import razorpay from "../../config/razorpay";
import * as bookingsService from "../bookings/bookings.service";
import { normalizeRazorpayError } from "../../lib/razorpayError";

export async function createOrder(bookingId: string, userId: string) {
  const result = await pool.query(
    "SELECT id, user_id, status, total_price FROM bookings WHERE id = $1",
    [bookingId]
  );
  const booking = result.rows[0];
  if (!booking) throw Object.assign(new Error("Booking not found"), { status: 404 });
  if (booking.user_id !== userId) throw Object.assign(new Error("Not authorized"), { status: 403 });
  if (booking.status !== "pending") throw Object.assign(new Error("Only pending bookings can be paid"), { status: 400 });

  // total_price comes back from pg as a string (DECIMAL column) - must
  // Number() it before converting to paise or the multiplication concatenates.
  const amountPaise = Math.round(Number(booking.total_price) * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt: bookingId,
  }).catch((err) => { throw normalizeRazorpayError(err); });

  await pool.query("UPDATE bookings SET razorpay_order_id = $1, updated_at = NOW() WHERE id = $2", [order.id, bookingId]);

  return {
    orderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

export async function verifyAndConfirm(
  bookingId: string,
  userId: string,
  data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expected !== razorpay_signature) {
    throw Object.assign(new Error("Payment verification failed"), { status: 400 });
  }

  await pool.query("UPDATE bookings SET razorpay_signature = $1 WHERE id = $2", [razorpay_signature, bookingId]);

  return bookingsService.confirmBooking(bookingId, userId, razorpay_payment_id);
}

// Resilience net for a user closing the tab right after paying but before the
// client-side verify call completes - confirmBooking() already throws if the
// booking isn't 'pending', so a webhook arriving after verifyAndConfirm
// already ran is a harmless no-op, not a double-confirm.
export async function handleWebhook(rawBody: Buffer, signatureHeader: string | undefined) {
  if (!signatureHeader) throw Object.assign(new Error("Missing signature"), { status: 400 });

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (expected !== signatureHeader) {
    throw Object.assign(new Error("Invalid webhook signature"), { status: 400 });
  }

  const event = JSON.parse(rawBody.toString("utf8"));

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    // Looked up by the order ID we stored ourselves in createOrder(), rather
    // than trusting a receipt/notes field on the webhook payload - guaranteed
    // to resolve to the right booking since we're the ones who set it.
    const booking = await pool.query(
      "SELECT id, user_id, status FROM bookings WHERE razorpay_order_id = $1",
      [payment?.order_id]
    );
    if (booking.rows[0] && booking.rows[0].status === "pending") {
      await bookingsService.confirmBooking(booking.rows[0].id, booking.rows[0].user_id, payment.id);
    }
  }
}
