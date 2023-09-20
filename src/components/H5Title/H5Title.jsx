import React from 'react'

function H5Title({
  children,
  classes
}: {
  children: any,
  classes?: string
}) {
  return (
    <h5 className={`${classes} text-sm text-dark-blue font-medium`}>
      {children}
    </h5>
  )
}

export default H5Title