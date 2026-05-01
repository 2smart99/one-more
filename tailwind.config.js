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
        background: '#F4F7FB',
        surface: '#FFFFFF',
        accent: '#78BCEE',
        'accent-dark': '#5AA8DE',
        'text-primary': '#2D3748',
        'text-secondary': '#A0AEC0',
        success: '#68D391',
        warning: '#F6AD55',
        danger: '#FC8181',
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 8px 16px rgba(0,0,0,0.04)',
        'soft-lg': '0 12px 24px rgba(0,0,0,0.06)',
        'soft-xl': '0 16px 32px rgba(0,0,0,0.08)',
        inset: 'inset 2px 2px 6px rgba(0,0,0,0.05)',
      },
      backdropBlur: {
        glass: '16px',
      },
    },
  },
  plugins: [],
};
