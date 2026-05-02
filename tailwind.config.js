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
        bg: 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        border: 'var(--border)',
        t1: 'var(--text-primary)',
        t2: 'var(--text-secondary)',
        accent: 'var(--accent-primary)',
        'accent-2': 'var(--accent-secondary)',
        'accent-fg': 'var(--text-on-accent)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        // legacy aliases so old code doesn't break
        surface: 'var(--bg-secondary)',
        'surface-2': 'var(--bg-tertiary)',
        'accent-light': 'var(--bg-tertiary)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        stat: ['Inter Tight', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        pill: '100px',
        card: '24px',
        xl2: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.15)',
        'card-light': '0 4px 24px rgba(0,0,0,0.06)',
        accent: '0 4px 20px rgba(191,0,0,0.30)',
      },
    },
  },
  plugins: [],
};
