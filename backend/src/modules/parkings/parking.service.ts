import pool from "../../config/database";
import { ParkingRow, SearchFilters } from "../../types";

export async function createParking(
  ownerId: number,
  data: {
    title: string;
    description?: string;
    address: string;
    city: string;
    latitude?: number;
    longitude?: number;
    monthlyPrice: number;
    capacity: number;
    amenities?: string[];
    images?: string[];
  }
) {
  const result = await pool.query<ParkingRow>(
    `INSERT INTO parkings (owner_id, title, description, address, city, latitude, longitude, monthly_price, capacity, amenities, images)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      ownerId,
      data.title,
      data.description || null,
      data.address,
      data.city,
      data.latitude || null,
      data.longitude || null,
      data.monthlyPrice,
      data.capacity,
      data.amenities || [],
      data.images || [],
    ]
  );
  return withVacancy(result.rows[0]!);
}

export async function getOwnerParkings(ownerId: number) {
  const result = await pool.query<ParkingRow>(
    "SELECT * FROM parkings WHERE owner_id = $1 ORDER BY created_at DESC",
    [ownerId]
  );
  return result.rows.map(withVacancy);
}

export async function getParkingById(id: number) {
  const result = await pool.query<ParkingRow>(
    "SELECT * FROM parkings WHERE id = $1",
    [id]
  );
  const parking = result.rows[0];
  if (!parking) {
    throw Object.assign(new Error("Parking not found"), { status: 404 });
  }
  return withVacancy(parking);
}

export async function updateParking(
  id: number,
  ownerId: number,
  data: Partial<{
    title: string;
    description: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    monthlyPrice: number;
    capacity: number;
    amenities: string[];
    images: string[];
    status: string;
  }>
) {
  const parking = await getParkingById(id);
  if (parking.owner_id !== ownerId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const mappings: Record<string, string> = {
    title: "title",
    description: "description",
    address: "address",
    city: "city",
    latitude: "latitude",
    longitude: "longitude",
    monthlyPrice: "monthly_price",
    capacity: "capacity",
    amenities: "amenities",
    images: "images",
    status: "status",
  };

  for (const [key, column] of Object.entries(mappings)) {
    if ((data as Record<string, unknown>)[key] !== undefined) {
      fields.push(`${column} = $${idx++}`);
      values.push((data as Record<string, unknown>)[key]);
    }
  }

  if (fields.length === 0) return parking;

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query<ParkingRow>(
    `UPDATE parkings SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    values
  );
  return withVacancy(result.rows[0]!);
}

export async function deleteParking(id: number, ownerId: number) {
  const parking = await getParkingById(id);
  if (parking.owner_id !== ownerId) {
    throw Object.assign(new Error("Not authorized"), { status: 403 });
  }
  await pool.query("DELETE FROM parkings WHERE id = $1", [id]);
}

export async function searchParkings(filters: SearchFilters) {
  const conditions: string[] = ["status = 'active'"];
  const params: unknown[] = [];
  let idx = 1;

  if (filters.city) {
    conditions.push(`city ILIKE $${idx++}`);
    params.push(`%${filters.city}%`);
  }
  if (filters.minPrice !== undefined) {
    conditions.push(`monthly_price >= $${idx++}`);
    params.push(filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`monthly_price <= $${idx++}`);
    params.push(filters.maxPrice);
  }
  if (filters.amenities && filters.amenities.length > 0) {
    conditions.push(`amenities && $${idx++}`);
    params.push(filters.amenities);
  }

  const where = conditions.join(" AND ");
  const limit = Math.min(filters.limit || 12, 50);
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM parkings WHERE ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.count ?? "0");

  const result = await pool.query<ParkingRow>(
    `SELECT * FROM parkings WHERE ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
    [...params, limit, offset]
  );

  return {
    parkings: result.rows.map(withVacancy),
    total,
    page,
    limit,
  };
}

function withVacancy(parking: ParkingRow) {
  // TODO: subtract active bookings count once bookings table exists
  return { ...parking, vacancy: parking.capacity };
}
