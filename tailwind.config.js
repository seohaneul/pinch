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
          DEFAULT: "#FF6B6B",
          light: "#FF8E8E",
          dark: "#E05353",
          soft: "#FFEBEB",
        },
        secondary: {
          DEFAULT: "#4ECDC4",
          light: "#70E4DD",
          dark: "#3BB3AA",
          soft: "#EAF9F8",
        },
        accent: {
          yellow: "#FFE66D",
          orange: "#FF9F1C",
          purple: "#A29BFE",
        },
        background: "#FBFBFB",
        surface: "#FFFFFF",
        darkText: "#2B2D42",
        mutedText: "#8D99AE",
        borderLine: "#F0F0F5",
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
