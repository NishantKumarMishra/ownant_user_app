/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0F6E56', light: '#E1F5EE' },
        success: { DEFAULT: '#27A065', light: '#EAF3DE' },
        warning: { DEFAULT: '#E69B1A', light: '#FAEEDA' },
        danger: { DEFAULT: '#D93B3B', light: '#FCEBEB' },
        info: { DEFAULT: '#185FA5', light: '#E6F1FB' },
        background: '#F5F5F0',
        surface: '#FFFFFF',
        textPrimary: '#1A1A1A',
        textSecondary: '#6B6B65',
        textTertiary: '#9C9A92',
        border: '#E5E4DE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '10px',
        xl: '12px',
      },
    },
  },
  plugins: [],
}
