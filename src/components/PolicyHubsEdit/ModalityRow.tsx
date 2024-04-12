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
    return <div className="
      bg-no-repeat
      pl-12
      h-8
      flex
      w-full
    " style={{
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
        {value ? value : ''}
      </div>
      {children}
    </div>
  }

  export default ModalityRow;
  