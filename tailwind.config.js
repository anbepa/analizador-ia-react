/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#073E84',
        secondary: '#FFFFFF',
        highlight: '#FFD300',
        danger: '#E30520',
        line: '#454544'
      },
    },
  },
  plugins: [],
}