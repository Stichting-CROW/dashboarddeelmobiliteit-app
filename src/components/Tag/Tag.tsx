import {themes} from '../../themes';

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

export const renderZoneTag = ({title, type}) => {
  const backgroundColors = {
    'parking': '#FD862E',
    'no-parking': '#FD3E48',
    'analysis': '#15AEEF'
  }
  return <Tag
    key={title}
    title={title}
    backgroundColor={backgroundColors[type] || '#000'}
  >
    {title}
  </Tag>
}

export default Tag;
