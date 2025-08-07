function ModalityRow({
    children,
    imageUrl,
    onChange,
    name,
    value
  }: {
    children?: any,
    imageUrl?: any,
    onChange?: any,
    name?: any,
    value?: any
  }) {
    return <div className={`
      bg-no-repeat
      h-8
      flex
      w-full
      ${imageUrl && imageUrl.length > 0 ? `pl-12` : ''}
    `} style={{
      backgroundImage: `url('${imageUrl}')`,
      backgroundSize: '30px',
      backgroundPosition: 'center left'
    }}>
      <input
        name={name}
        className="flex-1"
        width="100%"
        type="range"
        min="0"
        max="250"
        step="1"
        onChange={onChange}
        value={value}
        style={{width: "calc(100% - 48px)"}}
      />
      <div className="text-xs ml-2 h-8 flex justify-center flex-col">
        <input type="number" min="0" value={value}
          className="w-12 text-center py-2 border solid"
          onChange={onChange}
        />
      </div>
      {children}
    </div>
  }

  export default ModalityRow;
  