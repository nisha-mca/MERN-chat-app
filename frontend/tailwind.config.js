/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12181B",
        surface: "#1B2327",
        surfaceAlt: "#222B30",
        line: "#2A343A",
        text: "#EDEDE6",
        textDim: "#8B9598",
        accent: "#C8FF4D",
        bubble: "#2C393F",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
