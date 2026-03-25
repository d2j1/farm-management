/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#166534",
        destructive: "#ef4444",
        "background-light": "#f6f8f6",
        "background-dark": "#142111",
        "apar-primary": "#44E51C",
        "apar-dark-green": "#166534"
      },
      fontSize: {
        'xs': ['0.893rem', '1.286rem'],
        'sm': ['1.036rem', '1.571rem'],
        'base': ['1.179rem', '1.857rem'],
        'lg': ['1.321rem', '2.143rem'],
        'xl': ['1.5rem', '2.286rem'],
        '2xl': ['1.786rem', '2.429rem'],
        '3xl': ['2.143rem', '2.714rem'],
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
