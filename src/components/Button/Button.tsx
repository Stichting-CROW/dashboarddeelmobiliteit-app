import {themes} from '../../themes';

function Button({
  theme,
  children,
  onClick,
  type,
  title,
  classes
}: {
  theme?: string,
  children?: any,
  onClick?: any,
  title?: any,
  type?: "button" | "reset" | "submit",
  classes?: string
}) {
  return (
    <button
      className={`
        ${classes}
        rounded-lg
        inline-block
        border-solid border-2
        px-2
        py-2
        mr-2
        mb-2
        text-sm
        cursor-pointer
        mx-2
        my-2
        text-center
      `}
      type={type}
      onClick={onClick}
      style={themes[theme]}
    >
      {children}
    </button>
  )
}

export {
  Button
}

export default Button;
