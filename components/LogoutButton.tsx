"use client";

import { logout } from "@/app/auth/actions";
import { useTransition } from "react";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={pending}
      className="text-sm text-[#0e0e0e]/60 px-3 py-2 rounded-full hover:bg-[#0e0e0e]/6 transition-colors disabled:opacity-40"
    >
      {pending ? "…" : "Log out"}
    </button>
  );
}
