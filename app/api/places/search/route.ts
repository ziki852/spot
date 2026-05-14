import { NextRequest, NextResponse } from "next/server";
import { searchGooglePlaces } from "@/lib/places";
import { createClient } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const location = req.nextUrl.searchParams.get("location") ?? "London";

  if (q.trim().length < 2) return NextResponse.json([]);

  try {
    const googlePlaces = await searchGooglePlaces(q, location);
    if (googlePlaces.length === 0) return NextResponse.json([]);

    const supabase = await createClient();

    // Map old lib/places.ts schema → current DB schema (post_count, no spot_rating)
    const rows = googlePlaces.map((p) => ({
      google_place_id: p.google_place_id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      address: p.address,
      city: p.city,
      postcode: p.postcode,
      lat: p.lat,
      lng: p.lng,
      google_rating: p.google_rating,
      photo_refs: p.photo_refs,
      post_count: 0,
    }));

    const { data, error } = await supabase
      .from("places")
      .upsert(rows, { onConflict: "google_place_id", ignoreDuplicates: true })
      .select("id, name, category, address, city");

    if (error) {
      // Return partial shape without DB ids if upsert fails (e.g. RLS)
      return NextResponse.json(
        googlePlaces.slice(0, 6).map((p) => ({
          id: null,
          name: p.name,
          category: p.category,
          address: p.address,
          city: p.city,
        }))
      );
    }

    return NextResponse.json(data.slice(0, 6));
  } catch (err) {
    console.error("Places search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
