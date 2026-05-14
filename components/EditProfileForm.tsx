"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";

const BIO_MAX = 160;

export default function EditProfileForm({
  userId,
  username,
  initialDisplayName,
  initialBio,
}: {
  userId: string;
  username: string;
  initialDisplayName: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          bio: bio.trim() || null,
        })
        .eq("id", userId);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.push(`/profile/${username}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Display name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#0e0e0e]">
          Display name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={60}
          placeholder="Your name"
          className="w-full bg-white border border-[#0e0e0e]/12 rounded-xl px-4 py-3 text-sm text-[#0e0e0e] placeholder:text-[#0e0e0e]/30 focus:outline-none focus:border-[#0e0e0e]/30"
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-[#0e0e0e]">Bio</label>
        <div className="relative">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
            rows={3}
            placeholder="Tell people a bit about yourself…"
            className="w-full bg-white border border-[#0e0e0e]/12 rounded-xl px-4 py-3 text-sm text-[#0e0e0e] placeholder:text-[#0e0e0e]/30 focus:outline-none focus:border-[#0e0e0e]/30 resize-none"
          />
          <span className="absolute bottom-2.5 right-3 text-xs text-[#0e0e0e]/30">
            {bio.length}/{BIO_MAX}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-[#0e0e0e] text-[#fafaf8] text-sm py-3 rounded-full hover:bg-[#0e0e0e]/80 transition-colors disabled:opacity-40"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-[#0e0e0e]/50 border border-[#0e0e0e]/15 px-5 py-3 rounded-full hover:border-[#0e0e0e]/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
