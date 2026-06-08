import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f7f9fe",
        surface: "#f7f9fe",
        primary: "#346574",
        "primary-container": "#a7d8ea",
        "primary-fixed": "#b9eafd",
        "primary-fixed-dim": "#9dcee0",
        "on-primary": "#ffffff",
        "on-primary-container": "#2e5f6f",
        "on-primary-fixed": "#001f28",
        "on-surface": "#181c20",
        "on-surface-variant": "#40484b",
        outline: "#71787c",
        "outline-variant": "#c0c8cb",
        "surface-container-low": "#f1f4f9",
        "surface-container": "#ebeef3",
        "surface-container-high": "#e5e8ed",
        "surface-container-highest": "#e0e3e7",
        secondary: "#605e58",
        "secondary-container": "#e6e2d9",
        tertiary: "#6a5c4e",
        "tertiary-container": "#e0cdbc",
        error: "#ba1a1a",
      },
      fontFamily: {
        headline: ["var(--font-plus-jakarta)", "sans-serif"],
        body: ["var(--font-be-vietnam)", "sans-serif"],
      },
      boxShadow: {
        cloud: "0 20px 40px -10px rgba(52, 101, 116, 0.12)",
      },
      borderRadius: {
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
