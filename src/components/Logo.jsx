function Logo({
  title = ''
}) {
  return (
    <div className="flex">
      <img alt="Logo CROW" src="/images/logo-fietsberaad-crow.svg" width="82" />
      {title && <div style={{
        font: 'normal normal 600 18px/21px Inter',
        color: '#343E47'
      }} className="ml-4 flex flex-col justify-end">
        {title}
      </div>}
    </div>
  )
}

export default Logo;
