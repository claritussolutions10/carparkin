import { Request, Response } from "express";
import * as parkingService from "./parking.service";

export async function create(req: Request, res: Response) {
  const {
    parking_type_id, title, description, address,
    latitude, longitude, total_spaces, price_per_month,
    price_per_week, price_per_day, has_cctv, has_security_guard,
    access_type, amenity_ids, image_urls,
  } = req.body;

  if (!parking_type_id || !title || !address || !latitude || !longitude || !total_spaces || !price_per_month) {
    res.status(400).json({ error: "parking_type_id, title, address, latitude, longitude, total_spaces, and price_per_month are required" });
    return;
  }

  try {
    const parking = await parkingService.createParking(req.user!.userId, {
      parkingTypeId: parking_type_id,
      title, description, address,
      latitude: Number(latitude),
      longitude: Number(longitude),
      totalSpaces: Number(total_spaces),
      pricePerMonth: Number(price_per_month),
      pricePerWeek: price_per_week ? Number(price_per_week) : undefined,
      pricePerDay: price_per_day ? Number(price_per_day) : undefined,
      hasCctv: Boolean(has_cctv),
      hasSecurityGuard: Boolean(has_security_guard),
      accessType: access_type,
      amenityIds: amenity_ids,
      imageUrls: image_urls,
    });
    res.status(201).json({ parking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function addImages(req: Request, res: Response) {
  const { images } = req.body;
  if (!Array.isArray(images) || images.length === 0) {
    res.status(400).json({ error: "images (array of {url, publicId}) is required" });
    return;
  }
  try {
    const inserted = await parkingService.addParkingImages(req.params.id as string, req.user!.userId, images);
    res.status(201).json({ images: inserted });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function removeImage(req: Request, res: Response) {
  try {
    await parkingService.removeParkingImage(req.params.imageId as string, req.params.id as string, req.user!.userId);
    res.json({ message: "Image removed" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getBlackoutDates(req: Request, res: Response) {
  try {
    const blackouts = await parkingService.getBlackoutDates(req.params.id as string, req.user!.userId);
    res.json({ blackouts });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function addBlackoutDate(req: Request, res: Response) {
  const { start_date, end_date, reason } = req.body;
  if (!start_date || !end_date) {
    res.status(400).json({ error: "start_date and end_date are required" });
    return;
  }
  try {
    const blackout = await parkingService.addBlackoutDate(req.params.id as string, req.user!.userId, {
      startDate: start_date, endDate: end_date, reason,
    });
    res.status(201).json({ blackout });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function removeBlackoutDate(req: Request, res: Response) {
  try {
    await parkingService.removeBlackoutDate(req.params.blackoutId as string, req.params.id as string, req.user!.userId);
    res.json({ message: "Blackout period removed" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function listOwnerParkings(req: Request, res: Response) {
  try {
    const parkings = await parkingService.getOwnerParkings(req.user!.userId);
    res.json({ parkings });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getOwnerParking(req: Request, res: Response) {
  try {
    const parking = await parkingService.getParkingById(req.params.id as string);
    if (parking.owner_id !== req.user!.userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    res.json({ parking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function update(req: Request, res: Response) {
  const {
    title, description, address, latitude, longitude,
    total_spaces, price_per_month, price_per_week, price_per_day,
    has_cctv, has_security_guard, access_type, is_active,
  } = req.body;

  try {
    const parking = await parkingService.updateParking(req.params.id as string, req.user!.userId, {
      title, description, address,
      latitude: latitude !== undefined ? Number(latitude) : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined,
      totalSpaces: total_spaces !== undefined ? Number(total_spaces) : undefined,
      pricePerMonth: price_per_month !== undefined ? Number(price_per_month) : undefined,
      pricePerWeek: price_per_week !== undefined ? Number(price_per_week) : undefined,
      pricePerDay: price_per_day !== undefined ? Number(price_per_day) : undefined,
      hasCctv: has_cctv !== undefined ? Boolean(has_cctv) : undefined,
      hasSecurityGuard: has_security_guard !== undefined ? Boolean(has_security_guard) : undefined,
      accessType: access_type,
      isActive: is_active !== undefined ? Boolean(is_active) : undefined,
    });
    res.json({ parking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await parkingService.deleteParking(req.params.id as string, req.user!.userId);
    res.json({ message: "Parking deleted" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function search(req: Request, res: Response) {
  const qs = (key: string) => req.query[key] as string | undefined;
  const lat = qs('lat') ? Number(qs('lat')) : undefined;
  const lng = qs('lng') ? Number(qs('lng')) : undefined;

  try {
    const result = await parkingService.searchParkings({
      latitude: lat,
      longitude: lng,
      radius: qs('radius') ? Number(qs('radius')) : undefined,
      query: qs('q') || qs('city') || undefined,
      minPrice: qs('minPrice') ? Number(qs('minPrice')) : undefined,
      maxPrice: qs('maxPrice') ? Number(qs('maxPrice')) : undefined,
      page: qs('page') ? Number(qs('page')) : undefined,
      limit: qs('limit') ? Number(qs('limit')) : undefined,
    });
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getPublicParking(req: Request, res: Response) {
  try {
    const parking = await parkingService.getParkingById(req.params.id as string);
    res.json({ parking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getParkingReviews(req: Request, res: Response) {
  try {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const data = await parkingService.getParkingReviews(req.params.id as string, page, limit);
    res.json(data);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function listParkingTypes(req: Request, res: Response) {
  try {
    const types = await parkingService.getParkingTypes();
    res.json({ types });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function listAmenities(req: Request, res: Response) {
  try {
    const amenities = await parkingService.getAmenities();
    res.json({ amenities });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
