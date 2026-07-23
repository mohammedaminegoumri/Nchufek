export const metadata = { title: "Privacy — NCHUFEK?" };

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-20 space-y-8 text-mist leading-relaxed">
      <h1 className="font-display text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="text-white">
        NCHUFEK? is built on one idea: you decide who sees you. This page explains, in plain
        language, what we collect, why, how long we keep it, and what rights you have.
      </p>

      <section>
        <h2 className="font-display font-semibold text-white text-xl mb-2">What we collect and why</h2>
        <p>Email address and a hashed password — to sign you in and prevent duplicate accounts. Passwords are stored only as bcrypt hashes.
        Name, birth date, gender and preferences — to run matching. Optional profile details
        (languages, interests, lifestyle) — to compute compatibility; every one of these can be
        left blank. Approximate location — to show nearby matches. Photos, if you add them —
        stored hidden by default. Messages — encrypted at rest with AES-256; our staff cannot
        read them in normal operation.</p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-white text-xl mb-2">Location is approximate</h2>
        <p>Before your coordinates are stored, they are rounded to roughly a 1 km grid. Your exact
        position never touches our database. Other users only ever see a distance, never a place.</p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-white text-xl mb-2">Identity by consent</h2>
        <p>Your photos, name and social handles are invisible to other users until both of you
        accept a reveal. There is no setting that changes this and no premium tier that bypasses it.</p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-white text-xl mb-2">Retention</h2>
        <p>Sessions: 30 days or until you log out. Messages: until either
        person deletes the chat. Deleted accounts: anonymized immediately, permanently purged
        within 30 days. Moderation reports: 12 months, for user safety.</p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-white text-xl mb-2">Your rights</h2>
        <p>You can download all your data, pause or hide your profile, and permanently delete your
        account — each in one action from Settings. You own your data. We never sell it, and we
        show no third-party advertising. We design for privacy-by-default and align with Moroccan
        data-protection requirements (Law 09-08) where applicable.</p>
      </section>

      <section>
        <h2 className="font-display font-semibold text-white text-xl mb-2">Contact</h2>
        <p>Questions or requests: <a className="underline hover:text-white" href="mailto:privacy@nchufek.ma">privacy@nchufek.ma</a>.</p>
      </section>
    </main>
  );
}
