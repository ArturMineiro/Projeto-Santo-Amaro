/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F3F6F1",
        ink: "#1D2B24",
        muted: "#55665C",
        line: "#D5DFD7",
        leaf: { DEFAULT: "#1E6B4E", dark: "#154D38", soft: "#E1EEE6" },
        sun: { DEFAULT: "#F5C242", soft: "#FFF4D6", dark: "#8A6A12" },
        alert: { DEFAULT: "#B3261E", soft: "#FBE9E7" },
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', "system-ui", "sans-serif"],
        display: ['"Bricolage Grotesque"', '"Atkinson Hyperlegible"', "system-ui", "sans-serif"],
      },
      fontSize: {
        // Base maior: o público inclui muitas pessoas mais velhas
        base: ["1.125rem", { lineHeight: "1.55" }],
      },
      borderRadius: {
        btn: "14px",
        card: "20px",
      },
    },
  },
  plugins: [],
};
