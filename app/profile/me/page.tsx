import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function MeRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[/profile/me] user:", user?.id, "metadata:", user?.user_metadata);

  if (!user) redirect("/auth/login");

  // Always look up the canonical username from the profiles table
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  console.log("[/profile/me] profile:", profile, "error:", error);

  if (error || !profile?.username) {
    // Fallback: try metadata, then email prefix
    const fallback =
      user.user_metadata?.username ?? user.email?.split("@")[0];
    if (!fallback) redirect("/");
    redirect(`/profile/${fallback}`);
  }

  redirect(`/profile/${profile.username}`);
}
