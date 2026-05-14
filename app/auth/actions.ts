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
  redirect("/");
}

export async function signup(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const username = (formData.get("username") as string).trim().toLowerCase();

  // Check username is available
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) return { error: "Username is already taken." };

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

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
