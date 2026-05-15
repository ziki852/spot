"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type ActionState = { error: string } | null;

export async function login(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) return { error: error.message };
  redirect("/journal");
}

export async function signup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Derive a username from the email prefix
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 25) || "user";

  // Append a numeric suffix if the base name is already taken
  let username = base;
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    username = base.slice(0, 22) + Math.floor(100 + Math.random() * 900);
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Signup failed. Please try again." };

  // Profile row is created by the handle_new_user trigger (SECURITY DEFINER),
  // which fires on INSERT into auth.users and reads username from raw_user_meta_data.
  // We must NOT insert here: when email confirmation is enabled, signUp returns
  // data.session = null, so this client is still anon — any direct table write
  // violates RLS even though the user record now exists.

  redirect("/journal");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: process.env.NEXT_PUBLIC_SITE_URL + "/auth/callback",
    },
  });

  if (error || !data.url) {
    // OAuth config error — redirect to login with a hint
    redirect("/auth/login?error=oauth");
  }

  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
