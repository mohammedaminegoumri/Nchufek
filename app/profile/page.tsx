"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, patch } from "@/lib/api";

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

export default function Profile() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [favoriteQuote, setQuote] = useState("");
  const [bio, setBio] = useState("");
  const [heightCm, setHeight] = useState("");
  const [personality, setPersonality] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [traits, setTraits] = useState<string[]>([]);
  const [instagram, setInstagram] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>(["", "", "", "", "", ""]);

  useEffect(() => {
    api("/me").then((me) => {
      const p = me.profile ?? {};
      setQuote(p.favoriteQuote ?? "");
      setBio(p.bio ?? "");
      setHeight(p.heightCm ? String(p.heightCm) : "");
      setPersonality(p.personality ?? "");
      setLanguages(p.languages ?? []);
      setHobbies(p.hobbies ?? []);
      setTraits(p.traits ?? []);
      setInstagram(p.instagram ?? "");
      const urls = [...(p.photoUrls ?? [])];
      while (urls.length < 6) urls.push("");
      setPhotoUrls(urls.slice(0, 6));
      setLoaded(true);
    }).catch(() => router.replace("/login"));
  }, [router]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      await patch("/me/profile", {
        favoriteQuote: favoriteQuote || null,
        bio: bio || null,
        heightCm: heightCm ? Number(heightCm) : null,
        personality: personality || null,
        languages, hobbies, traits,
        instagram: instagram.replace(/^@/, "") || null,
        photoUrls: photoUrls.map((u) => u.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  }

  if (!loaded)
    return <main className="min-h-dvh grid place-items-center"><div className="skeleton h-40 w-72" /></main>;

  return (
    <main className="min-h-dvh px-5 py-10 max-w-lg mx-auto space-y-6">
      <header className="flex items-center gap-4">
        <a href="/discover" className="text-mist hover:text-white" aria-label="Back">←</a>
        <h1 className="font-display text-2xl font-bold">Edit profile</h1>
      </header>

      <section className="glass p-6 space-y-4">
        <h2 className="font-display font-semibold">About you</h2>
        <div>
          <p className="text-sm text-mist mb-2">A quote that sounds like you</p>
          <input className="field" maxLength={200} value={favoriteQuote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="e.g. The sea taught me patience." />
        </div>
        <div>
          <p className="text-sm text-mist mb-2">Bio</p>
          <textarea className="field resize-none" rows={3} maxLength={500} value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A few honest lines about you." />
        </div>
        <div>
          <p className="text-sm text-mist mb-2">Height (cm)</p>
          <input className="field" type="number" min={120} max={230} value={heightCm}
            onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 172" />
        </div>
        <div>
          <p className="text-sm text-mist mb-2">Personality</p>
          <div className="flex gap-2">
            {["INTROVERT", "EXTROVERT", "AMBIVERT"].map((p) => (
              <Chip key={p} on={personality === p}
                onClick={() => setPersonality(personality === p ? "" : p)}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </Chip>
            ))}
          </div>
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
          <p className="text-sm text-mist mb-2">Traits</p>
          <div className="flex flex-wrap gap-2">
            {TRAITS.map((t) => (
              <Chip key={t} on={traits.includes(t)} onClick={() => toggle(traits, setTraits, t)}>
                {t.replace("_", " ")}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="glass p-6 space-y-4">
        <h2 className="font-display font-semibold">Revealed only with mutual consent</h2>
        <p className="text-xs text-mist leading-relaxed">
          Photos and Instagram stay invisible until both you and a match press reveal.
          For photos: upload your picture to a free host like <span className="text-white">imgbb.com</span>,
          copy the <span className="text-white">direct link</span> (ends in .jpg or .png), and paste it below.
        </p>
        <div>
          <p className="text-sm text-mist mb-2">Instagram username</p>
          <input className="field" value={instagram}
            onChange={(e) => setInstagram(e.target.value)} placeholder="@username" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-mist">Photos (up to 6)</p>
          {photoUrls.map((u, i) => (
            <div key={i} className="flex items-center gap-2">
              {u.trim() ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={u} alt="" className="h-10 w-10 rounded-full object-cover shrink-0 border border-white/10" />
              ) : (
                <div className="veil-orb h-10 w-10 text-sm shrink-0" aria-hidden />
              )}
              <input className="field" value={u} placeholder={`Photo ${i + 1} link`}
                onChange={(e) => {
                  const next = [...photoUrls];
                  next[i] = e.target.value;
                  setPhotoUrls(next);
                }} />
            </div>
          ))}
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
      </button>
    </main>
  );
}