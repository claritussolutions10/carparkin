import pool from "../../config/database";
import { generateListingId } from "../../utils/ulid";
import { ParkingListingRow, ParkingTypeRow, AmenityRow, SearchFilters } from "../../types";
import { notifyAdmins } from "../notifications/notifications.service";

export async function getParkingTypes(): Promise<ParkingTypeRow[]> {
  const result = await pool.query<ParkingTypeRow>(
    "SELECT * FROM parking_types WHERE is_active = true ORDER BY name"
  );
  return result.rows;
}

export async function getAmenities(): Promise<AmenityRow[]> {
  const result = await pool.query<AmenityRow>(
    "SELECT * FROM amenities WHERE is_active = true ORDER BY name"
  );
  return result.rows;
}

// Real, live city list for the "Browse by City" directory + sitemap - never
// a hardcoded list, since a city page with zero listings behind it is thin
// content that hurts SEO rather than helping it.
export async function getListingCities(): Promise<{ city: string; count: number }[]> {
  const result = await pool.query<{ city: string; count: string }>(
    `SELECT city, COUNT(*) AS count
     FROM parking_listings
     WHERE is_active = true AND is_approved = true AND city IS NOT NULL
     GROUP BY city
     ORDER BY count DESC`
  );
  return result.rows.map((r) => ({ city: r.city, count: parseInt(r.count, 10) }));
}

export async function createParking(
  ownerId: string,
  data: {
    parkingTypeId: number;
    title: string;
    description?: string;
    address: string;
    city?: string;
    latitude: number;
    longitude: number;
    totalSpaces: number;
    pricePerMonth: number;
    pricePerWeek?: number;
    pricePerDay?: number;
    hasCctv?: boolean;
    hasSecurityGuard?: boolean;
    accessType?: string;
    amenityIds?: number[];
    imageUrls?: { url: string; publicId: string }[];
  }
) {
  const id = generateListingId();

  // Whether this listing needs admin review before going live: the owner's
  // own preference (owner_settings.requires_listing_approval) wins if they've
  // set one, otherwise fall back to the platform-wide default configured in
  // Admin > Configuration.
  const [ownerPref, platformDefault] = await Promise.all([
    pool.query("SELECT requires_listing_approval FROM owner_settings WHERE owner_id = $1", [ownerId]),
    pool.query("SELECT require_listing_approval FROM platform_settings WHERE id = 1"),
  ]);
  const requiresApproval = ownerPref.rows[0]
    ? ownerPref.rows[0].requires_listing_approval
    : (platformDefault.rows[0]?.require_listing_approval ?? true);

  const isApproved = !requiresApproval;

  const result = await pool.query<ParkingListingRow>(
    `INSERT INTO parking_listings
       (id, owner_id, parking_type_id, title, description, address, city,
        latitude, longitude, total_spaces, available_spaces,
        price_per_month, price_per_week, price_per_day,
        has_cctv, has_security_guard, access_type,
        is_approved, is_active, approval_status, approved_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13,$14,$15,$16,$17,$17,$18,$19)
     RETURNING *`,
    [
      id, ownerId, data.parkingTypeId, data.title, data.description || null,
      data.address, data.city || null, data.latitude, data.longitude, data.totalSpaces,
      data.pricePerMonth, data.pricePerWeek || null, data.pricePerDay || null,
      data.hasCctv || false, data.hasSecurityGuard || false, data.accessType || null,
      isApproved, isApproved ? "approved" : "pending", isApproved ? new Date() : null,
    ]
  );

  const listing = result.rows[0]!;

  if (data.amenityIds && data.amenityIds.length > 0) {
    for (const amenityId of data.amenityIds) {
      await pool.query(
        "INSERT INTO parking_listing_amenities (parking_listing_id, amenity_id) VALUES ($1, $2)",
        [id, amenityId]
      );
    }
  }

  if (data.imageUrls && data.imageUrls.length > 0) {
    let order = 0;
    for (const img of data.imageUrls) {
      await pool.query(
        `INSERT INTO parking_listing_images (parking_listing_id, cloudinary_url, cloudinary_public_id, display_order, uploaded_by)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, img.url, img.publicId, order, ownerId]
      );
      order++;
    }
  }

  if (!isApproved) {
    await notifyAdmins(
      "new_pending_listing", "New listing awaiting approval",
      `"${listing.title}" was submitted and needs review.`, "/admin/locations/pending"
    );
  }

  return listing;
}

export async function getOwnerParkings(ownerId: string) {
  const result = await pool.query(
    `SELECT pl.*, pt.name AS parking_type,
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name, 'icon', a.icon))
              FILTER (WHERE a.id IS NOT NULL), '[]') AS amenities,
            COALESCE(
              (SELECT json_agg(jsonb_build_object('id', pli.id, 'url', pli.cloudinary_url) ORDER BY pli.display_order)
               FROM parking_listing_images pli WHERE pli.parking_listing_id = pl.id),
              '[]'
            ) AS images
     FROM parking_listings pl
     LEFT JOIN parking_types pt ON pl.parking_type_id = pt.id
     LEFT JOIN parking_listing_amenities pla ON pl.id = pla.parking_listing_id
     LEFT JOIN amenities a ON pla.amenity_id = a.id
     WHERE pl.owner_id = $1
     GROUP BY pl.id, pt.name
     ORDER BY pl.created_at DESC`,
    [ownerId]
  );
  return result.rows;
}

export async function getParkingById(id: string) {
  const result = await pool.query(
    `SELECT pl.*, pt.name AS parking_type, u.full_name AS owner_name,
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', a.id, 'name', a.name, 'icon', a.icon))
              FILTER (WHERE a.id IS NOT NULL), '[]') AS amenities,
            COALESCE(
              (SELECT json_agg(jsonb_build_object('id', pli.id, 'url', pli.cloudinary_url) ORDER BY pli.display_order)
               FROM parking_listing_images pli WHERE pli.parking_listing_id = pl.id),
              '[]'
            ) AS images
     FROM parking_listings pl
     LEFT JOIN parking_types pt ON pl.parking_type_id = pt.id
     LEFT JOIN users u ON pl.owner_id = u.id
     LEFT JOIN parking_listing_amenities pla ON pl.id = pla.parking_listing_id
     LEFT JOIN amenities a ON pla.amenity_id = a.id
     WHERE pl.id = $1
     GROUP BY pl.id, pt.name, u.full_name`,
    [id]
  );
  const parking = result.rows[0];
  if (!parking) {
    throw Object.assign(new Error("Parking not found"), { status: 404 });
  }
  return parking;
}

export async function addParkingImages(
  listingId: string,
  ownerId: string,
  images: { url: string; publicId: string }[]
) {
  const owned = await pool.query("SELECT owner_id FROM parking_listings WHERE id = $1", [listingId]);
  if (!owned.rows[0]) throw Object.assign(new Error("Parking not found"), { status: 404 });
  if (owned.rows[0].owner_id !== ownerId) throw Object.assign(new Error("Not authorized"), { status: 403 });

  const offset = await pool.query(
    "SELECT COALESCE(MAX(display_order), -1) + 1 AS next FROM parking_listing_images WHERE parking_listing_id = $1",
    [listingId]
  );
  let order = offset.rows[0].next;

  const inserted = [];
  for (const img of images) {
    const result = await pool.query(
      `INSERT INTO parking_listing_images (parking_listing_id, cloudinary_url, cloudinary_public_id, display_order, uploaded_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, cloudinary_url AS url, display_order`,
      [listingId, img.url, img.publicId, order, ownerId]
    );
    inserted.push(result.rows[0]);
    order++;
  }
  return inserted;
}

export async function removeParkingImage(imageId: string, listingId: string, ownerId: string) {
  const owned = await pool.query("SELECT owner_id FROM parking_listings WHERE id = $1", [listingId]);
  if (!owned.rows[0]) throw Object.assign(new Error("Parking not found"), { status: 404 });
  if (owned.rows[0].owner_id !== ownerId) throw Object.assign(new Error("Not authorized"), { status: 403 });

  const result = await pool.query(
    "DELETE FROM parking_listing_images WHERE id = $1 AND parking_listing_id = $2 RETURNING id",
    [imageId, listingId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Image not found"), { status: 404 });
}

// --- Blackout dates (Owner > Edit Location > Blocked Dates) ---
// Lets an owner take a listing offline for a date range (maintenance, etc.)
// without deactivating it entirely. bookings.service.ts checkAvailability()
// treats any overlapping blackout as zero availability for those dates.

export async function getBlackoutDates(listingId: string, ownerId: string) {
  const owned = await pool.query("SELECT owner_id FROM parking_listings WHERE id = $1", [listingId]);
  if (!owned.rows[0]) throw Object.assign(new Error("Parking not found"), { status: 404 });
  if (owned.rows[0].owner_id !== ownerId) throw Object.assign(new Error("Not authorized"), { status: 403 });

  const result = await pool.query(
    `SELECT id, start_date, end_date, reason, created_at
     FROM parking_blackout_dates
     WHERE parking_listing_id = $1
     ORDER BY start_date ASC`,
    [listingId]
  );
  return result.rows;
}

export async function addBlackoutDate(
  listingId: string,
  ownerId: string,
  data: { startDate: string; endDate: string; reason?: string }
) {
  const owned = await pool.query("SELECT owner_id FROM parking_listings WHERE id = $1", [listingId]);
  if (!owned.rows[0]) throw Object.assign(new Error("Parking not found"), { status: 404 });
  if (owned.rows[0].owner_id !== ownerId) throw Object.assign(new Error("Not authorized"), { status: 403 });
  if (new Date(data.endDate) < new Date(data.startDate)) {
    throw Object.assign(new Error("End date must be on or after start date"), { status: 400 });
  }

  const result = await pool.query(
    `INSERT INTO parking_blackout_dates (parking_listing_id, start_date, end_date, reason)
     VALUES ($1, $2, $3, $4) RETURNING id, start_date, end_date, reason, created_at`,
    [listingId, data.startDate, data.endDate, data.reason || null]
  );
  return result.rows[0];
}

export async function removeBlackoutDate(blackoutId: string, listingId: string, ownerId: string) {
  const owned = await pool.query("SELECT owner_id FROM parking_listings WHERE id = $1", [listingId]);
  if (!owned.rows[0]) throw Object.assign(new Error("Parking not found"), { status: 404 });
  if (owned.rows[0].owner_id !== ownerId) throw Object.assign(new Error("Not authorized"), { status: 403 });

  const result = await pool.query(
    "DELETE FROM parking_blackout_dates WHERE id = $1 AND parking_listing_id = $2 RETURNING id",
    [blackoutId, listingId]
  );
  if (result.rowCount === 0) throw Object.assign(new Error("Blackout period not found"), { status: 404 });
}

export async function getParkingReviews(parkingListingId: string, page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;
  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT r.id, r.rating, r.review_text, r.cleanliness_rating, r.security_rating,
              r.accessibility_rating, r.is_verified_booking, r.owner_reply, r.owner_replied_at, r.created_at,
              u.full_name AS reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.parking_listing_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [parkingListingId, limit, offset]
    ),
    pool.query("SELECT COUNT(*) FROM reviews WHERE parking_listing_id = $1", [parkingListingId]),
  ]);
  return { reviews: rows.rows, total: parseInt(count.rows[0].count), page, limit };
}

export async function updateParking(
  id: string,
  ownerId: string,
  data: Partial<{
    title: string;
    description: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    totalSpaces: number;
    pricePerMonth: number;
    pricePerWeek: number;
    pricePerDay: number;
    hasCctv: boolean;
    hasSecurityGuard: boolean;
    accessType: string;
    isActive: boolean;
  }>
) {
  const parking = await getParkingById(id);
  if (parking.owner_id !== ownerId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }

  const mappings: Record<string, string> = {
    title: "title",
    description: "description",
    address: "address",
    city: "city",
    latitude: "latitude",
    longitude: "longitude",
    totalSpaces: "total_spaces",
    pricePerMonth: "price_per_month",
    pricePerWeek: "price_per_week",
    pricePerDay: "price_per_day",
    hasCctv: "has_cctv",
    hasSecurityGuard: "has_security_guard",
    accessType: "access_type",
    isActive: "is_active",
  };

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, column] of Object.entries(mappings)) {
    if ((data as Record<string, unknown>)[key] !== undefined) {
      fields.push(`${column} = $${idx++}`);
      values.push((data as Record<string, unknown>)[key]);
    }
  }

  if (fields.length === 0) return parking;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE parking_listings SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return result.rows[0]!;
}

export async function deleteParking(id: string, ownerId: string) {
  const parking = await getParkingById(id);
  if (parking.owner_id !== ownerId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }
  await pool.query("UPDATE parking_listings SET is_active = false WHERE id = $1", [id]);
}

export async function searchParkings(filters: SearchFilters) {
  const { latitude, longitude, radius = 10, query, cities, minPrice, maxPrice, page = 1, limit = 20 } = filters;
  const safeLimit = Math.min(limit, 50);
  const offset = (page - 1) * safeLimit;

  const useGeo = latitude !== undefined && longitude !== undefined;
  const params: unknown[] = [];
  let idx = 1;

  let where = `pl.is_active = true AND pl.is_approved = true AND pl.available_spaces > 0`;

  if (useGeo) {
    params.push(latitude, longitude, radius);
    where += ` AND (6371 * acos(LEAST(1, cos(radians($1)) * cos(radians(pl.latitude)) *
         cos(radians(pl.longitude) - radians($2)) +
         sin(radians($1)) * sin(radians(pl.latitude))))) <= $3`;
    idx = 4;
  }

  if (query) {
    params.push(`%${query}%`);
    where += ` AND (pl.title ILIKE $${idx} OR pl.address ILIKE $${idx})`;
    idx++;
  }
  if (cities && cities.length > 0) {
    params.push(cities.map((c) => c.toLowerCase()));
    where += ` AND LOWER(pl.city) = ANY($${idx}::text[])`;
    idx++;
  }
  if (minPrice !== undefined) {
    params.push(minPrice);
    where += ` AND pl.price_per_month >= $${idx++}`;
  }
  if (maxPrice !== undefined) {
    params.push(maxPrice);
    where += ` AND pl.price_per_month <= $${idx++}`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM parking_listings pl WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  const distanceCol = useGeo
    ? `(6371 * acos(LEAST(1, cos(radians($1)) * cos(radians(pl.latitude)) *
       cos(radians(pl.longitude) - radians($2)) +
       sin(radians($1)) * sin(radians(pl.latitude))))) AS distance_km,`
    : '';
  const orderBy = useGeo ? 'distance_km ASC' : 'pl.created_at DESC';

  const result = await pool.query(
    `SELECT pl.id, pl.title, pl.address, pl.city, pl.latitude, pl.longitude,
            pl.total_spaces, pl.available_spaces, pl.price_per_month,
            pl.price_per_week, pl.price_per_day, pl.rating, pl.review_count,
            pl.has_cctv, pl.has_security_guard,
            ${distanceCol}
            pt.name AS parking_type, u.full_name AS owner_name,
            (SELECT pli.cloudinary_url FROM parking_listing_images pli
             WHERE pli.parking_listing_id = pl.id
             ORDER BY pli.display_order LIMIT 1) AS thumbnail_url
     FROM parking_listings pl
     LEFT JOIN parking_types pt ON pl.parking_type_id = pt.id
     LEFT JOIN users u ON pl.owner_id = u.id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, safeLimit, offset]
  );

  return { parkings: result.rows, total, page, limit: safeLimit };
}
