import { Router } from "express";
import * as paymentController from "./payment.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/payments/test/process:
 *   post:
 *     summary: Process a mock payment [TEST ONLY]
 *     description: |
 *       Simulates payment processing. Always succeeds unless `forceFailure: true` is sent.
 *       In production this will be replaced by a Razorpay order creation + webhook confirmation flow.
 *     tags: [Payments (Test)]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, amount]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 example: bkg_01kw6pakzmx31vtf80sjnmjqv9
 *               amount:
 *                 type: number
 *                 description: Must match booking total_price
 *                 example: 2500
 *               forceFailure:
 *                 type: boolean
 *                 default: false
 *                 description: Set true to simulate a payment failure
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 paymentId: { type: string, example: "pay_test_1719000000000_abc123xyz" }
 *                 status: { type: string, enum: [completed, failed] }
 *                 message: { type: string }
 *                 bookingId: { type: string }
 *                 amount: { type: number }
 *                 testMode: { type: boolean, example: true }
 *       400:
 *         description: Missing fields or booking not in pending state
 *       403:
 *         description: Not your booking
 *       404:
 *         description: Booking not found
 */
router.post("/test/process", authenticate, paymentController.processTestPayment);

/**
 * @swagger
 * /api/payments/test/verify:
 *   post:
 *     summary: Verify a mock payment ID [TEST ONLY]
 *     description: Returns verified=true for any ID starting with pay_test_ or pay_
 *     tags: [Payments (Test)]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentId]
 *             properties:
 *               paymentId:
 *                 type: string
 *                 example: pay_test_1719000000000_abc123xyz
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified: { type: boolean }
 *                 status: { type: string }
 *                 paymentId: { type: string }
 *                 testMode: { type: boolean }
 *       400:
 *         description: paymentId required
 */
router.post("/test/verify", paymentController.verifyTestPayment);

/**
 * @swagger
 * /api/payments/test/{paymentId}:
 *   get:
 *     summary: Get mock payment details [TEST ONLY]
 *     tags: [Payments (Test)]
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *         example: pay_test_1719000000000_abc123xyz
 *       - in: query
 *         name: amount
 *         schema: { type: number }
 *         description: Optional — echoed back in response
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 amount: { type: number }
 *                 currency: { type: string, example: INR }
 *                 status: { type: string }
 *                 testMode: { type: boolean }
 */
router.get("/test/:paymentId", paymentController.getTestPaymentDetails);

export default router;
