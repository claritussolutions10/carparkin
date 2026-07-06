import { Router } from "express";
import * as ownerController from "./owner.controller";

const router = Router();

/**
 * @swagger
 * /api/owner/dashboard:
 *   get:
 *     summary: Owner dashboard KPIs
 *     description: Returns listing counts, earnings, active bookings, and 5 most recent bookings
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: object
 *                   properties:
 *                     total: { type: integer }
 *                     active: { type: integer }
 *                     totalSpaces: { type: integer }
 *                     availableSpaces: { type: integer }
 *                 earnings:
 *                   type: object
 *                   properties:
 *                     total: { type: number }
 *                     thisMonth: { type: number }
 *                     totalBookings: { type: integer }
 *                     activeBookings: { type: integer }
 *                 recentBookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 */
router.get("/dashboard", ownerController.getDashboard);

/**
 * @swagger
 * /api/owner/listings:
 *   get:
 *     summary: Owner's listings with booking and review counts
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parkings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ParkingListing'
 */
router.get("/listings", ownerController.getListings);

/**
 * @swagger
 * /api/owner/bookings:
 *   get:
 *     summary: All bookings across owner's listings
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *         description: Filter by booking status
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
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get("/bookings", ownerController.getBookings);

/**
 * @swagger
 * /api/owner/earnings:
 *   get:
 *     summary: Earnings history with summary totals (paginated)
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *                 earnings: { type: array }
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalEarned: { type: number }
 *                     paidAmount: { type: number }
 *                     pendingAmount: { type: number }
 *                     totalTransactions: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get("/earnings", ownerController.getEarnings);

/**
 * @swagger
 * /api/owner/earnings/monthly:
 *   get:
 *     summary: Monthly earnings breakdown (chart data)
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 12 }
 *         description: How many months back to include
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 monthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month: { type: string, format: date }
 *                       transactions: { type: integer }
 *                       gross_amount: { type: number }
 *                       commission: { type: number }
 *                       net_amount: { type: number }
 */
router.get("/earnings/monthly", ownerController.getMonthlyEarnings);

/**
 * @swagger
 * /api/owner/earnings/payouts:
 *   get:
 *     summary: Individual payout transaction history
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *                 payouts: { type: array }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get("/earnings/payouts", ownerController.getPayoutHistory);

/**
 * @swagger
 * /api/owner/subscription:
 *   get:
 *     summary: Active subscription plan details
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     plan_name: { type: string, example: "Gold Tier" }
 *                     price: { type: number, example: 59 }
 *                     max_listings: { type: integer, example: 10 }
 *                     status: { type: string, example: "active" }
 *                     end_date: { type: string, format: date-time }
 *       404:
 *         description: No active subscription
 */
router.get("/subscription", ownerController.getSubscription);

/**
 * @swagger
 * /api/owner/settings:
 *   get:
 *     summary: Owner profile and account settings
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 settings:
 *                   type: object
 *                   properties:
 *                     full_name: { type: string }
 *                     email: { type: string }
 *                     phone_number: { type: string }
 *                     kyc_verified: { type: boolean }
 *                     bank_account_verified: { type: boolean }
 *                     requires_listing_approval: { type: boolean }
 */
router.get("/settings", ownerController.getSettings);

/**
 * @swagger
 * /api/owner/settings:
 *   put:
 *     summary: Update owner profile / preferences
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: "New Name" }
 *               phoneNumber: { type: string, example: "+919999999999" }
 *               requiresListingApproval: { type: boolean, example: false }
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put("/settings", ownerController.updateSettings);

/**
 * @swagger
 * /api/owner/reviews:
 *   get:
 *     summary: Reviews left on the owner's own listings
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Reviews with reply status and aggregate stats
 */
router.get("/reviews", ownerController.getReviews);

/**
 * @swagger
 * /api/owner/reviews/{id}/reply:
 *   patch:
 *     summary: Reply to a review on one of the owner's listings
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reply]
 *             properties:
 *               reply: { type: string }
 *     responses:
 *       200:
 *         description: Reply posted
 *       404:
 *         description: Review not found or not owned by this owner
 */
router.patch("/reviews/:id/reply", ownerController.replyReview);

/**
 * @swagger
 * /api/owner/kyc:
 *   post:
 *     summary: Submit a KYC document for admin review
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [documentUrl, documentType]
 *             properties:
 *               documentUrl: { type: string }
 *               documentType: { type: string, example: "aadhaar" }
 *     responses:
 *       200:
 *         description: Submitted, status reset to pending review
 */
router.post("/kyc", ownerController.submitKyc);

/**
 * @swagger
 * /api/owner/bank-details:
 *   post:
 *     summary: Submit bank account details for admin review
 *     tags: [Owner — Dashboard]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountNumber, ifsc, accountHolderName]
 *             properties:
 *               accountNumber: { type: string }
 *               ifsc: { type: string }
 *               accountHolderName: { type: string }
 *     responses:
 *       200:
 *         description: Submitted, status reset to pending review
 */
router.post("/bank-details", ownerController.submitBankDetails);

export default router;
