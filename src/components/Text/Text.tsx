import {themes} from '../../themes';

function Text({
  theme,
  children,
  onClick,
  classes
}) {
  return (
    <div
      className={`
        inline-block
        py-2
        mb-2
        text-sm
        cursor-pointer
        ${classes}
      `}
      onClick={onClick}
      style={{
        color: themes[theme].color
      }}
    >
      {children}
    </div>
  )
}

export {
  Text
}

export default Text;
