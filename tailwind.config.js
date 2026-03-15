/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fbf8eb',
          100: '#f4ecce',
          200: '#ead79d',
          300: '#ddbc64',
          400: '#D4AF37', // Golden Acceso Primary
          500: '#c2962d',
          600: '#a87724',
          700: '#865920',
          800: '#714a20',
          900: '#623f1f',
        },
        obsidian: '#050505',
        platinum: '#E5E4E2'
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
}
