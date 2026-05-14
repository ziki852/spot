"use client";

import { useState } from "react";

export default function LikeButton({ initialCount }: { initialCount: number }) {
  const [liked, setLiked] = useState(false);
  const count = liked ? initialCount + 1 : initialCount;

  return (
    <button
      onClick={() => setLiked((v) => !v)}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all text-sm ${
        liked
          ? "bg-[#0e0e0e] text-[#fafaf8] border-[#0e0e0e]"
          : "bg-white text-[#0e0e0e]/60 border-[#0e0e0e]/15 hover:border-[#0e0e0e]/35"
      }`}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M7 12S1.5 8.5 1.5 4.75a2.75 2.75 0 0 1 5.5 0 2.75 2.75 0 0 1 5.5 0C12.5 8.5 7 12 7 12Z" />
      </svg>
      {count}
    </button>
  );
}
