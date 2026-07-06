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
import subscriptionsRoutes from "./modules/subscriptions/subscriptions.routes";
import bookingsRoutes from "./modules/bookings/bookings.routes";
import paymentRoutes from "./modules/payments/payment.routes";
import adminRoutes from "./modules/admin/admin.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import { publicRouter as configPublicRoutes, adminRouter as configAdminRoutes } from "./modules/config/config.routes";
import { authenticate, requireAdmin } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/api-docs/spec.json", (_req, res) => res.json(swaggerSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "Carparkin.in API Docs",
}));

app.use("/api/auth", authRoutes);
app.use("/api/parkings", parkingPublicRoutes);
app.use("/api/owners/parkings", parkingOwnerRoutes);
app.use("/api/owner", authenticate, ownerRoutes);
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

app.use(errorHandler);

export default app;
