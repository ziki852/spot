import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import NewPostForm from "@/components/NewPostForm";
import { createClient } from "@/lib/supabase-server";

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="flex flex-col min-h-screen bg-[#fafaf8]">
      <Nav />
      <main className="w-full max-w-xl mx-auto px-4 py-10 pb-20">
        <h1
          className="text-3xl text-[#0e0e0e] mb-2"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          Record a spot
        </h1>
        <p className="text-sm text-[#0e0e0e]/40 mb-10">
          Capture a place worth remembering.
        </p>
        <NewPostForm userId={user.id} />
      </main>
    </div>
  );
}
