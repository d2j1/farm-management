/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3ce619",
        destructive: "#ef4444",
        "background-light": "#f6f8f6",
        "background-dark": "#142111"
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
