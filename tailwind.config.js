/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired color palette (Refined)
        primary: {
          DEFAULT: '#0071E3', // Apple Web Blue (Slightly more professional)
          50: '#F5F9FF',
          100: '#E1F0FF',
          200: '#C2E0FF',
          300: '#99C9FF',
          400: '#66A9FF',
          500: '#0071E3',
          600: '#005BB7',
          700: '#004488',
          800: '#003060',
          900: '#001E3C',
        },
        secondary: {
          DEFAULT: '#86868B', // Apple Gray
          50: '#FBFBFD',      // Ultra light background
          100: '#F5F5F7',     // Light background (Apple Store bg)
          200: '#E8E8ED',     // Borders/Separators
          300: '#D2D2D7',
          400: '#AEAEB2',
          500: '#86868B',
          600: '#6E6E73',
          700: '#48484A',
          800: '#1D1D1F',     // Almost black text
          900: '#121212',     // Black
        },
        accent: '#FF9500',
        success: '#34C759',
        warning: '#FF9F0A',
        danger: '#FF3B30',
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F7', // Apple light gray bg
          tertiary: '#FFFFFF'
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.8)',
          elevated: '#FFFFFF',
          overlay: 'rgba(0, 0, 0, 0.4)'
        }
      },
      fontFamily: {
        'system': [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'Helvetica Neue',
          'Helvetica',
          'Arial',
          'sans-serif'
        ],
        'display': ['Outfit', 'sans-serif'],
        'body': ['Inter', 'sans-serif']
      },
      boxShadow: {
        'apple': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'apple-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'apple-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      },
      borderRadius: {
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px'
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem'
      }
    },
  },
  plugins: [],
}