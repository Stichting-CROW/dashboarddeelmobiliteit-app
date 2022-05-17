
const themes = {
  white: {
    backgroundColor: '#fff',
    borderColor: '#CCCCCC',
    color: '#343E47'
  }
}
function Button({
  theme,
  children,
  onClick
}) {
  return (
    <div
      className="
        rounded-lg
        inline-block
        border-solid border-2
        px-2
        py-2
        mr-2
        mb-2
        text-sm
      "
      style={themes[theme]}
    >
      {children}
    </div>
  )
}

export {
  Button
}

export default Button;
