/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00BFA6',
          50: '#E6FBF8',
          100: '#B3F2EA',
          200: '#80E9DC',
          300: '#4DDFCE',
          400: '#1AD6C0',
          500: '#00BFA6',
          600: '#009985',
          700: '#007363',
          800: '#004C42',
          900: '#002621',
          dark: '#009985',
        },
        secondary: {
          DEFAULT: '#0099FF',
          50: '#E6F4FF',
          100: '#B3DCFF',
          200: '#80C3FF',
          300: '#4DAAFF',
          400: '#1A91FF',
          500: '#0099FF',
          600: '#007ACC',
          700: '#005C99',
          800: '#003D66',
          900: '#001F33',
          dark: '#007ACC',
        },
        bg: {
          DEFAULT: '#F5FAFC',
          dark: '#0F172A',
        },
        surface: {
          DEFAULT: '#EAF4F4',
          dark: '#1E293B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px rgba(0, 191, 166, 0.3)',
        'glow-blue': '0 0 20px rgba(0, 153, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
      backdropBlur: { xs: '2px' },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
    },
  },
  plugins: [],
};
