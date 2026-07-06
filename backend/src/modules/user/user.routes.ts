import { Router } from "express";
import * as userController from "./user.controller";

const router = Router();

/**
 * @swagger
 * /api/user/dashboard:
 *   get:
 *     summary: User KPI dashboard
 *     description: Active bookings, vehicle count, total spent, upcoming bookings
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     totalBookings: { type: integer }
 *                     activeBookings: { type: integer }
 *                     completedBookings: { type: integer }
 *                     cancelledBookings: { type: integer }
 *                     totalSpent: { type: number }
 *                     reviewsWritten: { type: integer }
 *                     totalVehicles: { type: integer }
 *                     upcomingBookings: { type: array, items: { $ref: '#/components/schemas/Booking' } }
 */
router.get("/dashboard", userController.getDashboard);

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: User profile with booking stats
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         stats:
 *                           type: object
 *                           properties:
 *                             totalBookings: { type: integer }
 *                             completedBookings: { type: integer }
 *                             cancelledBookings: { type: integer }
 *                             totalSpent: { type: number }
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: "John Doe" }
 *               phoneNumber: { type: string, example: "+919876543212" }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.get("/profile", userController.getProfile);
router.put("/profile", userController.updateProfile);

/**
 * @swagger
 * /api/user/vehicles:
 *   get:
 *     summary: List user's vehicles (primary first)
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Vehicle'
 *   post:
 *     summary: Add a new vehicle
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicle_type, registration_number]
 *             properties:
 *               vehicle_type: { type: string, example: car }
 *               registration_number: { type: string, example: "DL-01-AB-9999" }
 *               make: { type: string, example: Toyota }
 *               model: { type: string, example: Camry }
 *               color: { type: string, example: Silver }
 *               year_manufactured: { type: integer, example: 2022 }
 *               is_primary: { type: boolean, example: false }
 *     responses:
 *       201:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicle:
 *                   $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: vehicle_type and registration_number are required
 */
router.get("/vehicles", userController.getVehicles);
router.post("/vehicles", userController.addVehicle);

/**
 * @swagger
 * /api/user/vehicles/{id}:
 *   get:
 *     summary: Get a single vehicle
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: vhc_01arh2xj41rj5ebg7qvc32ey46
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vehicle:
 *                   $ref: '#/components/schemas/Vehicle'
 *       404:
 *         description: Vehicle not found
 *   put:
 *     summary: Update vehicle color or primary flag
 *     tags: [User]
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
 *             properties:
 *               color: { type: string, example: "Red" }
 *               is_primary: { type: boolean, example: true }
 *     responses:
 *       200:
 *         description: Vehicle updated
 *       403:
 *         description: Not your vehicle
 *   delete:
 *     summary: Remove a vehicle (soft delete)
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: vhc_01arh2xj41rj5ebg7qvc32ey46
 *     responses:
 *       200:
 *         description: Vehicle removed
 *       403:
 *         description: Not your vehicle
 *       404:
 *         description: Not found
 */
router.get("/vehicles/:id", userController.getVehicleById);
router.put("/vehicles/:id", userController.updateVehicle);
router.delete("/vehicles/:id", userController.removeVehicle);

/**
 * @swagger
 * /api/user/bookings:
 *   get:
 *     summary: User's bookings with listing, vehicle, and owner details
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
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
router.get("/bookings", userController.getBookings);

/**
 * @swagger
 * /api/user/bookings/{id}:
 *   get:
 *     summary: Full booking detail with parking images and amenities
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
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
 *   delete:
 *     summary: Cancel a booking (24h+ before start)
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Booking cancelled
 *       400:
 *         description: Cannot cancel (wrong status or too close to start)
 *       403:
 *         description: Not your booking
 *       404:
 *         description: Booking not found
 */
router.get("/bookings/:id", userController.getBookingById);
router.delete("/bookings/:id", userController.cancelBooking);

/**
 * @swagger
 * /api/user/reviews:
 *   get:
 *     summary: Reviews written by this user
 *     tags: [User]
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
 *                 reviews: { type: array }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 */
router.get("/reviews", userController.getReviews);

/**
 * @swagger
 * /api/user/reviews/{bookingId}:
 *   post:
 *     summary: Write a review for a booking
 *     tags: [User]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema: { type: string }
 *         example: bkg_01arh2xj41rj5ebg7qvc32ey48
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               reviewText: { type: string, example: "Great parking spot!" }
 *               cleanlinessRating: { type: integer, minimum: 1, maximum: 5 }
 *               securityRating: { type: integer, minimum: 1, maximum: 5 }
 *               accessibilityRating: { type: integer, minimum: 1, maximum: 5 }
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Invalid rating
 *       403:
 *         description: Not your booking
 *       404:
 *         description: Booking not found
 *       409:
 *         description: Review already exists for this booking
 */
router.post("/reviews/:bookingId", userController.writeReview);

/**
 * @swagger
 * /api/user/support/tickets:
 *   post:
 *     summary: Submit a support message
 *     tags: [User — Support]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               subject: { type: string, enum: [general, billing, booking, technical, other], default: general }
 *               message: { type: string }
 *               isUrgent: { type: boolean, default: false }
 *     responses:
 *       201:
 *         description: Ticket created
 */
router.post("/support/tickets", userController.createSupportTicket);

/**
 * @swagger
 * /api/user/support/tickets:
 *   get:
 *     summary: List your own support tickets, including any admin reply
 *     tags: [User — Support]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of tickets
 */
router.get("/support/tickets", userController.getMySupportTickets);

export default router;
