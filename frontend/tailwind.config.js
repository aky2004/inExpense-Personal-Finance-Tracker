/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
      },
      colors: {
        // inExpense color system
        brand: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#eff6ff',
          dark: '#3b82f6',
          text: '#2563eb',
        },
        surface: {
          light: '#fbfbfd',
          dark: '#0b0908',
        },
        panel: {
          light: '#ffffff',
          dark: '#141210',
        },
        soft: {
          light: '#f3f2f7',
          dark: '#1a1714',
        },
        borderline: {
          light: '#e6e5ee',
          dark: '#24211d',
        },
        ink: {
          light: '#17151f',
          muted: '#66637a',
          dark: '#f2efe9',
          darkmuted: '#8c857b',
        },
        money: {
          green: '#1b7f4d',
          greendark: '#4cc38a',
          red: '#c24129',
          reddark: '#ef6a57',
        },
      },
      boxShadow: {
        'inexpense': '0 1px 2px rgba(23, 21, 31, 0.04), 0 14px 34px -20px rgba(40, 30, 80, 0.16)',
        'inexpense-dark': '0 1px 2px rgba(0, 0, 0, 0.3), 0 18px 40px -22px rgba(0, 0, 0, 0.8)',
      },
    },
  },
  plugins: [],
}
