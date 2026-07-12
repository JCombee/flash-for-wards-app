/** @type {import('tailwindcss').Config} */
// Colors resolve to the CSS custom properties in src/renderer/src/styles/tokens.css.
// The <alpha-value> placeholder keeps opacity modifiers (`bg-lol-gold/20`) working.
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        lol: {
          gold: 'rgb(var(--lol-gold) / <alpha-value>)',
          'gold-light': 'rgb(var(--lol-gold-light) / <alpha-value>)',
          dark: 'rgb(var(--lol-dark) / <alpha-value>)',
          'dark-mid': 'rgb(var(--lol-dark-mid) / <alpha-value>)',
          blue: 'rgb(var(--lol-blue) / <alpha-value>)',
          'blue-dark': 'rgb(var(--lol-blue-dark) / <alpha-value>)'
        }
      },
      borderRadius: {
        DEFAULT: 'var(--radius-sm)',
        lg: 'var(--radius-lg)'
      },
      fontFamily: {
        sans: 'var(--font-ui)',
        mono: 'var(--font-mono)'
      }
    }
  },
  plugins: []
}
