import { notFound } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import LikeButton from "@/components/LikeButton";
import { createClient } from "@/lib/supabase-server";

const GRADIENTS = [
  "bg-gradient-to-br from-rose-100 to-pink-200",
  "bg-gradient-to-br from-amber-100 to-orange-200",
  "bg-gradient-to-br from-sky-100 to-blue-200",
  "bg-gradient-to-br from-emerald-100 to-teal-200",
  "bg-gradient-to-br from-violet-100 to-purple-200",
  "bg-gradient-to-br from-lime-100 to-green-200",
];

function gradientFor(id: string) {
  const n = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[n % GRADIENTS.length];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-[#0e0e0e]" : "text-[#0e0e0e]/15"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch post
  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) notFound();

  // Fetch author + place in parallel
  const [{ data: author }, { data: place }] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, display_name, avatar_url")
      .eq("id", post.user_id)
      .single(),
    post.place_id
      ? supabase
          .from("places")
          .select("id, name, slug, category, address, city")
          .eq("id", post.place_id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const images: string[] = Array.isArray(post.images) ? post.images : [];
  const tags: string[] = Array.isArray(post.tags) ? post.tags : [];
  const gradient = gradientFor(post.id);

  const formattedDate = new Date(post.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Nav />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-10 pb-20">
        {/* Private banner */}
        {post.is_public === false && (
          <div className="flex items-center gap-2 text-sm text-[#0e0e0e]/60 bg-[#0e0e0e]/5 border border-[#0e0e0e]/10 rounded-xl px-4 py-3 mb-6">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Only you can see this post
          </div>
        )}

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#0e0e0e]/40 hover:text-[#0e0e0e] transition-colors mb-6"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 2 4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Feed
        </Link>

        {/* Images */}
        {images.length > 0 ? (
          <div className="flex flex-col gap-2 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={post.title}
              className="w-full rounded-2xl object-cover"
              style={{ aspectRatio: "4/3" }}
            />
            {images.length > 1 && (
              <div
                className={`grid gap-2 ${
                  images.length === 2 ? "grid-cols-2" : "grid-cols-3"
                }`}
              >
                {images.slice(1).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-full rounded-xl object-cover aspect-square"
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`w-full rounded-2xl mb-6 ${gradient}`}
            style={{ aspectRatio: "4/3" }}
          />
        )}

        {/* Title */}
        <h1
          className="text-3xl text-[#0e0e0e] leading-tight mb-4"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          {post.title}
        </h1>

        {/* Author + date */}
        <div className="flex items-center gap-2.5 mb-5">
          <span className="w-8 h-8 rounded-full bg-[#0e0e0e]/10 flex items-center justify-center text-xs font-medium text-[#0e0e0e]/60 uppercase shrink-0">
            {author?.username?.[0] ?? "?"}
          </span>
          <div>
            <p className="text-sm text-[#0e0e0e] font-medium leading-tight">
              {author?.display_name ?? author?.username ?? "Unknown"}
            </p>
            <p className="text-xs text-[#0e0e0e]/40">
              @{author?.username ?? "—"} · {formattedDate}
            </p>
          </div>
        </div>

        {/* Dimensional ratings */}
        {(post.rating_food || post.rating_service || post.rating_vibe || post.rating_value) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {(
              [
                { key: "rating_food", emoji: "🍴", label: "Food" },
                { key: "rating_service", emoji: "👋", label: "Service" },
                { key: "rating_vibe", emoji: "✨", label: "Vibe" },
                { key: "rating_value", emoji: "💰", label: "Value" },
              ] as const
            )
              .filter(({ key }) => post[key])
              .map(({ key, emoji, label }) => (
                <span
                  key={key}
                  className="flex items-center gap-1.5 text-sm bg-white border border-[#0e0e0e]/10 px-3 py-1.5 rounded-full text-[#0e0e0e]/70"
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                  <span className="font-medium text-[#0e0e0e]">
                    {post[key]}/5
                  </span>
                </span>
              ))}
          </div>
        )}

        {/* Place chip */}
        {place && (
          <div className="mb-5">
            <Link
              href={`/places/${place.slug}`}
              className="inline-flex items-center gap-1.5 text-sm text-[#0e0e0e]/60 bg-white border border-[#0e0e0e]/12 px-3 py-1.5 rounded-full hover:border-[#0e0e0e]/30 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1C4.07 1 2.5 2.57 2.5 4.5 2.5 7.25 6 11 6 11s3.5-3.75 3.5-6.5C9.5 2.57 7.93 1 6 1Zm0 4.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
              </svg>
              {place.name}
              <span className="text-[#0e0e0e]/25">·</span>
              <span className="capitalize text-[#0e0e0e]/40">{place.category}</span>
            </Link>
          </div>
        )}

        {/* Body */}
        {post.body && (
          <p className="text-[#0e0e0e]/75 text-base leading-relaxed mb-6 whitespace-pre-wrap">
            {post.body}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-[#0e0e0e]/50 bg-white border border-[#0e0e0e]/10 px-2.5 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Like */}
        <LikeButton initialCount={post.like_count ?? 0} />
      </main>
    </div>
  );
}
