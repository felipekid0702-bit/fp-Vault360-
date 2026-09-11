import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0EDE4',
          100: '#E3E6DC',
          400: '#7FA98A',
          500: '#5C8A68',
          600: '#4F7A5C',
          700: '#3D5F47',
          900: '#233428',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
