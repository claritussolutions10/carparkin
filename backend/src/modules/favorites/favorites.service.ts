import pool from "../../config/database";
import { generateFavoriteId } from "../../utils/ulid";

export async function getFavorites(userId: string) {
  const result = await pool.query(
    `SELECT
       f.id AS favorite_id, f.created_at AS favorited_at,
       pl.id, pl.title, pl.address, pl.price_per_month, pl.price_per_week, pl.price_per_day,
       pl.total_spaces, pl.available_spaces, pl.has_cctv, pl.has_security_guard,
       pl.rating, pl.review_count,
       pt.name AS parking_type,
       (SELECT pli.cloudinary_url FROM parking_listing_images pli
        WHERE pli.parking_listing_id = pl.id
        ORDER BY pli.display_order LIMIT 1) AS thumbnail_url
     FROM favorites f
     JOIN parking_listings pl ON f.parking_listing_id = pl.id
     LEFT JOIN parking_types pt ON pl.parking_type_id = pt.id
     WHERE f.user_id = $1
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addFavorite(userId: string, listingId: string) {
  const listing = await pool.query("SELECT id FROM parking_listings WHERE id = $1", [listingId]);
  if (!listing.rows[0]) {
    throw Object.assign(new Error("Parking listing not found"), { status: 404 });
  }

  await pool.query(
    `INSERT INTO favorites (id, user_id, parking_listing_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, parking_listing_id) DO NOTHING`,
    [generateFavoriteId(), userId, listingId]
  );
}

export async function removeFavorite(userId: string, listingId: string) {
  await pool.query(
    "DELETE FROM favorites WHERE user_id = $1 AND parking_listing_id = $2",
    [userId, listingId]
  );
}
