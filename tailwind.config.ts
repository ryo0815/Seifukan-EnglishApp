/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  safelist: [
    'bg-blue-100', 'border-y-4', 'border-blue-200', 'text-blue-500', 'text-blue-700', 'text-blue-600', 'bg-blue-500', 'hover:bg-blue-600',
    'bg-orange-100', 'border-orange-200', 'text-orange-500', 'text-orange-700', 'text-orange-600', 'bg-orange-500', 'hover:bg-orange-600',
    'bg-purple-100', 'border-purple-200', 'text-purple-500', 'text-purple-700', 'text-purple-600', 'bg-purple-500', 'hover:bg-purple-600',
  ],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          dark: 'hsl(95, 65%, 45%)', // Darker shade for border
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
          dark: 'hsl(210, 30%, 86%)', // Darker shade for border
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          dark: 'hsl(0, 70%, 50%)', // Darker shade for border
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config 