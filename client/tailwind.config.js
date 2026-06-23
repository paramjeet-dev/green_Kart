/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          primary: "#2E7D32",
          secondary: "#4CAF50",
          light: "#E8F5E9",
          bg: "#F8FAF5",
        },
        yellow: { accent: "#FFC107" },
        red: { error: "#EF4444" },
        gray: {
          text: "#1F2937",
          sub: "#6B7280",
        },
      },
      fontFamily: {
        heading: ["Poppins", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(46,125,50,0.08)",
        "card-hover": "0 8px 24px rgba(46,125,50,0.15)",
      },
    },
  },
  plugins: [],
};
