import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",
        plum: { 950: "#210D26", 900: "#421A4C", 700: "#632673", 500: "#84319B" },
        mist: "#C9C9C9",
        success: "#31D67B",
        danger: "#FF4D6D",
      },
      borderRadius: { card: "18px" },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
