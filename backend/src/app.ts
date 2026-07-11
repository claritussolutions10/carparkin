import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./modules/auth/auth.routes";
import {
  publicRouter as parkingPublicRoutes,
  ownerRouter as parkingOwnerRoutes,
} from "./modules/parkings/parking.routes";
import ownerRoutes from "./modules/owner/owner.routes";
import userRoutes from "./modules/user/user.routes";
import favoritesRoutes from "./modules/favorites/favorites.routes";
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.routes";
import bookingsRoutes from "./modules/bookings/bookings.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import * as paymentController from "./modules/payments/payment.controller";
import adminRoutes from "./modules/admin/admin.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import { publicRouter as configPublicRoutes, adminRouter as configAdminRoutes } from "./modules/config/config.routes";
import { authenticate, requireAdmin, requireRole } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import { getListingCities } from "./modules/parkings/parking.service";
import { slugifyCity } from "./lib/citySlug";

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Razorpay webhook (payment.captured etc.) — called by Razorpay, not the frontend
 *     description: Verified via the x-razorpay-signature header against RAZORPAY_WEBHOOK_SECRET. Mounted ahead of express.json() with a raw body parser — HMAC verification needs the exact bytes Razorpay sent, not Express's re-serialized parsed body.
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Event processed (or safely ignored if not payment.captured)
 *       400:
 *         description: Invalid or missing signature
 */
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), paymentController.webhook);

app.use(express.json({ limit: "10mb" }));

app.get("/api-docs/spec.json", (_req, res) => res.json(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Carparkin.in API Docs",
}));

app.use("/api/auth", authRoutes);
app.use("/api/parkings", parkingPublicRoutes);
app.use("/api/owners/parkings", parkingOwnerRoutes);
app.use("/api/owner", authenticate, ownerRoutes);
app.use("/api/user/favorites", authenticate, requireRole("user"), favoritesRoutes);
app.use("/api/user", authenticate, userRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", authenticate, notificationsRoutes);
app.use("/api/admin", authenticate, requireAdmin, adminRoutes);
app.use("/api/admin/config", authenticate, requireAdmin, configAdminRoutes);
app.use("/api/config", configPublicRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Lives outside /api since crawlers expect it at the site root. Requires
// carparkin.in/sitemap.xml to actually route to this backend in production
// (reverse proxy) - if the frontend is hosted separately with no proxy for
// this path, submit this route's URL directly in Google Search Console instead.
app.get("/sitemap.xml", async (_req, res) => {
  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const staticPaths = ["/", "/search", "/pricing", "/about", "/parking-in"];

  let citySlugs: string[] = [];
  try {
    const cities = await getListingCities();
    citySlugs = [...new Set(cities.map((c) => slugifyCity(c.city)))];
  } catch {
    citySlugs = [];
  }

  const urls = [
    ...staticPaths.map((p) => `${frontendUrl}${p}`),
    ...citySlugs.map((slug) => `${frontendUrl}/parking-in/${slug}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

  res.type("application/xml").send(xml);
});

app.use(errorHandler);

export default app;
