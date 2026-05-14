import Link from "next/link";
import Nav from "@/components/Nav";
import HomeFeed from "@/components/HomeFeed";
import { createClient } from "@/lib/supabase-server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Nav />
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {!user && (
          <div className="flex items-center justify-between gap-4 bg-white border border-[#0e0e0e]/8 rounded-2xl px-5 py-4 mb-6">
            <p className="text-sm text-[#0e0e0e]/60">
              Keep a journal of everywhere you&apos;ve been.
            </p>
            <Link
              href="/auth/signup"
              className="shrink-0 text-sm text-[#0e0e0e] font-medium hover:opacity-60 transition-opacity whitespace-nowrap"
            >
              Sign up free →
            </Link>
          </div>
        )}
        <HomeFeed />
      </main>
    </div>
  );
}
