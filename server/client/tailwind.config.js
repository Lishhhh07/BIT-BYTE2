/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Rajdhani"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        neonPurple: '#a855f7',
        electricBlue: '#3b82f6',
        cyberGreen: '#10b981',
      },
      backgroundImage: {
        starfield:
          'radial-gradient(circle at 20% 20%, rgba(168,85,247,0.07), transparent 25%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.08), transparent 23%), radial-gradient(circle at 50% 80%, rgba(16,185,129,0.05), transparent 30%)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(168,85,247,0.25), 0 0 80px rgba(59,130,246,0.2)',
      },
    },
  },
  plugins: [],
}

