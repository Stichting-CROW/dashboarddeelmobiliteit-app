import React from 'react'

function H4Title({
  children,
  className
}: {
  children?: any,
  className?: any
}) {
  return (
    <h4 className={`text-sm text-dark-blue font-semibold ${className}`}>{children}</h4>
  )
}

export default H4Title