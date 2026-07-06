import { Router } from "express";
import * as adminController from "./admin.controller";

const router = Router();

router.get("/dashboard", adminController.getDashboard);
router.get("/dashboard/booking-volume", adminController.getBookingVolume);
router.get("/users", adminController.getUsers);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.patch("/users/:id", adminController.updateUser);
router.get("/owners", adminController.getOwners);
router.get("/listings/stats", adminController.getLocationStats);
router.get("/listings", adminController.getListings);
router.get("/listings/pending", adminController.getPendingListings);
router.get("/listings/approval-stats", adminController.getApprovalStats);
router.post("/listings/:id/approve", adminController.approveListing);
router.post("/listings/:id/reject", adminController.rejectListing);
router.patch("/listings/:id/status", adminController.updateListingStatus);
router.patch("/listings/:id", adminController.updateListing);
router.get("/bookings/stats", adminController.getBookingStats);
router.get("/bookings", adminController.getBookings);
router.patch("/bookings/:id/status", adminController.updateBookingStatus);

router.get("/amenities", adminController.getAmenities);
router.post("/amenities", adminController.createAmenity);
router.patch("/amenities/:id", adminController.updateAmenity);

router.get("/parking-types", adminController.getParkingTypes);
router.post("/parking-types", adminController.createParkingType);
router.patch("/parking-types/:id", adminController.updateParkingType);

router.get("/subscription-plans", adminController.getSubscriptionPlans);
router.post("/subscription-plans", adminController.createSubscriptionPlan);
router.patch("/subscription-plans/:id", adminController.updateSubscriptionPlan);

router.get("/support/tickets/stats", adminController.getSupportTicketStats);
router.get("/support/tickets", adminController.getSupportTickets);
router.patch("/support/tickets/:id/reply", adminController.replySupportTicket);

router.get("/audit-log", adminController.getAuditLog);

router.get("/payouts/stats", adminController.getPayoutStats);
router.get("/payouts", adminController.getPayouts);
router.post("/payouts/mark-paid", adminController.markPayoutsPaid);

router.get("/reviews", adminController.getReviews);
router.delete("/reviews/:id", adminController.deleteReview);

router.get("/reports/revenue", adminController.getRevenueReport);

router.get("/owners/:id/verification", adminController.getOwnerVerification);
router.patch("/owners/:id/kyc", adminController.reviewOwnerKyc);
router.patch("/owners/:id/bank", adminController.reviewOwnerBank);

export default router;
