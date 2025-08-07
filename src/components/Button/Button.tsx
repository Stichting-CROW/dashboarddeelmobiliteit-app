import {themes} from '../../themes';

function Button({
  theme,
  children,
  onClick,
  type,
  title,
  disabled,
  classes,
  style
}: {
  theme?: string,
  children?: any,
  onClick?: any,
  title?: string,
  type?: "button" | "reset" | "submit",
  classes?: string,
  disabled?: any,
  style?: object
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
        mx-2
        my-2
        text-center
        ${disabled ? '' : 'cursor-pointer'}
        ${disabled ? 'opacity-25' : ''}
      `}
      disabled={disabled}
      type={type}
      title={title}
      onClick={onClick}
      style={Object.assign({}, themes[theme], style)}
    >
      {children}
    </button>
  )
}

export {
  Button
}

export default Button;
