import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        canvas: "var(--cp-bg)",
        surface: "var(--cp-surface)",
        "surface-low": "var(--cp-surface-low)",
        ink: "var(--cp-ink)",
        "ink-secondary": "var(--cp-ink-secondary)",
        outline: "var(--cp-outline)",
        primary: "var(--cp-primary)",
        "primary-container": "var(--cp-primary-container)",
        "on-primary-container": "var(--cp-on-primary-container)",
        secondary: "var(--cp-secondary)",
        "secondary-container": "var(--cp-secondary-container)",
        "on-secondary-container": "var(--cp-on-secondary-container)",
        tertiary: "var(--cp-tertiary)",
        "tertiary-container": "var(--cp-tertiary-container)",
        "on-tertiary-container": "var(--cp-on-tertiary-container)",
        strong: "var(--cp-strong)",
        moderate: "var(--cp-moderate)",
        urgent: "var(--cp-urgent)",
      },
    },
  },
  plugins: [],
};
export default config;
