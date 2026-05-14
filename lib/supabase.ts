import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Plain client for server-side utility use (lib/places.ts etc.)
export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Auth-aware client for "use client" components — shares the session from SSR cookies
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const supabase = getSupabaseClient();
