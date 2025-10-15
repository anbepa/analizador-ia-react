/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple-inspired color palette
        primary: {
          DEFAULT: '#007AFF', // iOS Blue
          50: '#F0F9FF',
          100: '#E0F2FE',
          500: '#007AFF',
          600: '#0056CC',
          700: '#003D99'
        },
        secondary: {
          DEFAULT: '#8E8E93', // iOS Secondary Gray
          50: '#F2F2F7',
          100: '#E5E5EA',
          200: '#D1D1D6',
          300: '#C7C7CC',
          400: '#AEAEB2',
          500: '#8E8E93',
          600: '#6D6D70',
          700: '#48484A',
          800: '#2C2C2E',
          900: '#1C1C1E'
        },
        accent: '#FF9500', // iOS Orange
        success: '#34C759', // iOS Green
        warning: '#FF9500', // iOS Orange  
        danger: '#FF3B30', // iOS Red
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F2F2F7',
          tertiary: '#FFFFFF'
        },
        surface: {
          DEFAULT: '#FFFFFF',
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
        ]
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