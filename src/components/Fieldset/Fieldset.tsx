import type { ReactNode } from 'react';

function Fieldset({
  title,
  titleAddon,
  children,
  color
}: {
  title: string,
  /** Rendered right-aligned on the same line as the title */
  titleAddon?: ReactNode,
  children: any,
  color?: string
}) {
  return (
    <fieldset className="mb-6">
      <legend className={titleAddon ? 'text-sm w-full' : 'text-sm'} style={Object.assign({
        marginBottom: '10px',
      }, color ? {
        borderBottom: `solid ${color} 4px`,
        marginBottom: `0.25rem`,
        paddingBottom: '2px',
      }: {})}>
        {titleAddon ? (
          <span className="flex items-baseline justify-between gap-2">
            <span>{title}</span>
            {titleAddon}
          </span>
        ) : title}
      </legend>
      {children}
    </fieldset>
  )
}

export default Fieldset;
