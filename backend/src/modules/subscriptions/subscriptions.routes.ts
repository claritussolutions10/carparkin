import { Router } from "express";
import * as subscriptionsController from "./subscriptions.controller";
import { authenticate } from "../../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/subscriptions/plans:
 *   get:
 *     summary: All available subscription plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer, example: 1 }
 *                       name: { type: string, example: "Starter" }
 *                       price: { type: number, example: 29.00 }
 *                       currency: { type: string, example: "USD" }
 *                       max_listings: { type: integer, example: 3 }
 *                       billing_cycle: { type: string, example: "monthly" }
 *                       features: { type: object }
 */
router.get("/plans", subscriptionsController.getPlans);

/**
 * @swagger
 * /api/subscriptions/active:
 *   get:
 *     summary: Get owner's active subscription with days remaining
 *     tags: [Subscriptions]
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
 *                   nullable: true
 *                   properties:
 *                     plan_name: { type: string }
 *                     price: { type: number }
 *                     status: { type: string }
 *                     end_date: { type: string, format: date-time }
 *                     days_remaining: { type: integer }
 */
router.get("/active", authenticate, subscriptionsController.getActiveSubscription);

/**
 * @swagger
 * /api/subscriptions/activate:
 *   post:
 *     summary: Activate or upgrade a subscription plan
 *     description: Deactivates any existing active subscription before activating the new plan
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [planId]
 *             properties:
 *               planId: { type: integer, example: 2, description: "1=Starter, 2=Gold Tier, 3=Enterprise" }
 *               razorpaySubscriptionId: { type: string, description: "Optional — set after Razorpay payment" }
 *     responses:
 *       201:
 *         description: Subscription activated
 *       400:
 *         description: planId is required
 *       404:
 *         description: Plan not found or inactive
 */
router.post("/activate", authenticate, subscriptionsController.activateSubscription);

/**
 * @swagger
 * /api/subscriptions/cancel:
 *   post:
 *     summary: Cancel the active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       404:
 *         description: No active subscription to cancel
 */
router.post("/cancel", authenticate, subscriptionsController.cancelSubscription);

/**
 * @swagger
 * /api/subscriptions/history:
 *   get:
 *     summary: Subscription change history
 *     tags: [Subscriptions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       plan_name: { type: string }
 *                       status: { type: string }
 *                       start_date: { type: string, format: date-time }
 *                       end_date: { type: string, format: date-time }
 */
router.get("/history", authenticate, subscriptionsController.getHistory);

export default router;
