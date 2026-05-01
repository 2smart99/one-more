/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F0F2F8',
        surface: '#FFFFFF',
        primary: '#111827',
        accent: '#3B82F6',
        'accent-dark': '#2563EB',
        'accent-light': '#EFF6FF',
        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-muted': '#9CA3AF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        border: '#E5E7EB',
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
        'card-lg': '0 4px 24px rgba(0,0,0,0.08)',
        'accent-glow': '0 4px 20px rgba(59,130,246,0.25)',
      },
    },
  },
  plugins: [],
};
