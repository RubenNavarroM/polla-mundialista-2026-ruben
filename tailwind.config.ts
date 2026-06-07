import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#B22234",
        secondary: "#002868",
        accent: "#FFD700",
        surface: "#F4F6F9",
        border: "#E2E6EA",
        "text-primary": "#0D1B2A",
        "text-secondary": "#6B7280",
        success: "#16A34A",
        error: "#DC2626",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        dm: ["var(--font-dm-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 4px 0 rgba(13,27,42,0.08)",
        "card-hover": "0 4px 16px 0 rgba(13,27,42,0.12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
