"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

type PlaceResult = {
  id: string | null;
  name: string;
  category: string;
  address: string;
  city: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-[#0e0e0e]/20 border-t-[#0e0e0e]/60 rounded-full animate-spin" />
  );
}

export default function NewPostForm({ userId }: { userId: string }) {
  const router = useRouter();

  // ── Image state ──────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach(URL.revokeObjectURL);
  }, [images]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []).filter(
      (f) => f.size <= 10 * 1024 * 1024
    );
    setImages((prev) => [...prev, ...incoming].slice(0, 9));
    e.target.value = "";
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

  // ── Text fields ───────────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // ── Place search ──────────────────────────────────────────────────────────
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [placeQuery, setPlaceQuery] = useState("");
  const [placeResults, setPlaceResults] = useState<PlaceResult[]>([]);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const debouncedQuery = useDebounce(placeQuery, 500);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setPlaceResults([]);
      setShowDropdown(false);
      return;
    }
    setPlaceLoading(true);
    fetch(
      `/api/places/search?q=${encodeURIComponent(debouncedQuery)}&location=London`
    )
      .then((r) => r.json())
      .then((data) => {
        const results = Array.isArray(data) ? data : [];
        setPlaceResults(results);
        setShowDropdown(results.length > 0);
      })
      .catch(console.error)
      .finally(() => setPlaceLoading(false));
  }, [debouncedQuery]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function selectPlace(place: PlaceResult) {
    setSelectedPlace(place);
    setShowDropdown(false);
    setPlaceQuery("");
  }

  function clearPlace() {
    setSelectedPlace(null);
    setPlaceQuery("");
    setPlaceResults([]);
  }

  // ── Tags ─────────────────────────────────────────────────────────────────
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const commitTag = useCallback(() => {
    const tag = tagInput
      .trim()
      .toLowerCase()
      .replace(/^#+/, "")
      .replace(/[^a-z0-9-]/g, "");
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  // ── Ratings ───────────────────────────────────────────────────────────────
  type RatingKey = "food" | "service" | "vibe" | "value";
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    food: 0, service: 0, vibe: 0, value: 0,
  });
  const [ratingHover, setRatingHover] = useState<Record<RatingKey, number>>({
    food: 0, service: 0, vibe: 0, value: 0,
  });

  function toggleRating(key: RatingKey, star: number) {
    setRatings((prev) => ({ ...prev, [key]: prev[key] === star ? 0 : star }));
  }

  // ── Visibility ────────────────────────────────────────────────────────────
  const [isPublic, setIsPublic] = useState(false);

  // ── Submit ────────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const postId = crypto.randomUUID();
    const supabase = createSupabaseBrowserClient();
    const imageUrls: string[] = [];

    // Upload images sequentially to avoid flooding storage
    for (const file of images) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${postId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("post-images")
        .upload(path, file, { contentType: file.type });

      if (uploadErr) {
        setError(`Image upload failed: ${uploadErr.message}`);
        setSubmitting(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("post-images").getPublicUrl(path);

      imageUrls.push(publicUrl);
    }

    // Create post
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: postId,
        title: title.trim(),
        body: body.trim(),
        place_id: selectedPlace?.id ?? null,
        images: imageUrls,
        tags,
        rating: null,
        rating_food: ratings.food || null,
        rating_service: ratings.service || null,
        rating_vibe: ratings.vibe || null,
        rating_value: ratings.value || null,
        is_public: isPublic,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      setError(payload.error ?? "Something went wrong. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(`/posts/${postId}`);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* ── Images ── */}
      <section>
        <p className="text-sm font-medium text-[#0e0e0e] mb-3">
          Photos{" "}
          <span className="text-[#0e0e0e]/40 font-normal">
            — up to 9
          </span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {previews.map((url, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-xl overflow-hidden bg-[#0e0e0e]/5"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="Remove image"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}

          {images.length < 9 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-[#0e0e0e]/15 flex flex-col items-center justify-center gap-1.5 text-[#0e0e0e]/30 hover:border-[#0e0e0e]/30 hover:text-[#0e0e0e]/50 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 4v12M4 10h12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px]">Add photo</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <p className="text-xs text-[#0e0e0e]/30 mt-2">
          JPEG, PNG or WebP · max 10 MB each
        </p>
      </section>

      {/* ── Title ── */}
      <section>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-[#0e0e0e] mb-2"
        >
          Title <span className="text-red-400">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's the spot?"
          maxLength={120}
          required
          className="w-full px-4 py-3 rounded-xl border border-[#0e0e0e]/15 bg-white text-[#0e0e0e] text-sm placeholder-[#0e0e0e]/30 focus:outline-none focus:ring-2 focus:ring-[#0e0e0e]/20"
        />
      </section>

      {/* ── Body ── */}
      <section>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-[#0e0e0e] mb-2"
        >
          Your take{" "}
          <span className="text-[#0e0e0e]/40 font-normal">— optional</span>
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What made this place worth sharing?"
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-xl border border-[#0e0e0e]/15 bg-white text-[#0e0e0e] text-sm placeholder-[#0e0e0e]/30 focus:outline-none focus:ring-2 focus:ring-[#0e0e0e]/20 resize-none"
        />
        <p className="text-xs text-[#0e0e0e]/25 text-right mt-1">
          {body.length}/1000
        </p>
      </section>

      {/* ── Place search ── */}
      <section>
        <p className="text-sm font-medium text-[#0e0e0e] mb-2">
          Place{" "}
          <span className="text-[#0e0e0e]/40 font-normal">— optional</span>
        </p>

        {selectedPlace ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#0e0e0e]/15 rounded-xl">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              className="text-[#0e0e0e]/40 shrink-0"
            >
              <path d="M7 1C4.79 1 3 2.79 3 5c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4Zm0 5.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#0e0e0e] font-medium truncate">
                {selectedPlace.name}
              </p>
              <p className="text-xs text-[#0e0e0e]/40 truncate">
                {selectedPlace.address}
              </p>
            </div>
            <button
              type="button"
              onClick={clearPlace}
              className="text-[#0e0e0e]/30 hover:text-[#0e0e0e]/70 transition-colors shrink-0"
              aria-label="Remove place"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 2l10 10M12 2L2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ) : (
          <div ref={dropdownRef} className="relative">
            <input
              type="text"
              value={placeQuery}
              onChange={(e) => {
                setPlaceQuery(e.target.value);
                setShowDropdown(false);
              }}
              onFocus={() => placeResults.length > 0 && setShowDropdown(true)}
              placeholder="Search for a restaurant, café, pub…"
              className="w-full px-4 py-3 rounded-xl border border-[#0e0e0e]/15 bg-white text-[#0e0e0e] text-sm placeholder-[#0e0e0e]/30 focus:outline-none focus:ring-2 focus:ring-[#0e0e0e]/20"
            />
            {placeLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Spinner />
              </div>
            )}

            {showDropdown && placeResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#0e0e0e]/10 rounded-xl shadow-md overflow-hidden z-10">
                {placeResults.map((place, i) => (
                  <button
                    key={place.id ?? i}
                    type="button"
                    onClick={() => selectPlace(place)}
                    className="w-full text-left px-4 py-3 hover:bg-[#fafaf8] transition-colors border-b border-[#0e0e0e]/5 last:border-0"
                  >
                    <p className="text-sm text-[#0e0e0e] font-medium">
                      {place.name}
                    </p>
                    <p className="text-xs text-[#0e0e0e]/40 truncate mt-0.5">
                      {place.address}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Tags ── */}
      <section>
        <p className="text-sm font-medium text-[#0e0e0e] mb-2">
          Tags{" "}
          <span className="text-[#0e0e0e]/40 font-normal">— optional</span>
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 text-xs text-[#0e0e0e]/60 bg-white border border-[#0e0e0e]/12 px-3 py-1 rounded-full"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="text-[#0e0e0e]/30 hover:text-[#0e0e0e]/70 transition-colors"
                  aria-label={`Remove #${tag}`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {tags.length < 10 && (
          <input
            type="text"
            value={tagInput}
            onChange={(e) =>
              setTagInput(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))
            }
            onKeyDown={handleTagKeyDown}
            onBlur={commitTag}
            placeholder="Type a tag and press Enter"
            className="w-full px-4 py-3 rounded-xl border border-[#0e0e0e]/15 bg-white text-[#0e0e0e] text-sm placeholder-[#0e0e0e]/30 focus:outline-none focus:ring-2 focus:ring-[#0e0e0e]/20"
          />
        )}
        <p className="text-xs text-[#0e0e0e]/25 mt-1.5">{tags.length}/10</p>
      </section>

      {/* ── Ratings ── */}
      <section>
        <p className="text-sm font-medium text-[#0e0e0e] mb-4">
          Ratings{" "}
          <span className="text-[#0e0e0e]/40 font-normal">— optional</span>
        </p>
        <div className="flex flex-col gap-3">
          {(
            [
              { key: "food", emoji: "🍴", label: "Food" },
              { key: "service", emoji: "👋", label: "Service" },
              { key: "vibe", emoji: "✨", label: "Vibe" },
              { key: "value", emoji: "💰", label: "Value" },
            ] as const
          ).map(({ key, emoji, label }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-24 text-sm text-[#0e0e0e]/60 flex items-center gap-1.5 shrink-0">
                <span>{emoji}</span> {label}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => toggleRating(key, star)}
                    onMouseEnter={() =>
                      setRatingHover((h) => ({ ...h, [key]: star }))
                    }
                    onMouseLeave={() =>
                      setRatingHover((h) => ({ ...h, [key]: 0 }))
                    }
                    className="p-0.5 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`${label} ${star} star${star !== 1 ? "s" : ""}`}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`transition-colors duration-100 ${
                        star <= (ratingHover[key] || ratings[key])
                          ? "text-[#0e0e0e]"
                          : "text-[#0e0e0e]/12"
                      }`}
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                {ratings[key] > 0 && (
                  <span className="ml-1.5 text-xs text-[#0e0e0e]/35">
                    {ratings[key]}/5
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Visibility ── */}
      <section>
        <p className="text-sm font-medium text-[#0e0e0e] mb-3">Visibility</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors ${
              isPublic
                ? "bg-[#0e0e0e] text-[#fafaf8] border-[#0e0e0e]"
                : "bg-white text-[#0e0e0e]/60 border-[#0e0e0e]/15 hover:border-[#0e0e0e]/30"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <ellipse cx="7" cy="7" rx="2.5" ry="5.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M1.5 5h11M1.5 9h11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Public
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm transition-colors ${
              !isPublic
                ? "bg-[#0e0e0e] text-[#fafaf8] border-[#0e0e0e]"
                : "bg-white text-[#0e0e0e]/60 border-[#0e0e0e]/15 hover:border-[#0e0e0e]/30"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="2.5" y="6" width="9" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Just me
          </button>
        </div>
        {!isPublic && (
          <p className="text-xs text-[#0e0e0e]/40 mt-2">
            Only you will be able to see this post.
          </p>
        )}
      </section>

      {/* ── Submit ── */}
      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="w-full py-3.5 rounded-xl bg-[#0e0e0e] text-[#fafaf8] text-sm font-medium hover:bg-[#0e0e0e]/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting && <Spinner />}
        {submitting
          ? isPublic
            ? "Publishing…"
            : "Saving…"
          : isPublic
          ? "Publish to Explore"
          : "Save to journal"}
      </button>
    </form>
  );
}
