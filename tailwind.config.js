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
        "background-dark": "#142111"
      },
      fontSize: {
        'xs': ['12.5px', '18px'],
        'sm': ['14.5px', '22px'],
        'base': ['16.5px', '26px'],
        'lg': ['18.5px', '30px'],
        'xl': ['21px', '32px'],
        '2xl': ['25px', '34px'],
        '3xl': ['30px', '38px'],
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
