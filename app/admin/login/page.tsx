"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    if (!res || res.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="font-display text-2xl font-bold text-ink">Admin sign in</h1>

      <form onSubmit={handleCredentials} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink/80">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-full bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Sign in
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
        <div className="h-px flex-1 bg-black/10" />
        OR
        <div className="h-px flex-1 bg-black/10" />
      </div>

      <div className="space-y-2">
        <button
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="w-full rounded-full border border-black/10 py-2.5 text-sm font-medium hover:bg-black/5"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn("microsoft-entra-id", { callbackUrl: "/admin" })}
          className="w-full rounded-full border border-black/10 py-2.5 text-sm font-medium hover:bg-black/5"
        >
          Continue with Microsoft
        </button>
      </div>
    </div>
  );
}
