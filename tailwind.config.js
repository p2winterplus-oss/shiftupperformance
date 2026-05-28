/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        kanit: ['Kanit', 'system-ui', 'sans-serif'],
        prompt: ['Prompt', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: '#e2293f',
        'accent-deep': '#b8172a',
        bg: '#07090c',
        panel: '#10151b',
        'panel-2': '#151d24',
        muted: '#aeb9c7',
        steel: '#8aa0b4',
      },
    },
  },
  plugins: [],
};
