import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import LogoutButton from "./LogoutButton";

export default async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const username =
    user?.user_metadata?.username ??
    user?.email?.split("@")[0] ??
    null;

  return (
    <nav className="w-full px-6 py-4 flex items-center justify-between bg-[#fafaf8] border-b border-[#0e0e0e]/8 sticky top-0 z-10 backdrop-blur-sm">
      <div className="flex items-center gap-5">
        <Link
          href="/"
          className="text-2xl text-[#0e0e0e] tracking-tight hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          Spot
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="text-sm text-[#0e0e0e]/55 hover:text-[#0e0e0e] px-3 py-1.5 rounded-full hover:bg-[#0e0e0e]/5 transition-colors"
          >
            Explore
          </Link>
          {user && (
            <Link
              href="/journal"
              className="text-sm text-[#0e0e0e]/55 hover:text-[#0e0e0e] px-3 py-1.5 rounded-full hover:bg-[#0e0e0e]/5 transition-colors"
            >
              My Journal
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
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
              Post
            </Link>

            <Link
              href="/profile/me"
              className="flex items-center gap-2 pl-1 hover:opacity-70 transition-opacity"
            >
              <span className="w-8 h-8 rounded-full bg-[#0e0e0e]/10 flex items-center justify-center text-xs font-medium text-[#0e0e0e]/60 uppercase select-none">
                {username?.[0] ?? "?"}
              </span>
              <span className="text-sm text-[#0e0e0e]/70 hidden sm:block">
                @{username}
              </span>
            </Link>

            <LogoutButton />
          </>
        ) : (
          <>
            <Link
              href="/auth/login"
              className="text-sm text-[#0e0e0e] px-4 py-2 rounded-full hover:bg-[#0e0e0e]/6 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm text-[#fafaf8] bg-[#0e0e0e] px-4 py-2 rounded-full hover:bg-[#0e0e0e]/80 transition-colors"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
