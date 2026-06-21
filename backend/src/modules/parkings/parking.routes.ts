import { Router } from "express";
import * as parkingController from "./parking.controller";
import { authenticate } from "../../middleware/auth";

export const publicRouter = Router();
publicRouter.get("/", parkingController.search);
publicRouter.get("/:id", parkingController.getPublicParking);

export const ownerRouter = Router();
ownerRouter.use(authenticate);
ownerRouter.post("/", parkingController.create);
ownerRouter.get("/", parkingController.listOwnerParkings);
ownerRouter.get("/:id", parkingController.getOwnerParking);
ownerRouter.put("/:id", parkingController.update);
ownerRouter.delete("/:id", parkingController.remove);
