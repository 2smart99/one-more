/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        t1: 'var(--text-1)',
        t2: 'var(--text-2)',
        accent: 'var(--accent)',
        'accent-light': 'var(--accent-light)',
        'accent-fg': 'var(--accent-fg)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        pill: '9999px',
        xl2: '16px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(0,0,0,0.06)',
        'card-lg': '0 4px 24px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};
