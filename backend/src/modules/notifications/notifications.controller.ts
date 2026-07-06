import { Request, Response } from "express";
import * as notificationsService from "./notifications.service";

export async function getNotifications(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await notificationsService.getNotifications(req.user!.userId, page, limit);
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getUnreadCount(req: Request, res: Response) {
  try {
    const count = await notificationsService.getUnreadCount(req.user!.userId);
    res.json({ count });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function markRead(req: Request, res: Response) {
  try {
    await notificationsService.markRead(req.params.id as string, req.user!.userId);
    res.json({ message: "Marked as read" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function markAllRead(req: Request, res: Response) {
  try {
    await notificationsService.markAllRead(req.user!.userId);
    res.json({ message: "All marked as read" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
