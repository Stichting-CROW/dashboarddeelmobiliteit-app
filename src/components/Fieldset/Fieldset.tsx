function Fieldset({
  title,
  children,
  color
}: {
  title: string,
  children: any,
  color?: string
}) {
  return (
    <fieldset className="mb-6">
      <legend className="text-sm" style={Object.assign({
        marginBottom: '10px',
      }, color ? {
        borderBottom: `solid ${color} 4px`,
        marginBottom: `0.25rem`,
        paddingBottom: '2px',
      }: {})}>
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

export default Fieldset;
