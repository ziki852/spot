import { redirect } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import PostCard from "@/components/PostCard";
import { createClient } from "@/lib/supabase-server";
import type { Post } from "@/types";

type RawPost = {
  id: string;
  user_id: string;
  place_id: string | null;
  title: string;
  images: string[] | null;
  tags: string[] | null;
  like_count: number;
  is_public: boolean;
  created_at: string;
};

type RawPlace = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
};

export default async function JournalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: profileData }, { data: postRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, bio")
      .eq("id", user.id)
      .single(),
    supabase
      .from("posts")
      .select("id, user_id, place_id, title, images, tags, like_count, is_public, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const profile = profileData;
  const rows = (postRows ?? []) as unknown as RawPost[];

  const placeIds = [
    ...new Set(rows.map((r) => r.place_id).filter(Boolean)),
  ] as string[];

  const { data: placesData } =
    placeIds.length > 0
      ? await supabase
          .from("places")
          .select("id, name, slug, category, city")
          .in("id", placeIds)
      : { data: [] as RawPlace[] };

  const placeMap = Object.fromEntries(
    ((placesData ?? []) as unknown as RawPlace[]).map((p) => [p.id, p])
  );

  const posts: Post[] = rows.map((row) => {
    const place = row.place_id ? placeMap[row.place_id] : null;
    return {
      id: row.id,
      user_id: row.user_id,
      place_id: row.place_id,
      title: row.title,
      body: "",
      images: row.images ?? [],
      tags: row.tags ?? [],
      rating: null,
      is_public: row.is_public,
      like_count: row.like_count,
      created_at: row.created_at,
      author: profile
        ? {
            id: profile.id,
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio ?? null,
          }
        : undefined,
      place: place
        ? {
            id: place.id,
            google_place_id: "",
            name: place.name,
            slug: place.slug,
            category: place.category,
            address: "",
            city: place.city,
            postcode: "",
            lat: 0,
            lng: 0,
            google_rating: null,
            photo_refs: [],
            post_count: 0,
          }
        : null,
    };
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Nav />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl text-[#0e0e0e]"
            style={{ fontFamily: "var(--font-instrument-serif)" }}
          >
            My Journal
          </h1>
          <Link
            href="/posts/new"
            className="flex items-center gap-1.5 text-sm text-[#0e0e0e] bg-[#0e0e0e]/6 px-4 py-2 rounded-full hover:bg-[#0e0e0e]/12 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            New entry
          </Link>
        </div>

        {posts.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center gap-6">
            <p
              className="text-2xl text-[#0e0e0e]/60 max-w-xs leading-snug"
              style={{ fontFamily: "var(--font-instrument-serif)" }}
            >
              Start recording your favourite spots. Just for you.
            </p>
            <Link
              href="/posts/new"
              className="w-14 h-14 rounded-full bg-[#0e0e0e] text-[#fafaf8] flex items-center justify-center hover:bg-[#0e0e0e]/80 transition-colors"
              aria-label="Add your first entry"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path
                  d="M11 3v16M3 11h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="columns-2 gap-4">
            {posts.map((post) => (
              <div key={post.id} className="relative">
                {!post.is_public && (
                  <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-sm rounded-full p-1.5 leading-none pointer-events-none">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 14 14"
                      fill="none"
                      className="text-white"
                    >
                      <rect
                        x="2.5"
                        y="6"
                        width="9"
                        height="6.5"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.3"
                      />
                      <path
                        d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
