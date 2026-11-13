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
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-card": "rgba(17, 26, 23, 0.75)",
        "surface-border": "rgba(255, 255, 255, 0.08)",
        emerald: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
      },
    },
  },
  plugins: [],
};
export default config;

