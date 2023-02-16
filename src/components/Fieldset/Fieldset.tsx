function Fieldset({
  title,
  children,
}: {
  title: string,
  children: any
}) {
  return (
    <fieldset className="mb-6">
      <legend className="text-sm mb-1">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

export default Fieldset;
