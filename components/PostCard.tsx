import Link from "next/link";
import type { Post } from "@/types";

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

function AvatarPlaceholder({ username }: { username: string }) {
  return (
    <span className="w-6 h-6 rounded-full bg-[#0e0e0e]/10 flex items-center justify-center text-[10px] font-medium text-[#0e0e0e]/60 shrink-0 uppercase">
      {username[0]}
    </span>
  );
}

export default function PostCard({ post }: { post: Post }) {
  const firstImage = post.images?.[0];
  const gradient = gradientFor(post.id);

  return (
    <Link
      href={`/posts/${post.id}`}
      className="group block bg-white rounded-2xl border border-[#0e0e0e]/8 overflow-hidden hover:border-[#0e0e0e]/20 transition-colors break-inside-avoid mb-4"
    >
      {/* Image / gradient header */}
      <div className={`w-full aspect-[4/3] overflow-hidden ${!firstImage ? gradient : ""}`}>
        {firstImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firstImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full group-hover:scale-[1.02] transition-transform duration-300" />
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-[#0e0e0e] text-sm font-medium leading-snug line-clamp-2">
          {post.title}
        </h3>

        {post.place && (
          <span className="inline-flex items-center gap-1 self-start text-xs text-[#0e0e0e]/50 bg-[#fafaf8] border border-[#0e0e0e]/10 px-2 py-0.5 rounded-full">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1C3.34 1 2 2.34 2 4c0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3Zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="currentColor"/>
            </svg>
            {post.place.name}
          </span>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 min-w-0">
            {post.author && <AvatarPlaceholder username={post.author.username} />}
            <span className="text-xs text-[#0e0e0e]/40 truncate">
              @{post.author?.username}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#0e0e0e]/40 shrink-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 10.5S1 7.3 1 4a2.5 2.5 0 0 1 5 0 2.5 2.5 0 0 1 5 0c0 3.3-5 6.5-5 6.5Z" fill="currentColor"/>
            </svg>
            {post.like_count}
          </div>
        </div>
      </div>
    </Link>
  );
}
