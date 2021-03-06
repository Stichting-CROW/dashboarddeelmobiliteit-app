import {themes} from '../../themes';

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
        cursor-pointer
      "
      onClick={onClick}
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
