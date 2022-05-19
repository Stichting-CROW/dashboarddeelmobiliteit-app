// import {themes} from '../../themes';

function Tag({
  title,
  backgroundColor
}) {
  return (
    <div
      className="
        inline-block
        rounded
        text-white
        px-2
        py-2
        mr-2
        mb-2
        text-sm
      "
      style={{backgroundColor: backgroundColor}}
    >
      {title}
    </div>
  )
}

export const renderZoneTag = ({zone_id, name, geography_type}) => {
  const backgroundColors = {
    'monitoring': '#15AEEF',
    'stop': '#FD862E',
    'no-parking': '#FD3E48'
  }
  return <Tag
    key={zone_id}
    title={name}
    backgroundColor={backgroundColors[geography_type] || '#000'}
  >
    {name}
  </Tag>
}

export default Tag;
