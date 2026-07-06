import { Request, Response } from "express";
import * as adminService from "./admin.service";

const qs = (req: Request, key: string): string | undefined => {
  const v = req.query[key];
  if (!v) return undefined;
  return Array.isArray(v) ? (v[0] as string) : (v as string);
};

export async function getDashboard(req: Request, res: Response) {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBookingVolume(req: Request, res: Response) {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const volume = await adminService.getBookingVolume(days);
    res.json({ volume });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await adminService.getUsers({
      search: qs(req, "search"),
      role: qs(req, "role"),
      status: qs(req, "status"),
      page,
      limit,
    });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getOwners(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await adminService.getOwners({
      search: qs(req, "search"),
      status: qs(req, "status"),
      joinedFrom: qs(req, "joinedFrom"),
      joinedTo: qs(req, "joinedTo"),
      page,
      limit,
    });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateUserStatus(req: Request, res: Response) {
  try {
    await adminService.updateUserStatus(req.params.id as string, !!req.body.isActive, req.user!.userId);
    res.json({ message: "User status updated" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { fullName, phoneNumber, role } = req.body;
    await adminService.updateUser(req.params.id as string, { fullName, phoneNumber, role }, req.user!.userId);
    res.json({ message: "User updated" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getListings(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await adminService.getListings({ search: qs(req, "search"), status: qs(req, "status"), page, limit });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getLocationStats(req: Request, res: Response) {
  try {
    const stats = await adminService.getLocationStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateListingStatus(req: Request, res: Response) {
  try {
    await adminService.updateListingStatus(req.params.id as string, !!req.body.isActive, req.user!.userId);
    res.json({ message: "Listing status updated" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateListing(req: Request, res: Response) {
  try {
    const { title, address } = req.body;
    await adminService.updateListing(req.params.id as string, { title, address }, req.user!.userId);
    res.json({ message: "Listing updated" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getPendingListings(req: Request, res: Response) {
  try {
    const listings = await adminService.getPendingListings(qs(req, "search"));
    res.json({ listings });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getApprovalStats(req: Request, res: Response) {
  try {
    const stats = await adminService.getApprovalStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function approveListing(req: Request, res: Response) {
  try {
    await adminService.approveListing(req.params.id as string, req.user!.userId);
    res.json({ message: "Listing approved" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function rejectListing(req: Request, res: Response) {
  try {
    await adminService.rejectListing(req.params.id as string, req.body?.reason, req.user!.userId);
    res.json({ message: "Listing rejected" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBookings(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await adminService.getBookings({
      search: qs(req, "search"),
      status: qs(req, "status"),
      locationId: qs(req, "locationId"),
      dateFrom: qs(req, "dateFrom"),
      dateTo: qs(req, "dateTo"),
      page,
      limit,
    });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBookingStats(req: Request, res: Response) {
  try {
    const stats = await adminService.getBookingStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateBookingStatus(req: Request, res: Response) {
  try {
    await adminService.updateBookingStatus(req.params.id as string, req.body.status, req.user!.userId);
    res.json({ message: "Booking status updated" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getAmenities(_req: Request, res: Response) {
  try {
    const amenities = await adminService.getAllAmenities();
    res.json({ amenities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createAmenity(req: Request, res: Response) {
  try {
    const amenity = await adminService.createAmenity(req.body, req.user!.userId);
    res.status(201).json({ amenity });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateAmenity(req: Request, res: Response) {
  try {
    const amenity = await adminService.updateAmenity(Number(req.params.id), req.body, req.user!.userId);
    res.json({ amenity });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getParkingTypes(_req: Request, res: Response) {
  try {
    const types = await adminService.getAllParkingTypes();
    res.json({ types });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createParkingType(req: Request, res: Response) {
  try {
    const type = await adminService.createParkingType(req.body, req.user!.userId);
    res.status(201).json({ type });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateParkingType(req: Request, res: Response) {
  try {
    const type = await adminService.updateParkingType(Number(req.params.id), req.body, req.user!.userId);
    res.json({ type });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getSubscriptionPlans(_req: Request, res: Response) {
  try {
    const plans = await adminService.getAllSubscriptionPlans();
    res.json({ plans });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createSubscriptionPlan(req: Request, res: Response) {
  try {
    const plan = await adminService.createSubscriptionPlan(req.body, req.user!.userId);
    res.status(201).json({ plan });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function updateSubscriptionPlan(req: Request, res: Response) {
  try {
    const plan = await adminService.updateSubscriptionPlan(Number(req.params.id), req.body, req.user!.userId);
    res.json({ plan });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getSupportTickets(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await adminService.getSupportTickets({
      status: qs(req, "status"),
      urgentOnly: qs(req, "urgentOnly") === "true",
      page,
      limit,
    });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getSupportTicketStats(_req: Request, res: Response) {
  try {
    const stats = await adminService.getSupportTicketStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function replySupportTicket(req: Request, res: Response) {
  const { reply } = req.body;
  if (!reply || !reply.trim()) {
    res.status(400).json({ error: "reply is required" });
    return;
  }
  try {
    const ticket = await adminService.replySupportTicket(req.params.id as string, reply, req.user!.userId);
    res.json({ ticket });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getAuditLog(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await adminService.getAuditLog({
      adminId: qs(req, "adminId"),
      action: qs(req, "action"),
      entityType: qs(req, "entityType"),
      page,
      limit,
    });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getPayoutStats(_req: Request, res: Response) {
  try {
    const stats = await adminService.getPayoutStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getPayouts(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const data = await adminService.getPayouts({ status: qs(req, "status"), search: qs(req, "search"), page, limit });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function markPayoutsPaid(req: Request, res: Response) {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id: unknown) => typeof id === "string") : [];
  if (ids.length === 0) {
    res.status(400).json({ error: "ids is required" });
    return;
  }
  try {
    const result = await adminService.markPayoutsPaid(ids, req.user!.userId);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getReviews(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const maxRating = req.query.maxRating ? Number(req.query.maxRating) : undefined;
    const data = await adminService.getReviews({ search: qs(req, "search"), maxRating, page, limit });
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function deleteReview(req: Request, res: Response) {
  try {
    await adminService.deleteReview(req.params.id as string, req.user!.userId);
    res.json({ message: "Review removed" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getOwnerVerification(req: Request, res: Response) {
  try {
    const verification = await adminService.getOwnerVerification(req.params.id as string);
    res.json({ verification });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function reviewOwnerKyc(req: Request, res: Response) {
  try {
    await adminService.reviewOwnerKyc(req.params.id as string, !!req.body.verified, req.body.reason, req.user!.userId);
    res.json({ message: "KYC review recorded" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function reviewOwnerBank(req: Request, res: Response) {
  try {
    await adminService.reviewOwnerBank(req.params.id as string, !!req.body.verified, req.body.reason, req.user!.userId);
    res.json({ message: "Bank review recorded" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getRevenueReport(req: Request, res: Response) {
  try {
    const months = req.query.months ? Number(req.query.months) : 12;
    const [report, summary] = await Promise.all([
      adminService.getRevenueReport(months),
      adminService.getRevenueSummary(),
    ]);
    res.json({ report, summary });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
