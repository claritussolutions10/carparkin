import { Request, Response } from "express";
import * as subscriptionsService from "./subscriptions.service";

export async function getPlans(_req: Request, res: Response) {
  try {
    const plans = await subscriptionsService.getPlans();
    res.json({ plans });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getActiveSubscription(req: Request, res: Response) {
  try {
    const subscription = await subscriptionsService.getActiveSubscription(req.user!.userId);
    res.json({ subscription });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function activateSubscription(req: Request, res: Response) {
  const { planId, razorpaySubscriptionId } = req.body;
  if (!planId) {
    res.status(400).json({ error: "planId is required" });
    return;
  }
  try {
    const subscription = await subscriptionsService.activateSubscription(
      req.user!.userId,
      Number(planId),
      razorpaySubscriptionId
    );
    res.status(201).json({ subscription });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function cancelSubscription(req: Request, res: Response) {
  try {
    const cancelled = await subscriptionsService.cancelSubscription(req.user!.userId);
    res.json({ cancelled, message: "Subscription cancelled" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getHistory(req: Request, res: Response) {
  const limit = req.query.limit ? Number(req.query.limit as string) : 10;
  try {
    const history = await subscriptionsService.getSubscriptionHistory(req.user!.userId, limit);
    res.json({ history });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
