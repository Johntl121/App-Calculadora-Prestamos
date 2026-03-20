/** @type {import('tailwindcss').Config} */
module.exports = {
  // Aseguramos que busque clases en todas tus carpetas
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}
