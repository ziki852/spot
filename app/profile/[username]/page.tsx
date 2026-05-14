import { notFound, redirect } from "next/navigation";
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

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch the profile by username
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, bio")
    .eq("username", username)
    .single();

  if (error || !profile) notFound();

  const isOwner =
    currentUser?.user_metadata?.username === username ||
    currentUser?.id === profile.id;

  // Fetch posts — owner sees all, visitor sees only public
  let postsQuery = supabase
    .from("posts")
    .select("id, user_id, place_id, title, images, tags, like_count, is_public, created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (!isOwner) {
    postsQuery = postsQuery.eq("is_public", true);
  }

  const { data: postRows } = await postsQuery;
  const rows = (postRows ?? []) as unknown as RawPost[];

  // Stats
  const totalPosts = rows.filter((r) => r.is_public).length;
  const totalLikes = rows.reduce((sum, r) => sum + (r.like_count ?? 0), 0);

  // Batch-fetch places for posts that have one
  const placeIds = [...new Set(rows.map((r) => r.place_id).filter(Boolean))] as string[];
  const { data: placesData } = placeIds.length > 0
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
      author: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
      },
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

  const initial = (profile.display_name || profile.username)?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Nav />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="flex items-start gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#0e0e0e]/10 flex items-center justify-center text-xl font-medium text-[#0e0e0e]/50 uppercase shrink-0 select-none">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-medium text-[#0e0e0e] leading-tight">
                {profile.display_name || profile.username}
              </h1>
              {isOwner && (
                <Link
                  href={`/profile/${username}/edit`}
                  className="text-xs text-[#0e0e0e]/50 border border-[#0e0e0e]/15 px-3 py-1 rounded-full hover:border-[#0e0e0e]/35 hover:text-[#0e0e0e]/75 transition-colors"
                >
                  Edit profile
                </Link>
              )}
            </div>
            <p className="text-sm text-[#0e0e0e]/40 mt-0.5">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-[#0e0e0e]/65 mt-2 leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 text-sm mb-8 pb-8 border-b border-[#0e0e0e]/8">
          <div>
            <span className="font-medium text-[#0e0e0e]">{totalPosts}</span>
            <span className="text-[#0e0e0e]/40 ml-1">{totalPosts === 1 ? "post" : "posts"}</span>
          </div>
          <div>
            <span className="font-medium text-[#0e0e0e]">{totalLikes}</span>
            <span className="text-[#0e0e0e]/40 ml-1">{totalLikes === 1 ? "like" : "likes"}</span>
          </div>
        </div>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <p className="text-sm text-[#0e0e0e]/40 text-center py-20">
            {isOwner ? "You haven't posted yet." : "No posts yet."}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {posts.map((post) => (
              <div key={post.id} className="relative">
                {!post.is_public && (
                  <div className="absolute top-2 right-2 z-10 bg-black/50 rounded-full p-1 leading-none">
                    <svg width="11" height="11" viewBox="0 0 14 14" fill="none" className="text-white">
                      <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
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
