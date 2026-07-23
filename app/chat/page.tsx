"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api, post } from "@/lib/api";

interface Msg {
  id: string; senderId: string; text: string;
  createdAt: string; seenAt?: string | null;
}

const POLL_MS = 2500;

function ChatList() {
  const [items, setItems] = useState<any[] | null>(null);
  useEffect(() => {
    api("/matches").then((d) => setItems(d.matches)).catch(() => (location.href = "/login"));
  }, []);
  return (
    <main className="min-h-dvh px-5 py-10 max-w-2xl mx-auto">
      <header className="flex items-center gap-4 mb-8">
        <a href="/discover" className="text-mist hover:text-white" aria-label="Back">←</a>
        <h1 className="font-display text-2xl font-bold">Your conversations</h1>
      </header>
      {items === null && <div className="space-y-3">{[0,1,2].map((i) => <div key={i} className="skeleton h-20" />)}</div>}
      {items?.length === 0 && (
        <div className="glass p-8 text-center">
          <div className="veil-orb h-14 w-14 text-lg mx-auto mb-4" aria-hidden />
          <p className="font-medium">No conversations yet.</p>
          <a href="/discover" className="btn-primary inline-block mt-4 !py-2.5 text-sm">Find My Match</a>
        </div>
      )}
      <div className="space-y-3">
        {items?.map((m) => (
          <a key={m.id} href={`/chat?m=${m.id}`} className="glass glass-hover p-5 flex items-center gap-4">
            <div className="veil-orb h-12 w-12 text-base shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold">
                {m.reveal === "MUTUAL" ? "Revealed match" : "Hidden match"} · {Math.round(m.score)}%
              </p>
              <p className="text-xs text-mist">
                {new Date(m.lastActivity).toLocaleString()}
              </p>
            </div>
            {m.unread && <span className="h-2.5 w-2.5 rounded-full bg-plum-500" aria-label="Unread" />}
          </a>
        ))}
      </div>
    </main>
  );
}

function ChatInner() {
  const matchId = useSearchParams().get("m");
  if (!matchId) return <ChatList />;
  return <ChatRoom matchId={matchId} />;
}

function ChatRoom({ matchId }: { matchId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [reveal, setReveal] = useState("NONE");
  const [iRequested, setIRequested] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [identity, setIdentity] = useState<{ firstName: string; photos: string[]; instagram: string | null } | null>(null);
  const [myId, setMyId] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTs = useRef<string | null>(null);

  const loadIdentity = useCallback(async () => {
    try { setIdentity(await api(`/matches/${matchId}/identity`)); } catch {}
  }, [matchId]);

  const poll = useCallback(async (initial = false) => {

    const q = !initial && lastTs.current ? `?after=${encodeURIComponent(lastTs.current)}` : "";
    const d = await api(`/matches/${matchId}/messages${q}`);
    setReveal(d.reveal);
    setIRequested(d.iRequestedReveal);
    setOtherOnline(d.otherOnline);
    if (d.reveal === "MUTUAL") loadIdentity();
    if (d.messages.length) {
      lastTs.current = d.messages[d.messages.length - 1].createdAt;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...d.messages.filter((m: Msg) => !ids.has(m.id))];
      });
    }
  }, [matchId, loadIdentity]);

  useEffect(() => {

    api("/me").then((me) => setMyId(me.id)).catch(() => (location.href = "/login"));
    poll(true);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") poll();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [matchId, poll]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      const m = await post<Msg>(`/matches/${matchId}/messages`, { text });
      lastTs.current = m.createdAt;
      setMessages((prev) => [...prev, m]);
    } catch (e: any) {
      setInput(text); // give the words back on failure
    } finally { setSending(false); }
  }

  async function requestReveal() {
    const d = await post(`/matches/${matchId}/reveal`, { action: "request" });
    setReveal(d.reveal); setIRequested(true);
    if (d.reveal === "MUTUAL") loadIdentity();
  }
  async function respondReveal(accept: boolean) {
    const d = await post(`/matches/${matchId}/reveal`, { action: "respond", accept });
    setReveal(d.reveal);
    if (d.reveal === "MUTUAL") loadIdentity();
  }

  const pendingOnMe = (reveal === "REQUESTED_BY_A" || reveal === "REQUESTED_BY_B") && !iRequested;
  const pendingOnThem = (reveal === "REQUESTED_BY_A" || reveal === "REQUESTED_BY_B") && iRequested;

  return (
    <main className="min-h-dvh flex flex-col max-w-2xl mx-auto">
      <header className="glass !rounded-none sm:!rounded-b-card px-5 py-4 flex items-center gap-4 sticky top-0 z-10">
        <a href="/discover" className="text-mist hover:text-white" aria-label="Back">←</a>
        {identity?.photos?.[0] ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={identity.photos[0]} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <div className="veil-orb h-11 w-11 text-base" aria-hidden />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold truncate">
            {identity ? identity.firstName : "Hidden match"}
          </p>
          <p className="text-xs text-mist">
            {otherOnline ? <span className="text-success">online</span>
              : reveal === "MUTUAL" ? "revealed" : "identity hidden"}
          </p>
        </div>
        {reveal !== "MUTUAL" && reveal !== "DECLINED" && !pendingOnThem && !pendingOnMe && (
          <button onClick={requestReveal} className="btn-ghost !py-2 !px-4 text-sm">Reveal me</button>
        )}
        {pendingOnThem && <span className="text-xs text-mist">Reveal sent ✓</span>}
      </header>

      <AnimatePresence>
        {pendingOnMe && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="glass mx-4 mt-4 p-4 flex items-center gap-3">
            <div className="veil-orb h-9 w-9 text-sm shrink-0" aria-hidden />
            <p className="text-sm flex-1">Your match wants to reveal themselves. Ready to see each other?</p>
            <button onClick={() => respondReveal(true)} className="btn-primary !py-2 !px-4 text-sm">Accept</button>
            <button onClick={() => respondReveal(false)} className="btn-ghost !py-2 !px-4 text-sm">Not yet</button>
          </motion.div>
        )}
        {reveal === "MUTUAL" && identity && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass mx-4 mt-4 p-4 text-center">
            <p className="text-success text-sm font-medium">
              ✨ You and {identity.firstName} revealed to each other
            </p>
            {identity.instagram && (
              <p className="text-xs text-mist mt-1">Instagram: @{identity.instagram}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-mist text-sm mt-16 space-y-2">
            <div className="veil-orb h-14 w-14 text-lg mx-auto" aria-hidden />
            <p>Say something real. You matched on personality — lead with it.</p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.senderId === myId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed rounded-card ${
                mine ? "bg-gradient-to-br from-plum-500 to-plum-700 text-white"
                     : "bg-white/[.06] border border-white/[.08]"}`}>
                {m.text}
                {mine && (
                  <span className="ml-2 text-[10px] opacity-70">{m.seenAt ? "✓✓" : "✓"}</span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-0 px-4 pb-5 pt-2 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="glass flex items-end gap-2 p-2">
          <textarea
            className="flex-1 bg-transparent outline-none resize-none px-3 py-2 text-sm max-h-32"
            rows={1}
            placeholder="Write a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button onClick={send} disabled={!input.trim() || sending}
            className="btn-primary !py-2.5 !px-5 text-sm shrink-0">Send</button>
        </div>
      </div>
    </main>
  );
}

export default function Chat() {
  return (
    <Suspense fallback={<div className="min-h-dvh grid place-items-center"><div className="skeleton h-32 w-64" /></div>}>
      <ChatInner />
    </Suspense>
  );
}
