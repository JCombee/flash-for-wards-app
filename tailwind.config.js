/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        lol: {
          gold: '#C89B3C',
          'gold-light': '#F0E6D3',
          dark: '#010A13',
          'dark-mid': '#0A1628',
          blue: '#0BC4E3',
          'blue-dark': '#0093B8'
        }
      }
    }
  },
  plugins: []
}
