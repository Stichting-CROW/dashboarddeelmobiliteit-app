import React from 'react'

function H5Title({
  children,
  className
}: {
  children: any,
  className?: string
}) {
  return (
    <h5 className={`text-sm text-dark-blue font-medium ${className}`}>
      {children}
    </h5>
  )
}

export default H5Title