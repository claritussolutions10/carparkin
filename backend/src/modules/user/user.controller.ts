import { Request, Response } from "express";
import * as userService from "./user.service";

export async function getBookings(req: Request, res: Response) {
  const q = (key: string) => req.query[key] as string | undefined;
  try {
    const data = await userService.getUserBookings(
      req.user!.userId,
      q('status'),
      q('page') ? Number(q('page')) : 1,
      q('limit') ? Number(q('limit')) : 20
    );
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getVehicles(req: Request, res: Response) {
  try {
    const vehicles = await userService.getUserVehicles(req.user!.userId);
    res.json({ vehicles });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function addVehicle(req: Request, res: Response) {
  const { vehicle_type, registration_number, make, model, color, year_manufactured, is_primary } = req.body;

  if (!vehicle_type || !registration_number) {
    res.status(400).json({ error: "vehicle_type and registration_number are required" });
    return;
  }

  try {
    const vehicle = await userService.addVehicle(req.user!.userId, {
      vehicleType: vehicle_type,
      registrationNumber: registration_number,
      make, model, color,
      yearManufactured: year_manufactured ? Number(year_manufactured) : undefined,
      isPrimary: Boolean(is_primary),
    });
    res.status(201).json({ vehicle });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function removeVehicle(req: Request, res: Response) {
  try {
    await userService.deleteVehicle(req.params.id as string, req.user!.userId);
    res.json({ message: "Vehicle removed" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const profile = await userService.getUserProfile(req.user!.userId);
    res.json({ profile });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const data = await userService.getDashboard(req.user!.userId);
    res.json({ dashboard: data });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBookingById(req: Request, res: Response) {
  try {
    const booking = await userService.getBookingById(req.params.id as string, req.user!.userId);
    if (!booking) { res.status(404).json({ error: "Booking not found" }); return; }
    res.json({ booking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const booking = await userService.cancelBooking(req.params.id as string, req.user!.userId);
    res.json({ booking, message: "Booking cancelled" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getVehicleById(req: Request, res: Response) {
  try {
    const vehicle = await userService.getVehicleById(req.params.id as string, req.user!.userId);
    if (!vehicle) { res.status(404).json({ error: "Vehicle not found" }); return; }
    res.json({ vehicle });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateVehicle(req: Request, res: Response) {
  const { color, is_primary } = req.body;
  try {
    const vehicle = await userService.updateVehicle(req.params.id as string, req.user!.userId, {
      color,
      isPrimary: is_primary !== undefined ? Boolean(is_primary) : undefined,
    });
    res.json({ vehicle });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getReviews(req: Request, res: Response) {
  const q = (key: string) => req.query[key] as string | undefined;
  try {
    const data = await userService.getReviews(
      req.user!.userId,
      q('page') ? Number(q('page')) : 1,
      q('limit') ? Number(q('limit')) : 20
    );
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function writeReview(req: Request, res: Response) {
  const { rating, reviewText, review_text, cleanlinessRating, securityRating, accessibilityRating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: "rating must be between 1 and 5" });
    return;
  }
  try {
    const review = await userService.writeReview(req.user!.userId, req.params.bookingId as string, {
      rating: Number(rating),
      reviewText: reviewText ?? review_text,
      cleanlinessRating: cleanlinessRating ? Number(cleanlinessRating) : undefined,
      securityRating: securityRating ? Number(securityRating) : undefined,
      accessibilityRating: accessibilityRating ? Number(accessibilityRating) : undefined,
    });
    res.status(201).json({ review });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateProfile(req: Request, res: Response) {
  const { fullName, full_name, phoneNumber, phone_number } = req.body;
  try {
    const profile = await userService.updateProfile(req.user!.userId, {
      fullName: fullName ?? full_name,
      phoneNumber: phoneNumber ?? phone_number,
    });
    res.json({ profile });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function createSupportTicket(req: Request, res: Response) {
  const { subject, message, isUrgent } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }
  try {
    const ticket = await userService.createSupportTicket(req.user!.userId, {
      subject: subject || "general",
      message,
      isUrgent: !!isUrgent,
    });
    res.status(201).json({ ticket });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getMySupportTickets(req: Request, res: Response) {
  try {
    const tickets = await userService.getMySupportTickets(req.user!.userId);
    res.json({ tickets });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
