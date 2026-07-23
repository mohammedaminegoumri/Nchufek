import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "NCHUFEK? — Meet the person before judging the picture",
  description:
    "Blind dating for El Jadida. Compatibility first, photos only after mutual consent. Private, verified, encrypted.",
  manifest: "/manifest.json",
  openGraph: {
    title: "NCHUFEK?",
    description: "Meet someone. Not someone's Instagram.",
    locale: "fr_MA",
  },
};

export const viewport: Viewport = { themeColor: "#210D26" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${display.variable} ${body.variable} font-body min-h-dvh`}>
        <div className="aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
