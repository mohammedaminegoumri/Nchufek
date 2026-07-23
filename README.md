# NCHUFEK? 💜 — $0 Edition

> **Meet the person before judging the picture.**
> Blind dating for El Jadida. Same design, same algorithm, same mutual-reveal system —
> rebuilt to run entirely on free tiers. **Total monthly cost: 0 DH.**

## Why this version costs nothing

| v1 (needed money) | v2 (this version, free) |
|---|---|
| Separate Express server → needs an always-on VPS | Single Next.js app → **Vercel free tier** |
| Self-hosted PostgreSQL | **Neon free Postgres** (0.5 GB — tens of thousands of users) |
| Redis for presence/sockets | Dropped — presence via `lastSeenAt` in the DB |
| Socket.io (needs a long-running server) | **Polling every 2.5s** — feels near-instant, works serverless |
| Phone OTP → SMS provider (always paid) | **Email + password** (bcrypt) — zero external services |
| Photo upload → S3 storage | Photo **URLs** (host free on imgbb/postimages), max 6, hidden until reveal |

Everything else survived intact: the 11-dimension weighted matching algorithm, blind cards,
mutual-consent reveal enforced by the API (403 until `MUTUAL`), AES-256-GCM message encryption
at rest, ~1 km location fuzzing, reports with auto-suspension, blocks, data export, permanent
deletion, and the full purple glassmorphism design.

## Run it on your machine (free, 5 minutes)

You need Node.js 18+ (free) and a free Neon database.

**1. Create the free database**
- Go to **neon.tech** → sign up (GitHub login, no card asked)
- Create a project → copy the **pooled connection string** (it looks like
  `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`)

**2. Configure**
```bash
cp .env.example .env
```
Open `.env` and set:
- `DATABASE_URL` = the Neon string you copied
- `JWT_SECRET` = any long random text (or run `openssl rand -base64 48`)
- `MESSAGE_ENCRYPTION_KEY` = run `openssl rand -base64 32`
  (no openssl? use any password generator for JWT_SECRET, and for the encryption key you can
  leave it empty — a dev fallback kicks in, just set it before real users arrive)

**3. Install, migrate, seed, run**
```bash
npm install
npx prisma migrate dev --name init
npm run seed          # 40 demo users around El Jadida (password: nchufek123)
npm run dev           # → http://localhost:3000
```

Create your account through the app, allow location, press **Find My Match** — the demo users
are scattered around El Jadida so you'll get instant results. Open a second browser
(incognito) logged in as a demo user (e.g. `salma1@demo.nchufek.local` / `nchufek123`) to
chat with yourself and test the reveal flow.

## Deploy it to the internet for free

**Vercel free (Hobby) tier** — no card required.

1. Push the project to a **GitHub** repository (free)
2. Go to **vercel.com** → sign up with GitHub → **Add New Project** → import your repo
3. In the project's **Environment Variables**, add the same three values from your `.env`:
   `DATABASE_URL`, `JWT_SECRET`, `MESSAGE_ENCRYPTION_KEY`
4. Click **Deploy**

That's it. The build script runs `prisma migrate deploy` automatically, so your Neon database
gets its tables on the first deploy. You'll get a free `your-app.vercel.app` URL — shareable
immediately. (A custom `.ma` domain is the only thing in this whole stack that would ever
cost money, and it's optional.)

To seed demo users in production, run locally with the Neon URL:
```bash
DATABASE_URL="<your neon url>" npm run seed
```

## Free-tier limits, honestly

- **Neon free**: 0.5 GB storage. Messages are small — this is years of runway for a city app.
  The DB sleeps after inactivity and wakes in ~1s on the first request.
- **Vercel free**: 100 GB bandwidth/month, serverless functions with generous invocation
  limits. Chat polling every 2.5s is well within it for hundreds of daily users. If the app
  blows up past that — that's a good problem, and revenue territory.
- **Rate limiting** is in-memory per serverless instance — softer than Redis-backed, but
  the DB-level protections (auth, validation, consent gates) don't depend on it.
- **No SMS verification** — identity assurance is lower than phone OTP. Mitigations built in:
  18+ enforced server-side, reports auto-suspend at 3 in 24h, blocks unmatch instantly.

## Project map

```
app/
├── api/                     All backend logic (Next.js route handlers)
│   ├── auth/                register · login · logout (JWT in httpOnly cookie)
│   ├── me/                  profile · location (fuzzed) · export · delete · status
│   ├── matches/             find (the algorithm) · list/create
│   │   └── [id]/            messages (polling GET + POST) · reveal · identity (403-gated)
│   ├── reports/             auto-suspension at 3 reports/24h
│   └── blocks/
├── page.tsx                 Landing (hero, stats, features, FAQ)
├── login/ onboarding/       Email auth + 3-step signup
├── discover/                Find My Match → blind cards with compatibility rings
├── chat/                    Conversation list + polling chat room + reveal flow
├── settings/                Visibility · data export · permanent deletion
└── privacy/ terms/          Plain-language policies
lib/core.ts                  Prisma, auth, encryption, rate limiting, matching engine
prisma/schema.prisma         The data model
prisma/seed.ts               40 El Jadida demo users
```

## When you outgrow $0

Each upgrade is independent and drop-in: real-time sockets (move chat to a small VPS or use
a free-tier realtime service), phone OTP (Twilio), photo uploads (Cloudflare R2 has a free
tier), email verification (Resend free tier: 100 emails/day). The schema and API are already
shaped for all of them.

---

Made with love in El Jadida. 🌊 Total infrastructure bill: **0 DH**.
