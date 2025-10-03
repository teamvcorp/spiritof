import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        santa: '#ea1938',
        berryPink: '#ff6295', 
        frostyBlue: '#49c5fc',
        blueberry: '#0084b5',
        mint: '#46d597',
        evergreen: '#37776c',
      },
      fontFamily: {
        'paytone-one': ['var(--font-paytone-one)', 'cursive'],
        'geist-sans': ['var(--font-geist-sans)', 'sans-serif'],
        'geist-mono': ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config