import { Request, Response } from "express";
import * as paymentService from "./payment.service";

export async function createOrder(req: Request, res: Response) {
  const { bookingId } = req.body;
  if (!bookingId) { res.status(400).json({ error: "bookingId is required" }); return; }

  try {
    const order = await paymentService.createOrder(bookingId, req.user!.userId);
    res.json(order);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function verify(req: Request, res: Response) {
  const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ error: "bookingId, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required" });
    return;
  }

  try {
    const booking = await paymentService.verifyAndConfirm(bookingId, req.user!.userId, {
      razorpay_order_id, razorpay_payment_id, razorpay_signature,
    });
    res.json({ booking, message: "Payment verified, booking confirmed" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function webhook(req: Request, res: Response) {
  try {
    await paymentService.handleWebhook(req.body, req.headers["x-razorpay-signature"] as string | undefined);
    res.json({ received: true });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
