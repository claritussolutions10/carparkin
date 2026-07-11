import { Router } from "express";
import * as bookingsController from "./bookings.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/bookings/check-availability:
 *   get:
 *     summary: Check parking space availability
 *     description: Returns available vs. total spaces for a listing on given dates. No auth required.
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *         example: lst_01arh2xj41rj5ebg7qvc32ey44
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2026-08-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2026-08-31"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAvailable: { type: boolean }
 *                 availableSpaces: { type: integer }
 *                 totalSpaces: { type: integer }
 *                 message: { type: string }
 *       400:
 *         description: Missing required query params
 */
router.get("/check-availability", bookingsController.checkAvailability);

/**
 * @swagger
 * /api/bookings/pricing-estimate:
 *   get:
 *     summary: Price estimate before booking
 *     description: Calculates total price with monthly/weekly/daily breakdown and the platform commission rate configured in Admin > Configuration. No auth required.
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *         example: lst_01arh2xj41rj5ebg7qvc32ey44
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2026-08-01"
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema: { type: string, format: date }
 *         example: "2026-08-31"
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 estimate:
 *                   type: object
 *                   properties:
 *                     listingId: { type: string }
 *                     listingTitle: { type: string }
 *                     durationDays: { type: integer }
 *                     priceBreakdown: { type: object }
 *                     subtotal: { type: number }
 *                     platformCommission: { type: number }
 *                     totalPrice: { type: number }
 *                     ownerPayout: { type: number }
 *       400:
 *         description: Missing params or invalid dates
 *       404:
 *         description: Listing not found
 */
router.get("/pricing-estimate", bookingsController.getPricingEstimate);

/**
 * @swagger
 * /api/bookings/history:
 *   get:
 *     summary: Booking history with filters (admin / analytics)
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, confirmed, completed, cancelled] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bookings: { type: array }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get("/history", bookingsController.getBookingHistory);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking (user only)
 *     description: Creates a pending booking and calculates total price. Call /confirm after payment.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [listingId, vehicleId, startDate, endDate]
 *             properties:
 *               listingId: { type: string, example: lst_01arh2xj41rj5ebg7qvc32ey45 }
 *               vehicleId: { type: string, example: vhc_01arh2xj41rj5ebg7qvc32ey46 }
 *               startDate: { type: string, format: date, example: "2026-08-01" }
 *               endDate: { type: string, format: date, example: "2026-08-31" }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *                 message: { type: string }
 *       400:
 *         description: Invalid dates or start in the past
 *       404:
 *         description: Listing or vehicle not found
 *       409:
 *         description: No spaces available
 */
router.post("/", authenticate, bookingsController.createBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Full booking detail (amenities, images, contacts)
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: bkg_01arh2xj41rj5ebg7qvc32ey48
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 booking:
 *                   $ref: '#/components/schemas/Booking'
 *       404:
 *         description: Booking not found
 */
router.get("/:id", bookingsController.getBookingDetails);

// No public /:id/confirm route - bookingsService.confirmBooking() is only
// ever called after a verified Razorpay payment (POST /api/payments/verify,
// or the payment.captured webhook). A route here would let any authenticated
// user confirm their own pending booking by POSTing an arbitrary payment ID
// with nothing to check it against.

/**
 * @swagger
 * /api/bookings/{id}/complete:
 *   post:
 *     summary: Mark a confirmed booking as completed
 *     description: Only works if booking end date has passed. Typically called by a cron job.
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking marked completed
 *       400:
 *         description: Booking not past end date or not confirmed
 *       404:
 *         description: Booking not found
 */
router.post("/:id/complete", bookingsController.completeBooking);

export default router;
