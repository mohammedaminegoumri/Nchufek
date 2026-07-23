"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────── Landing ─────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Landing() {
  return (
    <main>
      <Nav />
      <Hero />
      <Stats />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Faq />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between glass !rounded-none sm:!rounded-card sm:mt-4 sm:border">
        <Link href="/" className="font-display font-bold text-lg tracking-tight">
          NCHUFEK<span className="text-plum-500">?</span>
        </Link>
        <div className="hidden sm:flex items-center gap-6 text-sm text-mist">
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>
        <Link href="/login" className="btn-primary !py-2.5 !px-5 text-sm">Get started</Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <header className="relative mx-auto max-w-6xl px-5 pt-40 pb-24 text-center">
      <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0}
        className="text-sm text-mist tracking-widest uppercase mb-6">
        Blind dating · El Jadida
      </motion.p>

      <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={1}
        className="font-display font-bold text-6xl sm:text-8xl tracking-tight leading-none">
        NCHUFEK<span className="text-plum-500">?</span>
      </motion.h1>

      <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
        className="mt-6 text-xl sm:text-2xl text-mist max-w-xl mx-auto leading-relaxed">
        Meet someone.
        <br />
        <span className="text-white">Not someone&apos;s Instagram.</span>
      </motion.p>

      <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
        className="mt-10 flex items-center justify-center gap-4">
        <Link href="/login" className="btn-primary">Get started</Link>
        <a href="#how" className="btn-ghost">How it works</a>
      </motion.div>

      {/* Signature: the veiled orb, the "face" nobody sees yet */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto mt-16 veil-orb h-40 w-40 text-5xl"
        aria-label="A hidden face — revealed only with mutual consent"
      />
      <p className="mt-5 text-sm text-mist">
        Photos stay hidden until <span className="text-success">both of you</span> say yes.
      </p>
    </header>
  );
}

/* Animated counters */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / 1400);
          setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

function Stats() {
  const stats = [
    { label: "People in El Jadida", value: 4820 },
    { label: "Matches today", value: 217 },
    { label: "Messages exchanged", value: 96400 },
    { label: "Average compatibility", value: 84, suffix: "%" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} custom={i} className="glass glass-hover p-6 text-center">
            <div className="font-display text-3xl font-bold text-white">
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <div className="mt-1 text-sm text-mist">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { title: "Anonymous matching", body: "No face, no name. You meet a personality: age, interests, a favorite quote — and a compatibility score." },
    { title: "AI compatibility", body: "Eleven weighted dimensions — goals, personality, lifestyle, languages — computed into one honest percentage." },
    { title: "Private chats", body: "End-to-end style encryption at rest, typing indicators, voice notes. Your words stay between you two." },
    { title: "Real verification", body: "Selfie + phone verification. A badge that means the person is exactly who they say they are." },
    { title: "Nearby matches", body: "El Jadida first. Choose your radius — 20, 30, or 50 km — and your location stays approximate, always." },
    { title: "Mutual reveal", body: "Photos unlock only when both of you press reveal. Consent isn't a feature here. It's the architecture." },
  ];
  return (
    <section id="features" className="mx-auto max-w-6xl px-5 pb-24">
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">
        Built the opposite of a swipe app
      </h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((f, i) => (
          <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} custom={i % 3} className="glass glass-hover p-7">
            <div className="veil-orb h-10 w-10 text-base mb-5" aria-hidden />
            <h3 className="font-display font-semibold text-lg">{f.title}</h3>
            <p className="mt-2 text-sm text-mist leading-relaxed">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { t: "Answer, don't pose", b: "Build a profile out of who you are — languages, goals, personality, what makes you laugh. Photos optional, and hidden either way." },
    { t: "Press Find My Match", b: "One button. The algorithm scores everyone nearby across 11 dimensions and hands you your top 10 — no endless swiping." },
    { t: "Talk first", b: "Chat with a person, not a picture. Voice notes, GIFs, real conversation." },
    { t: "Reveal together", b: "When it feels right, either of you can ask. Only if you both accept do names and photos appear." },
  ];
  return (
    <section id="how" className="mx-auto max-w-4xl px-5 pb-24">
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-12">How it works</h2>
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <motion.li key={s.t} variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} custom={i} className="glass p-6 flex gap-5 items-start">
            <span className="font-display font-bold text-plum-500 text-2xl leading-none mt-0.5">{i + 1}</span>
            <div>
              <h3 className="font-display font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-mist leading-relaxed">{s.b}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: "We talked for two weeks before revealing. By then the photo was the least interesting thing about him.", a: "Salma, 24 · El Jadida" },
    { q: "94% compatibility sounded like marketing. Then we spent four hours arguing about the best msemen in town.", a: "Youssef, 27 · Azemmour" },
    { q: "First app where being shy is an advantage.", a: "Imane, 22 · Sidi Bouzid" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24">
      <div className="grid sm:grid-cols-3 gap-4">
        {quotes.map((t, i) => (
          <motion.figure key={t.a} variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} custom={i} className="glass p-7">
            <blockquote className="text-sm leading-relaxed">&ldquo;{t.q}&rdquo;</blockquote>
            <figcaption className="mt-4 text-xs text-mist">{t.a}</figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  const items = [
    { q: "Can anyone see my photos?", a: "No. Photos are hidden by default and only become visible after both people accept a reveal request. You can also skip photos entirely." },
    { q: "Does the app share my exact location?", a: "Never. Coordinates are rounded to roughly a 1 km grid before they're stored. Other users only ever see an approximate distance." },
    { q: "Is it free?", a: "Yes. Matching, chat, and reveal are free. A premium tier with advanced filters and priority matching is coming later." },
    { q: "How is compatibility calculated?", a: "A weighted score across age, interests, personality, goals, distance, lifestyle, languages, education, religion, and activity — plus a small dose of serendipity." },
    { q: "What if someone is disrespectful?", a: "Report and block from any chat. Messages are auto-screened, repeated reports trigger automatic suspension, and a human reviews every report." },
    { q: "Can I delete everything?", a: "One tap in Settings deletes your account and schedules a permanent purge. You can also download all your data first." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-3xl px-5 pb-24">
      <h2 className="font-display text-3xl sm:text-4xl font-bold text-center mb-10">Questions</h2>
      <div className="space-y-3">
        {items.map((f, i) => (
          <div key={f.q} className="glass overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full text-left px-6 py-4 flex justify-between items-center gap-4"
              aria-expanded={open === i}>
              <span className="font-medium">{f.q}</span>
              <span className={`text-plum-500 transition-transform ${open === i ? "rotate-45" : ""}`}>＋</span>
            </button>
            <motion.div initial={false} animate={{ height: open === i ? "auto" : 0 }}
              className="overflow-hidden">
              <p className="px-6 pb-5 text-sm text-mist leading-relaxed">{f.a}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[rgba(255,255,255,.08)]">
      <div className="mx-auto max-w-6xl px-5 py-12 flex flex-col sm:flex-row gap-8 justify-between text-sm text-mist">
        <div>
          <div className="font-display font-bold text-white text-lg">NCHUFEK<span className="text-plum-500">?</span></div>
          <p className="mt-2 max-w-xs">Meet the person before judging the picture. Made with love in El Jadida.</p>
        </div>
        <div className="flex gap-12">
          <div className="space-y-2 flex flex-col">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <a href="mailto:hello@nchufek.ma" className="hover:text-white">Contact</a>
          </div>
          <div className="space-y-2 flex flex-col">
            <a href="https://instagram.com" rel="noopener" className="hover:text-white">Instagram</a>
            <a href="https://tiktok.com" rel="noopener" className="hover:text-white">TikTok</a>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-mist/60 pb-8">© {new Date().getFullYear()} NCHUFEK? · El Jadida, Morocco</p>
    </footer>
  );
}
