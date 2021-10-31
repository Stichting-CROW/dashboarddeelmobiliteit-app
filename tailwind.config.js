module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html', './src/components/*.{js,jsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: "blue",
        secondary: "purple",
        "text-base": "white",
        "text-menu": "text-blue-500"
      }
    },
  },
  variants: {
    extend: {
      minWidth: {
        '48': '12rem',
      }
    },
  },
  plugins: [],
}
