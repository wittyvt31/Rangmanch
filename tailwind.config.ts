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
        background: "var(--background)",
        surface: "var(--surface)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        border: "var(--border)",
        destructive: "var(--destructive)",
      },
      borderRadius: {
        none: "0",
        sm: "0.125rem",
      },
    },
  },
  plugins: [],
};

export default config;






