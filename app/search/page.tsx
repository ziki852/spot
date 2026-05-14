import Nav from "@/components/Nav";
import PlaceCard from "@/components/PlaceCard";
import { getSupabaseClient } from "@/lib/supabase";
import { searchGooglePlaces, upsertPlacesToSupabase, type Place } from "@/lib/places";

async function getPlaces(query: string, location: string): Promise<Place[]> {
  const supabase = getSupabaseClient();

  // Check Supabase cache first
  const { data: cached } = await supabase
    .from("places")
    .select("*")
    .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
    .ilike("city", `%${location}%`)
    .limit(20);

  if (cached && cached.length >= 5) return cached as Place[];

  // Fetch from Google Places and upsert
  try {
    const googlePlaces = await searchGooglePlaces(query, location);
    if (googlePlaces.length === 0) return cached ?? [];
    const upserted = await upsertPlacesToSupabase(googlePlaces);
    return upserted;
  } catch (err) {
    console.error("Google Places fetch failed:", err);
    return cached ?? [];
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string }>;
}) {
  const { q = "", location = "London" } = await searchParams;

  const places = q ? await getPlaces(q, location) : [];

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Nav />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {/* Search context */}
        <div className="mb-8">
          <h1
            className="text-3xl text-[#0e0e0e] mb-1"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            {q ? `${q} in ${location}` : "Search for a place"}
          </h1>
          {places.length > 0 && (
            <p className="text-sm text-[#0e0e0e]/50">
              {places.length} {places.length === 1 ? "result" : "results"}
            </p>
          )}
        </div>

        {/* Results */}
        {!q ? (
          <p className="text-[#0e0e0e]/50 text-sm">
            Enter a search term to find places.
          </p>
        ) : places.length === 0 ? (
          <p className="text-[#0e0e0e]/50 text-sm">
            No places found for &ldquo;{q}&rdquo; in {location}. Try a different search.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {places.map((place) => (
              <PlaceCard key={place.google_place_id ?? place.id} place={place} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
