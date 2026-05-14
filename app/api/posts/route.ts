import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    id,
    title,
    body: postBody,
    place_id,
    images,
    tags,
    rating,
    rating_food,
    rating_service,
    rating_vibe,
    rating_value,
    is_public,
  } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      id,
      user_id: user.id,
      title: title.trim(),
      body: postBody?.trim() ?? "",
      place_id: place_id ?? null,
      images: images ?? [],
      tags: tags ?? [],
      rating: rating ?? null,
      rating_food: rating_food ?? null,
      rating_service: rating_service ?? null,
      rating_vibe: rating_vibe ?? null,
      rating_value: rating_value ?? null,
      is_public: is_public ?? true,
      like_count: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
