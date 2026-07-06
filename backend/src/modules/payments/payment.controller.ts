import { Request, Response } from "express";
import * as mockPayment from "./mock-payment.service";
import * as bookingsService from "../bookings/bookings.service";

export async function processTestPayment(req: Request, res: Response) {
  const { bookingId, amount, forceFailure } = req.body;
  if (!bookingId || !amount) {
    res.status(400).json({ error: "bookingId and amount are required" });
    return;
  }

  const booking = await bookingsService.getBookingDetails(bookingId);
  if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
  if (booking.user_id !== req.user!.userId) {
    res.status(403).json({ error: "Not your booking" });
    return;
  }
  if (booking.status !== "pending") {
    res.status(400).json({ error: "Only pending bookings can be paid" });
    return;
  }

  const result = await mockPayment.processPayment(bookingId, Number(amount), Boolean(forceFailure));
  res.json({
    ...result,
    bookingId,
    amount: Number(amount),
    testMode: true,
  });
}

export function verifyTestPayment(req: Request, res: Response) {
  const { paymentId } = req.body;
  if (!paymentId) { res.status(400).json({ error: "paymentId is required" }); return; }
  const result = mockPayment.verifyPayment(paymentId);
  res.json({ ...result, paymentId, testMode: true });
}

export function getTestPaymentDetails(req: Request, res: Response) {
  const paymentId = req.params.paymentId as string;
  const amount = req.query.amount ? Number(req.query.amount as string) : undefined;
  res.json(mockPayment.getPaymentDetails(paymentId, amount));
}
