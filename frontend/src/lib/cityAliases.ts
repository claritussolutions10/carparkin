// Mirrors backend/src/lib/citySlug.ts - keep the two in sync if this list
// changes. Needed because Google Places returns the official locality name
// (e.g. "Bengaluru"), not the colloquial name people actually search for
// (e.g. "Bangalore") - without this, /parking-in/bangalore would silently
// return zero results even with real Bangalore-area listings in the DB.
export const CITY_ALIASES: Record<string, { label: string; names: string[] }> = {
  bangalore: { label: 'Bangalore', names: ['Bangalore', 'Bengaluru'] },
  delhi: { label: 'Delhi', names: ['Delhi', 'New Delhi'] },
  mumbai: { label: 'Mumbai', names: ['Mumbai'] },
  chennai: { label: 'Chennai', names: ['Chennai'] },
  kolkata: { label: 'Kolkata', names: ['Kolkata', 'Calcutta'] },
  hyderabad: { label: 'Hyderabad', names: ['Hyderabad'] },
  pune: { label: 'Pune', names: ['Pune'] },
  ahmedabad: { label: 'Ahmedabad', names: ['Ahmedabad'] },
}

function titleCase(s: string): string {
  return s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function basicSlug(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// slug -> { label, names } for building a city landing page from a URL param.
export function resolveCitySlug(slug: string): { label: string; names: string[] } {
  const known = CITY_ALIASES[slug.toLowerCase()]
  if (known) return known
  const label = titleCase(slug)
  return { label, names: [label] }
}

// raw stored city name -> canonical marketing slug, for building links out
// to city pages (the "Browse by City" directory, the sitemap).
export function slugifyCity(rawCityName: string): string {
  const lower = rawCityName.toLowerCase().trim()
  for (const [slug, { names }] of Object.entries(CITY_ALIASES)) {
    if (names.some((n) => n.toLowerCase() === lower)) return slug
  }
  return basicSlug(rawCityName)
}
