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
        fabric: {
          bg: "#F8F8F7",
          surface: "#FFFFFF",
          sidebar: "#F3F3F1",
          border: "#E6E6E3",
          ink: "#191918",
          muted: "#6B6B68",
          subtle: "#9B9B97",
          accent: "#2563EB",
          rue: "#45BAF9",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      }
    },
  },
  plugins: [],
};

export default config;
