import { Router } from "express";
import * as notificationsController from "./notifications.controller";

const router = Router();

router.get("/", notificationsController.getNotifications);
router.get("/unread-count", notificationsController.getUnreadCount);
router.patch("/read-all", notificationsController.markAllRead);
router.patch("/:id/read", notificationsController.markRead);

export default router;
