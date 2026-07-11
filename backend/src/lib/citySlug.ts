// Mirrors the alias table in frontend/src/lib/cityAliases.ts - keep the two
// in sync if this list changes. Needed because Google Places returns the
// official locality name (e.g. "Bengaluru"), not the colloquial name people
// actually search for (e.g. "Bangalore") - the sitemap should link to the
// marketing-friendly slug when one is known.
const CITY_ALIASES: Record<string, string[]> = {
  bangalore: ["Bangalore", "Bengaluru"],
  delhi: ["Delhi", "New Delhi"],
  mumbai: ["Mumbai"],
  chennai: ["Chennai"],
  kolkata: ["Kolkata", "Calcutta"],
  hyderabad: ["Hyderabad"],
  pune: ["Pune"],
  ahmedabad: ["Ahmedabad"],
};

function basicSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function slugifyCity(rawCityName: string): string {
  const lower = rawCityName.toLowerCase().trim();
  for (const [slug, names] of Object.entries(CITY_ALIASES)) {
    if (names.some((n) => n.toLowerCase() === lower)) return slug;
  }
  return basicSlug(rawCityName);
}
