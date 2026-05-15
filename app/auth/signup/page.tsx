"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup, signInWithGoogle } from "../actions";

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

export default function SignupPage() {
  const [state, action, pending] = useActionState(signup, null);

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

        <h1 className="text-xl font-medium text-[#0e0e0e] mb-1">Create an account</h1>
        <p className="text-sm text-[#0e0e0e]/50 mb-8">
          Join Spot and start recording your favourite places.
        </p>

        {/* Google OAuth */}
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#0e0e0e]/15 rounded-xl text-sm text-[#0e0e0e] font-medium hover:bg-[#f5f5f5] transition-colors"
          >
            <GoogleLogo />
            Continue with Google
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[#0e0e0e]/10" />
          <span className="text-xs text-[#0e0e0e]/35">or</span>
          <div className="flex-1 h-px bg-[#0e0e0e]/10" />
        </div>

        {/* Email / password */}
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
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-xl border border-[#0e0e0e]/15 bg-white text-[#0e0e0e] text-sm focus:outline-none focus:ring-2 focus:ring-[#0e0e0e]/20 placeholder-[#0e0e0e]/30"
              placeholder="Min. 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full py-3 rounded-xl bg-[#0e0e0e] text-[#fafaf8] text-sm font-medium hover:bg-[#0e0e0e]/80 transition-colors disabled:opacity-50"
          >
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-[#0e0e0e]/50 text-center mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#0e0e0e] underline underline-offset-2">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
