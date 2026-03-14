/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        verde: {
          50:  '#f0f8e8',
          100: '#dff0c8',
          300: '#7bae5c',
          500: '#4a7c2f',
          700: '#2d5016',
          900: '#1a2d0c'
        },
        oro:   '#C9A84C',
        terra: '#8B4513',
        cream: '#F7F3EB',
      },
      fontFamily: {
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        mono:  ['DM Mono', 'monospace'],
      }
    }
  },
  plugins: []
}