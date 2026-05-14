"use client";

import { useState, useEffect } from "react";
import PostCard from "./PostCard";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import type { Post } from "@/types";

const PAGE_SIZE = 12;
const CITIES = ["All", "London", "Manchester", "Edinburgh", "Bristol"] as const;
type City = (typeof CITIES)[number];

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

type RawProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

type RawPlace = {
  id: string;
  name: string;
  slug: string;
  category: string;
  city: string;
};

function assemblePosts(
  rows: RawPost[],
  profileMap: Record<string, RawProfile>,
  placeMap: Record<string, RawPlace>
): Post[] {
  return rows.map((row) => {
    const profile = profileMap[row.user_id];
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
        ? { id: profile.id, username: profile.username, display_name: profile.display_name, avatar_url: profile.avatar_url, bio: null }
        : undefined,
      place: place
        ? { id: place.id, google_place_id: "", name: place.name, slug: place.slug, category: place.category, address: "", city: place.city, postcode: "", lat: 0, lng: 0, google_rating: null, photo_refs: [], post_count: 0 }
        : null,
    };
  });
}

async function fetchPage(
  city: City,
  from: number
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const supabase = createSupabaseBrowserClient();
  const to = from + PAGE_SIZE - 1;

  // ── 1. Fetch post rows ───────────────────────────────────────────────────
  let postsQuery = supabase
    .from("posts")
    .select("id, user_id, place_id, title, images, tags, like_count, is_public, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (city !== "All") {
    // Resolve place IDs for this city first
    const { data: cityPlaces } = await supabase
      .from("places")
      .select("id")
      .eq("city", city);

    const cityPlaceIds = (cityPlaces ?? []).map((p: { id: string }) => p.id);
    if (cityPlaceIds.length === 0) return { posts: [], hasMore: false };

    postsQuery = postsQuery.in("place_id", cityPlaceIds);
  }

  const { data: postRows } = await postsQuery;
  const rows = (postRows ?? []) as unknown as RawPost[];
  if (rows.length === 0) return { posts: [], hasMore: false };

  // ── 2. Batch-fetch authors + places in parallel ──────────────────────────
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const placeIds = [...new Set(rows.map((r) => r.place_id).filter(Boolean))] as string[];

  const [{ data: profiles }, { data: places }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds),
    placeIds.length > 0
      ? supabase
          .from("places")
          .select("id, name, slug, category, city")
          .in("id", placeIds)
      : Promise.resolve({ data: [] as RawPlace[], error: null }),
  ]);

  const profileMap = Object.fromEntries(
    ((profiles ?? []) as unknown as RawProfile[]).map((p) => [p.id, p])
  );
  const placeMap = Object.fromEntries(
    ((places ?? []) as unknown as RawPlace[]).map((p) => [p.id, p])
  );

  return {
    posts: assemblePosts(rows, profileMap, placeMap),
    hasMore: rows.length === PAGE_SIZE,
  };
}

// ── Skeleton card ──────────────────────────────────────────────────────────
function SkeletonCard({ tall }: { tall: boolean }) {
  return (
    <div className="break-inside-avoid mb-4 rounded-2xl overflow-hidden bg-white border border-[#0e0e0e]/6 animate-pulse">
      <div
        className={`w-full bg-[#0e0e0e]/6 ${tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}
      />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="h-2.5 bg-[#0e0e0e]/6 rounded-full w-3/4" />
        <div className="h-2.5 bg-[#0e0e0e]/6 rounded-full w-1/2" />
        <div className="h-2 bg-[#0e0e0e]/4 rounded-full w-1/3 mt-1" />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function HomeFeed() {
  const [city, setCity] = useState<City>("All");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(PAGE_SIZE);

  // Re-fetch from scratch whenever city changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setHasMore(false);

    fetchPage(city, 0).then(({ posts, hasMore }) => {
      if (cancelled) return;
      setPosts(posts);
      setHasMore(hasMore);
      setNextOffset(PAGE_SIZE);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [city]);

  async function loadMore() {
    setLoadingMore(true);
    const { posts: next, hasMore: more } = await fetchPage(city, nextOffset);
    setPosts((prev) => [...prev, ...next]);
    setHasMore(more);
    setNextOffset((off) => off + PAGE_SIZE);
    setLoadingMore(false);
  }

  return (
    <>
      {/* City filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {CITIES.map((c) => (
          <button
            key={c}
            onClick={() => setCity(c)}
            className={`shrink-0 text-sm px-4 py-1.5 rounded-full border transition-colors ${
              city === c
                ? "bg-[#0e0e0e] text-[#fafaf8] border-[#0e0e0e]"
                : "text-[#0e0e0e]/60 border-[#0e0e0e]/15 hover:border-[#0e0e0e]/35"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="columns-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} tall={i % 3 === 0} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-[#0e0e0e]/40 text-center py-20">
          {city === "All"
            ? "No posts yet. Be the first to share a spot."
            : `No posts in ${city} yet.`}
        </p>
      ) : (
        <>
          <div className="columns-2 gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8 pb-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="text-sm text-[#0e0e0e]/60 border border-[#0e0e0e]/15 px-6 py-2.5 rounded-full hover:border-[#0e0e0e]/35 hover:text-[#0e0e0e]/80 transition-colors disabled:opacity-40"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
