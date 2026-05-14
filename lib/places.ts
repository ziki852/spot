import { getSupabaseClient } from "./supabase";

export type Place = {
  id?: string;
  google_place_id: string;
  name: string;
  slug: string;
  category: string;
  address: string;
  city: string;
  postcode: string;
  lat: number;
  lng: number;
  google_rating: number | null;
  photo_refs: string[];
  spot_rating: number | null;
  review_count: number;
};

type GooglePlacesResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  types: string[];
  photos?: { photo_reference: string }[];
};

const IGNORED_TYPES = new Set([
  "establishment",
  "point_of_interest",
  "food",
  "store",
  "premise",
  "locality",
  "political",
]);

function pickCategory(types: string[]): string {
  const meaningful = types.find((t) => !IGNORED_TYPES.has(t));
  return (meaningful ?? types[0] ?? "place").replace(/_/g, " ");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function extractPostcode(address: string): string {
  const match = address.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i);
  return match ? match[0].toUpperCase() : "";
}

function extractCity(address: string, fallback: string): string {
  // UK addresses typically end: ..., City, Postcode, UK
  const parts = address
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && p !== "UK" && p !== "United Kingdom");
  const postcodeIdx = parts.findIndex((p) =>
    /[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}/i.test(p)
  );
  if (postcodeIdx > 0) return parts[postcodeIdx - 1];
  if (parts.length >= 2) return parts[parts.length - 2];
  return fallback;
}

function mapGoogleResult(result: GooglePlacesResult, locationHint: string): Place {
  const city = extractCity(result.formatted_address, locationHint);
  return {
    google_place_id: result.place_id,
    name: result.name,
    slug: `${slugify(result.name)}-${slugify(city)}-${result.place_id.slice(-4)}`,
    category: pickCategory(result.types),
    address: result.formatted_address,
    city,
    postcode: extractPostcode(result.formatted_address),
    lat: result.geometry.location.lat,
    lng: result.geometry.location.lng,
    google_rating: result.rating ?? null,
    photo_refs: result.photos?.map((p) => p.photo_reference) ?? [],
    spot_rating: null,
    review_count: 0,
  };
}

export async function searchGooglePlaces(
  query: string,
  location: string
): Promise<Place[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not set");

  const textQuery = `${query} in ${location}`;
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/textsearch/json"
  );
  url.searchParams.set("query", textQuery);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("region", "uk");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Google Places API error: ${res.status}`);

  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API: ${data.status} — ${data.error_message ?? ""}`);
  }

  return (data.results as GooglePlacesResult[]).map((r) =>
    mapGoogleResult(r, location)
  );
}

export async function upsertPlacesToSupabase(places: Place[]): Promise<Place[]> {
  if (places.length === 0) return [];
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("places")
    .upsert(places, { onConflict: "google_place_id", ignoreDuplicates: false })
    .select();

  if (error) {
    console.error("Supabase upsert error:", error.message);
    return places; // fall back to returning Google data as-is
  }

  return data as Place[];
}
