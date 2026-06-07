import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary:          "rgb(var(--color-primary) / <alpha-value>)",
        secondary:        "rgb(var(--color-secondary) / <alpha-value>)",
        accent:           "rgb(var(--color-accent) / <alpha-value>)",
        bg:               "rgb(var(--color-bg) / <alpha-value>)",
        surface:          "rgb(var(--color-surface) / <alpha-value>)",
        border:           "rgb(var(--color-border) / <alpha-value>)",
        "text-primary":   "rgb(var(--color-text-primary) / <alpha-value>)",
        "text-secondary": "rgb(var(--color-text-secondary) / <alpha-value>)",
        success:          "rgb(var(--color-success) / <alpha-value>)",
        error:            "rgb(var(--color-error) / <alpha-value>)",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        dm:   ["var(--font-dm-sans)", "sans-serif"],
      },
      boxShadow: {
        card:       "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      borderRadius: {
        xl:  "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
