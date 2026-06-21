import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./modules/auth/auth.routes";
import {
  publicRouter as parkingPublicRoutes,
  ownerRouter as parkingOwnerRoutes,
} from "./modules/parkings/parking.routes";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(helmet());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/parkings", parkingPublicRoutes);
app.use("/api/owners/parkings", parkingOwnerRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

export default app;
