export default function Button({
  classes,
  href,
  onClick,
  color,
  children,
}) {
  return <button className={`
    px-6 py-2 my-4 rounded-lg
    ${color === 'blue' ? 'bg-theme-blue text-white' : ''}
    ${color === 'gray' ? 'bg-gray-300 hover:bg-gray-400 text-white' : ''}
    ${classes}
  `}
  href={href}
  onClick={onClick}
  >
    {children}
  </button>
}
