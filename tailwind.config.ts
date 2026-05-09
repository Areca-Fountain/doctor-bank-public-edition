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
          primary: "#011F4B",    // Deep Navy
          secondary: "#005b96",  // Royal Blue
          accent: "#8BA3B8",     // Soft Blue for 'Banking AI'
          glass: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  },
  plugins: [],
};

export default config;