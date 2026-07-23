"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { post, patch, put } from "@/lib/api";

const GOALS = [
  ["FRIENDSHIP", "Friendship"], ["DATING", "Dating"], ["LONG_TERM", "Long term"],
  ["SHORT_TERM", "Short term"], ["MARRIAGE", "Marriage"],
] as const;
const LANGS = ["darija", "arabic", "french", "english", "spanish"];
const HOBBIES = ["football","surfing","reading","cooking","photography","gym","hiking","gaming","music","travel","volunteering","coding","art","pets"];
const TRAITS = ["funny","calm","romantic","creative","night_owl","early_bird","ambitious","adventurous"];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" data-on={on} onClick={onClick} aria-pressed={on}>
      {children}
    </button>
  );
}

function OnboardingInner() {
  const router = useRouter();
  const initialStep = Number(useSearchParams().get("step") ?? 1);
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 3));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1 — account + identity
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "">("");
  const [lookingFor, setLookingFor] = useState<"MALE" | "FEMALE" | "ANYONE" | "">("");
  const [goals, setGoals] = useState<string[]>([]);
  // Step 2 — location
  const [radius, setRadius] = useState(30);
  const [locStatus, setLocStatus] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  // Step 3 — personality (optional)
  const [languages, setLanguages] = useState<string[]>(["darija"]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [quote, setQuote] = useState("");

  const age = birthDate ? Math.floor((Date.now() - new Date(birthDate).getTime()) / 3.15576e10) : 0;
  const step1Valid =
    /\S+@\S+\.\S+/.test(email) && password.length >= 8 &&
    firstName.length >= 2 && age >= 18 && gender && lookingFor && goals.length > 0;

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function submitStep1() {
    setLoading(true); setError("");
    try {
      await post("/auth/register", { email, password, firstName, birthDate, gender, lookingFor, goals });
      setStep(2);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  function askLocation() {
    setLocStatus("asking");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await put("/me/location", {
            latitude: pos.coords.latitude, longitude: pos.coords.longitude, searchRadiusKm: radius,
          });
          setLocStatus("granted");
        } catch { setLocStatus("denied"); }
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: false, timeout: 12000 }
    );
  }

  async function submitStep3() {
    setError("");
    try {
      await patch("/me/profile", { languages, hobbies, traits, favoriteQuote: quote || undefined });
      router.push("/discover");
    } catch (e: any) { setError(e.message); }
  }

  return (
    <main className="min-h-dvh px-5 py-12 max-w-lg mx-auto">
      <div className="flex gap-2 mb-10" role="progressbar" aria-valuenow={step} aria-valuemax={3}>
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-plum-500" : "bg-white/10"}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold">Create your account</h1>
              <p className="text-sm text-mist mt-1">Just the essentials. Everything else is optional.</p>
            </div>
            <input className="field" type="email" autoComplete="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="field" type="password" autoComplete="new-password"
              placeholder="Password (8+ characters)" value={password}
              onChange={(e) => setPassword(e.target.value)} />
            <input className="field" placeholder="First name" value={firstName}
              onChange={(e) => setFirstName(e.target.value)} maxLength={30} />
            <div>
              <input type="date" className="field" value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                max={new Date(Date.now() - 18 * 3.15576e10).toISOString().slice(0, 10)}
                aria-label="Birth date" />
              {birthDate && age < 18 && (
                <p className="text-danger text-sm mt-2">You must be 18 or older to use NCHUFEK?.</p>
              )}
            </div>
            <div>
              <p className="text-sm text-mist mb-2">I am</p>
              <div className="flex gap-2">
                <Chip on={gender === "MALE"} onClick={() => setGender("MALE")}>Man</Chip>
                <Chip on={gender === "FEMALE"} onClick={() => setGender("FEMALE")}>Woman</Chip>
              </div>
            </div>
            <div>
              <p className="text-sm text-mist mb-2">Looking for</p>
              <div className="flex gap-2">
                <Chip on={lookingFor === "MALE"} onClick={() => setLookingFor("MALE")}>Men</Chip>
                <Chip on={lookingFor === "FEMALE"} onClick={() => setLookingFor("FEMALE")}>Women</Chip>
                <Chip on={lookingFor === "ANYONE"} onClick={() => setLookingFor("ANYONE")}>Anyone</Chip>
              </div>
            </div>
            <div>
              <p className="text-sm text-mist mb-2">Relationship goals</p>
              <div className="flex flex-wrap gap-2">
                {GOALS.map(([v, label]) => (
                  <Chip key={v} on={goals.includes(v)} onClick={() => toggle(goals, setGoals, v)}>{label}</Chip>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button className="btn-primary w-full" disabled={!step1Valid || loading} onClick={submitStep1}>
              {loading ? "Creating account…" : "Continue"}
            </button>
            <p className="text-xs text-mist/70 text-center leading-relaxed">
              By continuing you agree to our <a href="/terms" className="underline hover:text-white">Terms</a> and{" "}
              <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>. 18+ only.
            </p>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} className="space-y-6 text-center">
            <div className="veil-orb h-16 w-16 text-2xl mx-auto" aria-hidden />
            <div>
              <h1 className="font-display text-2xl font-bold">Where should we look?</h1>
              <p className="text-sm text-mist mt-2 leading-relaxed">
                We match you with people nearby. Your exact position is never stored —
                coordinates are rounded to about 1 km.
              </p>
            </div>
            <div className="glass p-5 text-left">
              <label className="text-sm text-mist flex justify-between">
                Search radius <span className="text-white font-medium">{radius} km</span>
              </label>
              <input type="range" min={20} max={50} step={10} value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full mt-3 accent-[#84319B]" />
              <div className="flex justify-between text-xs text-mist/60 mt-1">
                <span>20 km</span><span>30 km</span><span>40 km</span><span>50 km</span>
              </div>
            </div>
            {locStatus !== "granted" ? (
              <>
                <button className="btn-primary w-full" onClick={askLocation} disabled={locStatus === "asking"}>
                  {locStatus === "asking" ? "Waiting for permission…" : "Allow location"}
                </button>
                {locStatus === "denied" && (
                  <p className="text-sm text-danger">
                    Location denied. Enable it in your browser settings — matching needs a rough location to work.
                  </p>
                )}
              </>
            ) : (
              <button className="btn-primary w-full" onClick={() => setStep(3)}>
                Location saved — continue
              </button>
            )}
          </motion.section>
        )}

        {step === 3 && (
          <motion.section key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} className="space-y-6">
            <div>
              <h1 className="font-display text-2xl font-bold">What are you like?</h1>
              <p className="text-sm text-mist mt-1">
                The more you share, the better your matches. All optional.
              </p>
            </div>
            <div>
              <p className="text-sm text-mist mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {LANGS.map((l) => (
                  <Chip key={l} on={languages.includes(l)} onClick={() => toggle(languages, setLanguages, l)}>
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-mist mb-2">Hobbies</p>
              <div className="flex flex-wrap gap-2">
                {HOBBIES.map((h) => (
                  <Chip key={h} on={hobbies.includes(h)} onClick={() => toggle(hobbies, setHobbies, h)}>{h}</Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-mist mb-2">Personality</p>
              <div className="flex flex-wrap gap-2">
                {TRAITS.map((t) => (
                  <Chip key={t} on={traits.includes(t)} onClick={() => toggle(traits, setTraits, t)}>
                    {t.replace("_", " ")}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-mist mb-2">A quote that sounds like you</p>
              <input className="field" placeholder="e.g. The sea taught me patience."
                value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={200} />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button className="btn-primary w-full" onClick={submitStep3}>Find my people</button>
            <button className="btn-ghost w-full" onClick={() => router.push("/discover")}>Skip for now</button>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Onboarding() {
  return (
    <Suspense fallback={<div className="min-h-dvh grid place-items-center"><div className="skeleton h-40 w-72" /></div>}>
      <OnboardingInner />
    </Suspense>
  );
}
