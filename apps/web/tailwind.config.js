/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          900: 'var(--color-primary-900, #12372a)',
          800: 'var(--color-primary-800, #18513c)',
          700: 'var(--color-primary-700, #1f6b4f)',
          600: 'var(--color-primary-600, #2f855a)',
          500: 'var(--color-primary-500, #3f9b68)',
        },
        navy: {
          950: 'var(--color-navy-950, #102a43)',
          900: 'var(--color-navy-900, #173f5f)',
          700: 'var(--color-navy-700, #256083)',
        },
        teal: {
          700: 'var(--color-teal-700, #0f766e)',
          600: 'var(--color-teal-600, #168a82)',
          100: 'var(--color-teal-100, #d8f3ef)',
        },
        amber: {
          700: 'var(--color-amber-700, #b45309)',
          600: 'var(--color-amber-600, #d97706)',
          100: 'var(--color-amber-100, #fef3c7)',
        },
        red: {
          700: 'var(--color-red-700, #b42318)',
          600: 'var(--color-red-600, #d92d20)',
          100: 'var(--color-red-100, #fee4e2)',
        },
        blue: {
          700: 'var(--color-blue-700, #175cd3)',
          100: 'var(--color-blue-100, #dbeafe)',
        },
        neutral: {
          950: 'var(--color-neutral-950, #172026)',
          800: 'var(--color-neutral-800, #344054)',
          700: 'var(--color-neutral-700, #475467)',
          600: 'var(--color-neutral-600, #667085)',
          500: 'var(--color-neutral-500, #98a2b3)',
          300: 'var(--color-neutral-300, #d0d5dd)',
          200: 'var(--color-neutral-200, #eaecf0)',
          100: 'var(--color-neutral-100, #f2f4f7)',
          50: 'var(--color-neutral-50, #f8fafc)',
        },
        status: {
          healthy: { bg: '#ECFDF3', text: '#027A48', border: '#A6F4C5' },
          info: { bg: '#EFF8FF', text: '#175CD3', border: '#B2DDFF' },
          pending: { bg: '#FFFAEB', text: '#B54708', border: '#FEDF89' },
          stale: { bg: '#FFF7ED', text: '#C2410C', border: '#FDBA74' },
          partial: { bg: '#F4F3FF', text: '#5925DC', border: '#D9D6FE' },
          error: { bg: '#FEF3F2', text: '#B42318', border: '#FECDCA' },
          illustrative: { bg: '#F2F4F7', text: '#344054', border: '#D0D5DD' },
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'float': '0 20px 30px -10px rgba(15, 23, 42, 0.1)',
        'glow-primary': '0 0 20px -3px rgba(31, 107, 79, 0.35)',
      },
      borderRadius: {
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
