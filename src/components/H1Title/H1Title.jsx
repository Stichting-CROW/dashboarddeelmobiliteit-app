import React from 'react'

function H1Title({
  children,
  className,
  style
}: {
  children: any,
  className?: string,
  style?: object
}) {
  return (
    <h1 className={`text-xl text-dark-blue font-semibold ${className}`} style={style}>
      {children}
    </h1>
  )
}

export default H1Title
