"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { post } from "@/lib/api";

interface BlindCard {
  candidateId: string;
  compatibility: number;
  distanceKm: number;
  age: number;
  city?: string;
  online: boolean;
  personality?: string;
  traits: string[];
  hobbies: string[];
  favoriteQuote?: string;
  languages: string[];
}

function CompatibilityRing({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
        <defs>
          <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#84319B" />
            <stop offset="100%" stopColor="#31D67B" />
          </linearGradient>
        </defs>

        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          className="ring-track"
        />

        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          strokeWidth="6"
          className="ring-fill"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>

      <span className="absolute inset-0 grid place-items-center font-display font-bold">
        {value}
        <span className="text-xs">%</span>
      </span>
    </div>
  );
}

export default function Discover() {
  const router = useRouter();

  const [state, setState] = useState<"idle" | "searching" | "results">(
    "idle"
  );
  const [cards, setCards] = useState<BlindCard[]>([]);
  const [error, setError] = useState("");

  async function findMatch() {
    setState("searching");
    setError("");

    try {
      const [d] = await Promise.all([
        post<{ matches: BlindCard[] }>("/matches/find"),
        new Promise((r) => setTimeout(r, 1600)),
      ]);

      setCards(d.matches);
      setState("results");
    } catch (e: any) {
      setError(
        e.status === 422
          ? "Add your location in Settings first — matching needs it."
          : e.message
      );
      setState("idle");
    }
  }

  async function startChat(candidateId: string) {
    const d = await post("/matches", { candidateId });
    router.push(`/chat?m=${d.match.id}`);
  }

  return (
    <main className="min-h-dvh px-5 py-10 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-10">
        <h1 className="font-display font-bold text-xl">
          NCHUFEK<span className="text-plum-500">?</span>
        </h1>

        <nav className="flex gap-4 text-sm text-mist">
          <a href="/profile" className="hover:text-white">
            Profile
          </a>
          <a href="/chat" className="hover:text-white">
            Chats
          </a>
          <a href="/settings" className="hover:text-white">
            Settings
          </a>
        </nav>
      </header>

      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.section
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pt-16"
          >
            <div
              className="veil-orb h-32 w-32 text-4xl mx-auto"
              aria-hidden
            />

            <h2 className="font-display text-3xl font-bold mt-8">
              Ready when you are
            </h2>

            <p className="text-mist mt-3 max-w-sm mx-auto leading-relaxed">
              One press. We score everyone nearby across eleven dimensions and
              bring you your top ten. No swiping. No faces. Just fit.
            </p>

            {error && (
              <p className="text-danger text-sm mt-4">{error}</p>
            )}

            <button
              onClick={findMatch}
              className="btn-primary mt-8 text-lg !px-10 !py-4"
            >
              Find My Match
            </button>
          </motion.section>
        )}

        {state === "searching" && (
          <motion.section
            key="search"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center pt-16"
          >
            <motion.div
              className="veil-orb h-32 w-32 text-4xl mx-auto"
              animate={{ rotate: 360 }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear",
              }}
            />

            <p className="text-mist mt-8 animate-pulse">
              Reading personalities near you…
            </p>

            <div className="mt-8 space-y-3 max-w-md mx-auto">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-24" />
              ))}
            </div>
          </motion.section>
        )}

        {state === "results" && (
          <motion.section
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">
                Your top {cards.length}
              </h2>

              <button
                onClick={findMatch}
                className="text-sm text-plum-500 hover:underline"
              >
                Search again
              </button>
            </div>

            {cards.length === 0 && (
              <div className="glass p-8 text-center">
                <p className="font-medium">
                  No one in range right now.
                </p>

                <p className="text-sm text-mist mt-2">
                  Widen your radius in Settings, or check back tonight —
                  most people are online after 8pm.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {cards.map((c, i) => (
                <motion.article
                  key={c.candidateId}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.07,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="glass glass-hover p-6"
                >
                  <div className="flex gap-5">
                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <div
                        className="veil-orb h-16 w-16 text-2xl"
                        aria-label="Hidden profile"
                      />

                      <CompatibilityRing value={c.compatibility} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-lg">
                          {c.age}
                        </span>

                        <span className="text-mist text-sm">
                          · {c.distanceKm} km away
                        </span>

                        {c.city && (
                          <span className="text-mist text-sm">
                            · {c.city}
                          </span>
                        )}

                        {c.online && (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                            online
                          </span>
                        )}
                      </div>

                      {c.favoriteQuote && (
                        <p className="mt-2 text-sm italic text-mist">
                          &ldquo;{c.favoriteQuote}&rdquo;
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {c.personality && (
                          <span className="chip !py-1 !px-2.5 !text-xs !cursor-default">
                            {c.personality.toLowerCase()}
                          </span>
                        )}

                        {c.traits.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="chip !py-1 !px-2.5 !text-xs !cursor-default"
                          >
                            {t.replace("_", " ")}
                          </span>
                        ))}

                        {c.hobbies.slice(0, 4).map((h) => (
                          <span
                            key={h}
                            className="chip !py-1 !px-2.5 !text-xs !cursor-default"
                            data-on="true"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => startChat(c.candidateId)}
                    className="btn-primary w-full mt-5 !py-3"
                  >
                    Start talking
                  </button>
                </motion.article>
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}