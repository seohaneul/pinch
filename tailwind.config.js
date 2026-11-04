/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B2A4A",
          light: "#2B50AA",
          dark: "#111C33",
          soft: "#EEF2F8",
        },
        secondary: {
          DEFAULT: "#3B63C4",
          light: "#6085E0",
          dark: "#264796",
          soft: "#F0F4FA",
        },
        accent: {
          yellow: "#F59E0B",
          orange: "#EA580C",
          purple: "#6366F1",
        },
        background: "#F4F5F7",
        surface: "#FFFFFF",
        darkText: "#111827",
        mutedText: "#8D99AE",
        borderLine: "#F1F3F5",
      },
      fontFamily: {
        sans: ["System", "sans-serif"],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
};
