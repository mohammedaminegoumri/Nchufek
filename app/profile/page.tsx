"use client";

import { useEffect, useRef, useState } from "react";
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

/** Resize + compress an image in the browser → small JPEG data URL (~100KB). */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Not a valid image")); };
    img.src = url;
  });
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
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setPhotos(p.photoUrls ?? []);
      setLoaded(true);
    }).catch(() => router.replace("/login"));
  }, [router]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setError("");
    try {
      const room = 6 - photos.length;
      const picked = Array.from(files).slice(0, room);
      const compressed = await Promise.all(picked.map(compressImage));
      setPhotos((prev) => [...prev, ...compressed].slice(0, 6));
    } catch (e: any) {
      setError(e.message ?? "Couldn't read that image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(i: number) {
    setPhotos((prev) => prev.filter((_, x) => x !== i));
  }

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
        photoUrls: photos,
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
          Your photos and Instagram stay invisible until both you and a match press reveal.
        </p>
        <div>
          <p className="text-sm text-mist mb-2">Instagram username</p>
          <input className="field" value={instagram}
            onChange={(e) => setInstagram(e.target.value)} placeholder="@username" />
        </div>
        <div>
          <p className="text-sm text-mist mb-2">Photos ({photos.length}/6)</p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((src, i) => (
              <div key={i} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Photo ${i + 1}`}
                  className="h-full w-full object-cover rounded-card border border-white/10" />
                <button onClick={() => removePhoto(i)} aria-label="Remove photo"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-danger text-white text-sm leading-none">
                  ✕
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 rounded-full px-2 py-0.5">
                    Main
                  </span>
                )}
              </div>
            ))}
            {photos.length < 6 && (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="aspect-square rounded-card border border-dashed border-white/20 text-mist hover:border-plum-500 hover:text-white transition-colors grid place-items-center text-3xl">
                {uploading ? <span className="text-sm animate-pulse">…</span> : "+"}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden
            onChange={(e) => addPhotos(e.target.files)} />
          <p className="text-xs text-mist/70 mt-2">
            Photos are compressed on your phone before saving. First photo is your main one.
          </p>
        </div>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}
      <button onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
      </button>
    </main>
  );
}