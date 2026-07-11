import { Request, Response } from "express";
import * as bookingsService from "./bookings.service";

export async function checkAvailability(req: Request, res: Response) {
  const { listingId, startDate, endDate } = req.query as Record<string, string>;
  if (!listingId || !startDate || !endDate) {
    res.status(400).json({ error: "listingId, startDate, and endDate are required" });
    return;
  }
  try {
    const data = await bookingsService.checkAvailability(listingId, new Date(startDate), new Date(endDate));
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getPricingEstimate(req: Request, res: Response) {
  const { listingId, startDate, endDate } = req.query as Record<string, string>;
  if (!listingId || !startDate || !endDate) {
    res.status(400).json({ error: "listingId, startDate, and endDate are required" });
    return;
  }
  try {
    const estimate = await bookingsService.getPricingEstimate(listingId, startDate, endDate);
    res.json({ estimate });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function createBooking(req: Request, res: Response) {
  const { listingId, vehicleId, startDate, endDate } = req.body;
  if (!listingId || !vehicleId || !startDate || !endDate) {
    res.status(400).json({ error: "listingId, vehicleId, startDate, and endDate are required" });
    return;
  }
  try {
    const booking = await bookingsService.createBooking(req.user!.userId, { listingId, vehicleId, startDate, endDate });
    res.status(201).json({ booking, message: "Booking created — proceed to payment" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function completeBooking(req: Request, res: Response) {
  try {
    const booking = await bookingsService.completeBooking(req.params.id as string);
    res.json({ booking, message: "Booking completed" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBookingDetails(req: Request, res: Response) {
  try {
    const booking = await bookingsService.getBookingDetails(req.params.id as string);
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json({ booking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBookingHistory(req: Request, res: Response) {
  const q = (k: string) => req.query[k] as string | undefined;
  try {
    const data = await bookingsService.getBookingHistory({
      status: q('status'),
      startDate: q('startDate'),
      endDate: q('endDate'),
      page: q('page') ? Number(q('page')) : 1,
      limit: q('limit') ? Number(q('limit')) : 20,
    });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
