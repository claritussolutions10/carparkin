import { Request, Response } from "express";
import * as ownerService from "./owner.service";
import * as parkingService from "../parkings/parking.service";

const q = (req: Request, key: string) => req.query[key] as string | undefined;

export async function getDashboard(req: Request, res: Response) {
  try {
    const data = await ownerService.getOwnerDashboard(req.user!.userId);
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message || "Failed to load dashboard" });
  }
}

export async function getListings(req: Request, res: Response) {
  try {
    const parkings = await parkingService.getOwnerParkings(req.user!.userId);
    res.json({ parkings });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBookings(req: Request, res: Response) {
  try {
    const data = await ownerService.getOwnerBookings(
      req.user!.userId,
      q(req, 'status'),
      q(req, 'page') ? Number(q(req, 'page')) : 1,
      q(req, 'limit') ? Number(q(req, 'limit')) : 20,
      q(req, 'listingId')
    );
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getEarnings(req: Request, res: Response) {
  try {
    const data = await ownerService.getOwnerEarnings(
      req.user!.userId,
      q(req, 'page') ? Number(q(req, 'page')) : 1,
      q(req, 'limit') ? Number(q(req, 'limit')) : 20
    );
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getMonthlyEarnings(req: Request, res: Response) {
  try {
    const months = q(req, 'months') ? Number(q(req, 'months')) : 12;
    const data = await ownerService.getMonthlyEarnings(req.user!.userId, months);
    res.json({ monthly: data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getPayoutHistory(req: Request, res: Response) {
  try {
    const data = await ownerService.getPayoutHistory(
      req.user!.userId,
      q(req, 'page') ? Number(q(req, 'page')) : 1,
      q(req, 'limit') ? Number(q(req, 'limit')) : 20
    );
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getSubscription(req: Request, res: Response) {
  try {
    const subscription = await ownerService.getOwnerSubscription(req.user!.userId);
    if (!subscription) {
      res.status(404).json({ error: "No active subscription found" });
      return;
    }
    res.json({ subscription });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getSettings(req: Request, res: Response) {
  try {
    const settings = await ownerService.getOwnerSettings(req.user!.userId);
    if (!settings) {
      res.status(404).json({ error: "Settings not found" });
      return;
    }
    res.json({ settings });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getReviews(req: Request, res: Response) {
  try {
    const data = await ownerService.getOwnerReviews(req.user!.userId, {
      page: q(req, 'page') ? Number(q(req, 'page')) : 1,
      limit: q(req, 'limit') ? Number(q(req, 'limit')) : 20,
    });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function replyReview(req: Request, res: Response) {
  const { reply } = req.body;
  if (!reply || !reply.trim()) {
    res.status(400).json({ error: "reply is required" });
    return;
  }
  try {
    await ownerService.replyToReview(req.params.id as string, req.user!.userId, reply.trim());
    res.json({ message: "Reply posted" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateSettings(req: Request, res: Response) {
  const { fullName, phoneNumber, requiresListingApproval } = req.body;
  try {
    const settings = await ownerService.updateOwnerSettings(req.user!.userId, {
      fullName, phoneNumber, requiresListingApproval,
    });
    res.json({ settings });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function submitKyc(req: Request, res: Response) {
  const { documentUrl, documentType } = req.body;
  if (!documentUrl || !documentType) {
    res.status(400).json({ error: "documentUrl and documentType are required" });
    return;
  }
  try {
    const settings = await ownerService.submitKyc(req.user!.userId, { documentUrl, documentType });
    res.json({ settings });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function submitBankDetails(req: Request, res: Response) {
  const { accountNumber, ifsc, accountHolderName } = req.body;
  if (!accountNumber || !ifsc || !accountHolderName) {
    res.status(400).json({ error: "accountNumber, ifsc, and accountHolderName are required" });
    return;
  }
  try {
    const settings = await ownerService.submitBankDetails(req.user!.userId, { accountNumber, ifsc, accountHolderName });
    res.json({ settings });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
