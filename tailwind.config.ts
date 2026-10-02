import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          primary: "#0022ff",
          secondary: "#ffffff",
          black: "#000000",
          accent: "#0022ff",
          glass: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
