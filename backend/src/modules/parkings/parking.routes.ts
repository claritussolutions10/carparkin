import { Router } from "express";
import * as parkingController from "./parking.controller";
import { authenticate } from "../../middleware/auth";

export const publicRouter = Router();

/**
 * @swagger
 * /api/parkings:
 *   get:
 *     summary: Search parking listings by location
 *     tags: [Parkings]
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema: { type: number }
 *         example: 28.7041
 *       - in: query
 *         name: lng
 *         required: true
 *         schema: { type: number }
 *         example: 77.1025
 *       - in: query
 *         name: radius
 *         schema: { type: number, default: 10 }
 *         description: Search radius in km
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Listings sorted by distance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parkings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ParkingListing'
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *       400:
 *         description: lat and lng are required
 */
publicRouter.get("/", parkingController.search);

/**
 * @swagger
 * /api/parkings/types:
 *   get:
 *     summary: List all parking types
 *     tags: [Parkings]
 *     responses:
 *       200:
 *         description: Array of parking types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 types:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ParkingType'
 */
publicRouter.get("/types", parkingController.listParkingTypes);

/**
 * @swagger
 * /api/parkings/amenities:
 *   get:
 *     summary: List all amenities
 *     tags: [Parkings]
 *     responses:
 *       200:
 *         description: Array of amenities
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 amenities:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Amenity'
 */
publicRouter.get("/amenities", parkingController.listAmenities);

/**
 * @swagger
 * /api/parkings/{id}:
 *   get:
 *     summary: Get a single listing with amenities and owner info
 *     tags: [Parkings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: lst_01arh2xj41rj5ebg7qvc32ey44
 *     responses:
 *       200:
 *         description: Full listing detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parking:
 *                   $ref: '#/components/schemas/ParkingListing'
 *       404:
 *         description: Listing not found
 */
publicRouter.get("/:id", parkingController.getPublicParking);

/**
 * @swagger
 * /api/parkings/{id}/reviews:
 *   get:
 *     summary: List reviews for a listing
 *     tags: [Parkings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated reviews with reviewer name
 */
publicRouter.get("/:id/reviews", parkingController.getParkingReviews);

export const ownerRouter = Router();
ownerRouter.use(authenticate);

/**
 * @swagger
 * /api/owners/parkings:
 *   post:
 *     summary: Create a new parking listing
 *     tags: [Owner — Listings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [parking_type_id, title, address, latitude, longitude, total_spaces, price_per_month]
 *             properties:
 *               parking_type_id: { type: integer, example: 1 }
 *               title: { type: string, example: "My Parking Spot" }
 *               description: { type: string }
 *               address: { type: string, example: "456 Park Street" }
 *               latitude: { type: number, example: 28.705 }
 *               longitude: { type: number, example: 77.103 }
 *               total_spaces: { type: integer, example: 10 }
 *               price_per_month: { type: number, example: 2500 }
 *               price_per_week: { type: number, example: 700 }
 *               price_per_day: { type: number, example: 120 }
 *               has_cctv: { type: boolean, example: true }
 *               has_security_guard: { type: boolean, example: false }
 *               access_type: { type: string, example: "24/7" }
 *               amenity_ids:
 *                 type: array
 *                 items: { type: integer }
 *                 example: [1, 3, 6]
 *     responses:
 *       201:
 *         description: Listing created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parking:
 *                   $ref: '#/components/schemas/ParkingListing'
 *       401:
 *         description: Unauthorized
 */
ownerRouter.post("/", parkingController.create);

/**
 * @swagger
 * /api/owners/parkings:
 *   get:
 *     summary: List the authenticated owner's listings
 *     tags: [Owner — Listings]
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
ownerRouter.get("/", parkingController.listOwnerParkings);

/**
 * @swagger
 * /api/owners/parkings/{id}:
 *   get:
 *     summary: Get one of your listings by ID
 *     tags: [Owner — Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         example: lst_01arh2xj41rj5ebg7qvc32ey44
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parking:
 *                   $ref: '#/components/schemas/ParkingListing'
 *       403:
 *         description: Not your listing
 *       404:
 *         description: Not found
 */
ownerRouter.get("/:id", parkingController.getOwnerParking);

/**
 * @swagger
 * /api/owners/parkings/{id}:
 *   put:
 *     summary: Update one of your listings
 *     tags: [Owner — Listings]
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
 *               title: { type: string }
 *               description: { type: string }
 *               address: { type: string }
 *               totalSpaces: { type: integer }
 *               pricePerMonth: { type: number }
 *               pricePerWeek: { type: number }
 *               pricePerDay: { type: number }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Updated listing
 *       403:
 *         description: Not your listing
 */
ownerRouter.put("/:id", parkingController.update);

/**
 * @swagger
 * /api/owners/parkings/{id}:
 *   delete:
 *     summary: Deactivate a listing (soft delete)
 *     tags: [Owner — Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Parking deleted
 *       403:
 *         description: Not your listing
 */
ownerRouter.delete("/:id", parkingController.remove);

/**
 * @swagger
 * /api/owners/parkings/{id}/images:
 *   post:
 *     summary: Add photos to one of your listings
 *     tags: [Owner — Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url: { type: string }
 *                     publicId: { type: string }
 *     responses:
 *       201:
 *         description: Images added
 *       403:
 *         description: Not your listing
 */
ownerRouter.post("/:id/images", parkingController.addImages);

/**
 * @swagger
 * /api/owners/parkings/{id}/images/{imageId}:
 *   delete:
 *     summary: Remove a photo from one of your listings
 *     tags: [Owner — Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Image removed
 *       403:
 *         description: Not your listing
 *       404:
 *         description: Image not found
 */
ownerRouter.delete("/:id/images/:imageId", parkingController.removeImage);

/**
 * @swagger
 * /api/owners/parkings/{id}/blackouts:
 *   get:
 *     summary: List blocked date ranges for one of your listings
 *     tags: [Owner — Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blackout periods
 */
ownerRouter.get("/:id/blackouts", parkingController.getBlackoutDates);

/**
 * @swagger
 * /api/owners/parkings/{id}/blackouts:
 *   post:
 *     summary: Block a date range on one of your listings (e.g. for maintenance)
 *     tags: [Owner — Listings]
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
 *             required: [start_date, end_date]
 *             properties:
 *               start_date: { type: string, format: date }
 *               end_date: { type: string, format: date }
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: Blackout period created
 */
ownerRouter.post("/:id/blackouts", parkingController.addBlackoutDate);

/**
 * @swagger
 * /api/owners/parkings/{id}/blackouts/{blackoutId}:
 *   delete:
 *     summary: Remove a blocked date range from one of your listings
 *     tags: [Owner — Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: blackoutId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blackout period removed
 *       404:
 *         description: Blackout period not found
 */
ownerRouter.delete("/:id/blackouts/:blackoutId", parkingController.removeBlackoutDate);
