import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070B10",
          900: "#0B1119",
          850: "#0F1721",
          800: "#131D29",
          700: "#1B2836",
          600: "#243445",
        },
        line: {
          DEFAULT: "#1D2A38",
          soft: "#16212D",
        },
        accent: {
          DEFAULT: "#2AABEE",
          soft: "#7DD3FC",
          deep: "#0E7490",
        },
        mint: "#34D399",
        amber: "#FBBF24",
        rose: "#FB7185",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI Variable Text",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Cascadia Code", "Consolas", "monospace"],
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.15rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(42,171,238,0.18), 0 18px 50px -18px rgba(42,171,238,0.45)",
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -30px rgba(0,0,0,0.9)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 6s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
