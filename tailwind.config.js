module.exports = {
  mode: 'jit',
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html', './src/components/*.{js,jsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary:  "#15AEEF",
        secondary: "purple",
        "dark-blue": '#343E47',
        "text-base": "white",
        "text-menu": "text-blue-500"
      }, 
      fontSize: {
        sm: ['14px', '17px'],
        base: ['16px', '24px'],
        lg: ['20px', '28px'],
        xl: ['34px', '41px'],
      }
    },
  },
  variants: {
    extend: {
    },
  },
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    './node_modules/tw-elements/dist/js/**/*.js'
  ],
  plugins: [require("tw-elements/dist/plugin")]
}