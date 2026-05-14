import type { Place } from "@/lib/places";

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < filled ? "text-[#0e0e0e]" : "text-[#0e0e0e]/20"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function PlaceCard({ place }: { place: Place }) {
  const rating = place.spot_rating ?? place.google_rating;
  const isSpotRating = place.spot_rating !== null;

  return (
    <div className="flex flex-col gap-2 p-4 bg-white border border-[#0e0e0e]/10 rounded-2xl hover:border-[#0e0e0e]/25 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[#0e0e0e] font-medium text-base leading-snug">
          {place.name}
        </h3>
        {rating !== null && (
          <span className="text-xs text-[#0e0e0e]/50 shrink-0 mt-0.5">
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <span className="inline-block self-start text-xs px-2 py-0.5 rounded-full bg-[#fafaf8] border border-[#0e0e0e]/10 text-[#0e0e0e]/60 capitalize">
        {place.category}
      </span>

      {rating !== null && (
        <div className="flex items-center gap-2">
          <StarRating rating={rating} />
          <span className="text-xs text-[#0e0e0e]/40">
            {isSpotRating
              ? `${place.review_count} ${place.review_count === 1 ? "review" : "reviews"} on Spot`
              : "Google rating"}
          </span>
        </div>
      )}

      <p className="text-xs text-[#0e0e0e]/50 leading-relaxed mt-auto pt-1">
        {place.address}
      </p>
    </div>
  );
}
