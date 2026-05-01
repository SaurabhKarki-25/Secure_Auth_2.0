/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      colors: {
        'bg-primary':   '#07090f',
        'bg-secondary': '#0d1117',
        'bg-tertiary':  '#111822',
        'bg-panel':     '#131c27',
        'accent-blue':  '#5ba4f5',
        'accent-teal':  '#4fd1c5',
        'accent-amber': '#f6ad55',
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(rgba(91,164,245,0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(91,164,245,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: { grid: '40px 40px' },
    },
  },
  plugins: [],
}
