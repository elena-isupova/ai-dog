export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'text-[var(--accent)]',
    'text-[var(--warning)]',
    'text-[var(--distress)]',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
