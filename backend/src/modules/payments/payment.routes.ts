import { Router } from "express";
import * as paymentController from "./payment.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/payments/orders:
 *   post:
 *     summary: Create a Razorpay order for a pending booking
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: bkg_01kw6pakzmx31vtf80sjnmjqv9
 *     responses:
 *       200:
 *         description: Order created — pass these straight into Razorpay Checkout.js
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orderId: { type: string, example: order_ABC123 }
 *                 amount: { type: integer, description: In paise, example: 250000 }
 *                 currency: { type: string, example: INR }
 *                 keyId: { type: string, example: rzp_test_xxxxxxxxxxxx }
 *       400:
 *         description: Booking is not in pending state
 *       403:
 *         description: Not your booking
 *       404:
 *         description: Booking not found
 */
router.post("/orders", authenticate, paymentController.createOrder);

/**
 * @swagger
 * /api/payments/verify:
 *   post:
 *     summary: Verify a completed Razorpay Checkout payment and confirm the booking
 *     description: Recomputes the HMAC-SHA256 signature server-side — this is the only path that confirms a booking.
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               bookingId: { type: string }
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *     responses:
 *       200:
 *         description: Booking confirmed
 *       400:
 *         description: Signature mismatch — payment could not be verified
 */
router.post("/verify", authenticate, paymentController.verify);

// /webhook is NOT mounted here - it needs a raw (non-JSON-parsed) body for
// HMAC verification, so it's wired directly in app.ts ahead of the global
// express.json() middleware. See app.ts for the route + swagger doc.

export default router;
