"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "../actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-2xl text-[#0e0e0e] tracking-tight mb-10"
          style={{ fontFamily: "var(--font-instrument-serif)" }}
        >
          Spot
        </Link>

        <h1 className="text-xl font-medium text-[#0e0e0e] mb-1">Welcome back</h1>
        <p className="text-sm text-[#0e0e0e]/50 mb-8">Log in to your account.</p>

        <form action={action} className="flex flex-col gap-3">
          {state?.error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {state.error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#0e0e0e]/60" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#0e0e0e]/15 bg-white text-[#0e0e0e] text-sm focus:outline-none focus:ring-2 focus:ring-[#0e0e0e]/20 placeholder-[#0e0e0e]/30"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#0e0e0e]/60" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#0e0e0e]/15 bg-white text-[#0e0e0e] text-sm focus:outline-none focus:ring-2 focus:ring-[#0e0e0e]/20 placeholder-[#0e0e0e]/30"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full py-3 rounded-xl bg-[#0e0e0e] text-[#fafaf8] text-sm font-medium hover:bg-[#0e0e0e]/80 transition-colors disabled:opacity-50"
          >
            {pending ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-[#0e0e0e]/50 text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[#0e0e0e] underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
