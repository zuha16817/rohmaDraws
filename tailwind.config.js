/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        chalk: '#E3D6BF',
        amaranth: '#933B5B',
        thulian: '#B5728A',
        brook: '#AABAAE',
        'brook-deep': '#6E8B74',
        pomelo: '#9F9679',
        canvas: '#E3D6BF',
        espresso: '#3D262A',
        'text-primary': '#3D262A',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
