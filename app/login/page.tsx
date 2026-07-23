"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { post } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setLoading(true); setError("");
    try {
      const d = await post("/auth/login", { email, password });
      router.push(d.onboarded ? "/discover" : "/onboarding?step=2");
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  const valid = /\S+@\S+\.\S+/.test(email) && password.length >= 8;

  return (
    <main className="min-h-dvh grid place-items-center px-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-md p-8">
        <div className="veil-orb h-14 w-14 text-xl mx-auto mb-6" aria-hidden />
        <h1 className="font-display text-2xl font-bold text-center">Welcome back</h1>
        <p className="mt-2 text-sm text-mist text-center">Sign in to find your people.</p>

        <div className="mt-8 space-y-3">
          <input className="field" type="email" autoComplete="email" placeholder="Email"
            value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="field" type="password" autoComplete="current-password"
            placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && valid && signIn()} />
        </div>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button onClick={signIn} disabled={!valid || loading} className="btn-primary w-full mt-6">
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-6 text-sm text-mist text-center">
          New here?{" "}
          <Link href="/onboarding" className="text-plum-500 hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </main>
  );
}
