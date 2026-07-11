import { Request, Response } from "express";
import * as favoritesService from "./favorites.service";

export async function getFavorites(req: Request, res: Response) {
  try {
    const favorites = await favoritesService.getFavorites(req.user!.userId);
    res.json({ favorites });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function addFavorite(req: Request, res: Response) {
  try {
    await favoritesService.addFavorite(req.user!.userId, req.params.listingId as string);
    res.status(201).json({ message: "Added to favorites" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}

export async function removeFavorite(req: Request, res: Response) {
  try {
    await favoritesService.removeFavorite(req.user!.userId, req.params.listingId as string);
    res.json({ message: "Removed from favorites" });
  } catch (err: any) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
