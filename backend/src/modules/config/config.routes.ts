import { Router } from "express";
import * as configController from "./config.controller";

export const publicRouter = Router();
publicRouter.get("/public", configController.getPublicConfig);

export const adminRouter = Router();
adminRouter.get("/", configController.getAdminConfig);
adminRouter.put("/", configController.updateAdminConfig);
