import React from 'react'

function H4Title({
  children
}: {
  children?: any
}) {
  return (
    <h4 className='text-sm text-dark-blue font-semibold'>{children}</h4>
  )
}

export default H4Title