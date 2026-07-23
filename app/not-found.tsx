import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-5 text-center">
      <div>
        <div className="veil-orb h-24 w-24 text-3xl mx-auto" aria-hidden />
        <h1 className="font-display text-4xl font-bold mt-8">Lost, a chwiya?</h1>
        <p className="text-mist mt-3">This page doesn&apos;t exist — but your match might.</p>
        <Link href="/" className="btn-primary inline-block mt-8">Back home</Link>
      </div>
    </main>
  );
}
