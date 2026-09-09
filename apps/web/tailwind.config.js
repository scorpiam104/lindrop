/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cobalt: '#1E3A8A',
        royal: '#2563EB',
        gold: '#F59E0B',
        amber: '#D97706',
        slatebg: '#F8FAFC',
        ink: '#0F172A',
        cream: '#F8FAFC'
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'sans-serif']
      }
    }
  },
  plugins: []
};
