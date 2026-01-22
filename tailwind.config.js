/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-avantgarde)', 'system-ui', 'sans-serif'],
        body: ['var(--font-satoshi)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // INFINOX Typography Scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        // Custom heading sizes matching INFINOX
        'h1': ['3.5rem', { lineHeight: '1.1', fontWeight: '400' }],
        'h2': ['2.75rem', { lineHeight: '1.2', fontWeight: '400' }],
        'h3': ['2.25rem', { lineHeight: '1.3', fontWeight: '400' }],
        'h4': ['1.875rem', { lineHeight: '1.4', fontWeight: '400' }],
        'h5': ['1.5rem', { lineHeight: '1.5', fontWeight: '400' }],
        'h6': ['1.25rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.75' }],
        'body-base': ['1rem', { lineHeight: '1.625' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'none': 'none',
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Blue-600 (Primary)
          600: '#1d4ed8', // Blue-700
          700: '#1e40af', // Blue-800
          800: '#1e3a8a',
          900: '#172554',
          950: '#0f172a',
          DEFAULT: '#2563eb',
        },
        neutral: {
          50: '#f9fafb', // Gray-50
          100: '#f3f4f6', // Gray-100
          200: '#e5e7eb', // Gray-200
          300: '#d1d5db', // Gray-300
          400: '#9ca3af', // Gray-400
          500: '#6b7280', // Gray-500
          600: '#4b5563', // Gray-600
          700: '#374151', // Gray-700
          800: '#1f2937', // Gray-800
          900: '#111827', // Gray-900
        },
        dark: {
          base: '#081428',
          DEFAULT: '#081428',
        },
        ib: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // IB Theme Color
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          DEFAULT: '#3b82f6',
        },
        // Preserving existing color just in case, though it might be superseded
        'text-primary': '#4B5156',
      }
    },
  },
  plugins: [],
}
