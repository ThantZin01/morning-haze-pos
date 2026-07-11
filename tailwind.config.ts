import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coffee: "#6f4e37",
        mist: "#eef7f3",
        ink: "#1d2327"
      }
    }
  },
  plugins: []
};

export default config;
