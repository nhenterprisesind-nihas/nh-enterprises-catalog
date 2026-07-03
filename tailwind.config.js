/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: "#fdf2f4",
          100: "#fce7ea",
          200: "#f8d0d7",
          300: "#f3a9b6",
          400: "#eb7a90",
          500: "#de4d6d",
          600: "#c9305a",
          700: "#a9234a",
          800: "#800020",
          900: "#5c0018",
          950: "#3a000f",
        },
        gold: {
          50: "#fffef0",
          100: "#fffacc",
          200: "#fff099",
          300: "#ffe066",
          400: "#ffd700",
          500: "#e6c200",
          600: "#cc9900",
          700: "#a67c00",
          800: "#8a6500",
          900: "#6b4e00",
        },
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
