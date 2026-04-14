/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0B0B0C',
        coal: '#141416',
        graphite: '#1C1C1F',
        wire: '#2A2A2E',
        paper: '#F4EFE7',
        bone: '#E8E2D6',
        dust: '#9A958B',
        onair: '#E5322B',
        amber: '#E8B04B',
        signal: '#4ADE80',
        ink2: '#050506',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        bezel: 'inset 0 0 0 1px #2A2A2E, 0 0 0 1px #0B0B0C, 0 30px 60px -30px rgba(0,0,0,.6)',
      },
    },
  },
  plugins: [],
}
