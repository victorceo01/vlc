import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#0B6E4F", // NGX-ish green
          dark: "#095038",
          light: "#12A374",
        },
        up: "#0F9D58",
        down: "#DB4437",
      },
    },
  },
  plugins: [],
};

export default config;
