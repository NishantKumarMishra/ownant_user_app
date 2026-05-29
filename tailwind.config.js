/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F6E56',
          light: '#E1F5EE',
        },
        // ✅ FIXED: Added primaryLight as a flat key since SidebarNav uses bg-primaryLight
        primaryLight: '#E1F5EE',
        success: { DEFAULT: '#27A065', light: '#EAF3DE' },
        warning: { DEFAULT: '#E69B1A', light: '#FAEEDA' },
        danger:  { DEFAULT: '#D93B3B', light: '#FCEBEB' },
        info:    { DEFAULT: '#185FA5', light: '#E6F1FB' },
        background:    '#F5F5F0',
        surface:       '#FFFFFF',
        textPrimary:   '#1A1A1A',
        textSecondary: '#6B6B65',
        textTertiary:  '#9C9A92',
        border:        '#E5E4DE',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '10px',
        xl: '12px',
      },
      // ✅ ADDED: safe-area spacing utilities for iPhone notch / home indicator
      // Usage: pt-safe, pb-safe, px-safe
      spacing: {
        'safe-top':    'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left':   'env(safe-area-inset-left)',
        'safe-right':  'env(safe-area-inset-right)',
      },
    },
  },
  plugins: [
    // ✅ ADDED: Plugin to generate pb-safe, pt-safe etc. utility classes
    function ({ addUtilities }) {
      addUtilities({
        '.pt-safe': { paddingTop: 'env(safe-area-inset-top, 0px)' },
        '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.pl-safe': { paddingLeft: 'env(safe-area-inset-left, 0px)' },
        '.pr-safe': { paddingRight: 'env(safe-area-inset-right, 0px)' },
        '.mt-safe': { marginTop: 'env(safe-area-inset-top, 0px)' },
        '.mb-safe': { marginBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.min-h-screen-safe': {
          minHeight: ['100vh', '-webkit-fill-available'],
        },
      })
    },
  ],
}