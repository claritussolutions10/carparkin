import { Router } from "express";
import * as favoritesController from "./favorites.controller";

const router = Router();

/**
 * @swagger
 * /api/user/favorites:
 *   get:
 *     summary: List the current user's favorited parking listings
 *     tags: [User — Favorites]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", favoritesController.getFavorites);

/**
 * @swagger
 * /api/user/favorites/{listingId}:
 *   post:
 *     summary: Save a parking listing to favorites
 *     tags: [User — Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *         example: lst_01arh2xj41rj5ebg7qvc32ey46
 *     responses:
 *       201:
 *         description: Added to favorites
 *       404:
 *         description: Parking listing not found
 *   delete:
 *     summary: Remove a parking listing from favorites
 *     tags: [User — Favorites]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Removed from favorites
 */
router.post("/:listingId", favoritesController.addFavorite);
router.delete("/:listingId", favoritesController.removeFavorite);

export default router;
