import { redirect, notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase-server";
import EditProfileForm from "@/components/EditProfileForm";

export default async function EditProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const currentUsername =
    user.user_metadata?.username ?? user.email?.split("@")[0];

  if (currentUsername !== username) notFound();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .eq("id", user.id)
    .single();

  if (error || !profile) notFound();

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Nav />
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-10">
        <h1
          className="text-3xl text-[#0e0e0e] mb-8"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          Edit profile
        </h1>
        <EditProfileForm
          userId={user.id}
          username={profile.username}
          initialDisplayName={profile.display_name ?? ""}
          initialBio={profile.bio ?? ""}
        />
      </main>
    </div>
  );
}
