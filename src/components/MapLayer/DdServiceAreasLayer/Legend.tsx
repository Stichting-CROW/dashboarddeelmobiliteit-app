import './Legend.css';

const legendItems = [
  {
    color: '#0f0',
    label: 'Toegevoegd'
  },
  {
    color: '#666',
    label: 'Onveranderd'
  },
  {
    color: '#f00',
    label: 'Verwijderd'
  },
  {
    color: '#c06427',
    label: 'Onveranderd'
  }
]

export const Legend = () => {
  return <div className="Legend gap-2">
    {/* <div className="font-bold">Legenda</div> */}
    <div className="grid grid-cols-2 gap-2">
      {legendItems.map((item) => (
        <div key={item.color.replace('#', '')} className="flex flex-row gap-2 items-center">
          <div className="w-4 h-4" style={{ backgroundColor: item.color }}></div>
          <div className="">{item.label}</div>
        </div>
      ))}
    </div>
  </div>
}