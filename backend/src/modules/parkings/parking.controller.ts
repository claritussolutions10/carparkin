import { Request, Response } from "express";
import * as parkingService from "./parking.service";

export async function create(req: Request, res: Response) {
  const { title, description, address, city, latitude, longitude, monthlyPrice, capacity, amenities, images } =
    req.body;

  if (!title || !address || !city || !monthlyPrice || !capacity) {
    res.status(400).json({ error: "Title, address, city, monthlyPrice, and capacity are required" });
    return;
  }
  if (monthlyPrice <= 0 || capacity <= 0) {
    res.status(400).json({ error: "monthlyPrice and capacity must be positive" });
    return;
  }

  try {
    const parking = await parkingService.createParking(req.user!.userId, {
      title, description, address, city, latitude, longitude, monthlyPrice, capacity, amenities, images,
    });
    res.status(201).json({ parking });
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
    const parking = await parkingService.getParkingById(Number(req.params.id));
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
  try {
    const parking = await parkingService.updateParking(
      Number(req.params.id),
      req.user!.userId,
      req.body
    );
    res.json({ parking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await parkingService.deleteParking(Number(req.params.id), req.user!.userId);
    res.json({ message: "Parking deleted" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function search(req: Request, res: Response) {
  try {
    const filters = {
      city: req.query.city as string | undefined,
      minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
      amenities: req.query.amenities
        ? (req.query.amenities as string).split(",")
        : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    };
    const result = await parkingService.searchParkings(filters);
    res.json(result);
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function getPublicParking(req: Request, res: Response) {
  try {
    const parking = await parkingService.getParkingById(Number(req.params.id));
    res.json({ parking });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
