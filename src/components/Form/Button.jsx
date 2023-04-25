export default function Button({
  classes,
  href,
  onClick,
  color,
  children,
  title
}: {
  classes?: string,
  href?: any,
  onClick?: Function,
  color?: string,
  children?: string,
  title?: string
}) {
  return <button className={`
    px-6 py-2 my-4 rounded-lg
    transition-all
    duration-100
    ${color === 'blue' ? 'bg-theme-blue hover:bg-black text-white' : ''}
    ${color === 'gray' ? 'bg-gray-300 hover:bg-gray-400 text-white' : ''}
    ${classes}
  `}
  href={href}
  onClick={onClick}
  >
    {children}
  </button>
}
