import {themes} from '../../themes';
import {motion} from 'framer-motion/dist/framer-motion'

function Tag({
  title,
  backgroundColor,
  onClick,
  isActive
}) {
  return (
    <motion.div
      className={`
        inline-block
        rounded
        text-white
        px-2
        py-2
        pb-1
        mr-2
        mb-2
        text-sm
        relative
        ${onClick ? 'cursor-pointer' : ''}
      `}
      style={{
        backgroundColor: isActive ? '#fff' : backgroundColor,
        color: isActive ? '#000' : false,
        borderBottom: isActive ? 'solid #000 3px' : 'solid transparent 3px',
        boxShadow: isActive ? '0px -3px 0px #003' : 'none',
        opacity: isActive ? '0.8' : '1',
        borderRadius: isActive ? 0 : false,
        top: isActive ? '2px' : false
      }}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 1.01 }}
    >
      {title}
    </motion.div>
  )
}

export const renderZoneTag = (
  {
    zone_id,
    name,
    geography_type,
    onClick
  },
  isActive
) => {
  const backgroundColors = {
    'monitoring': themes.zone.monitoring.primaryColor,
    'stop': themes.zone.stop.primaryColor,
    'no_parking': themes.zone.no_parking.primaryColor
  }
  return <Tag
    key={zone_id}
    title={name}
    backgroundColor={backgroundColors[geography_type] || '#000'}
    onClick={onClick}
    isActive={isActive}
  >
    {name}
  </Tag>
}

export default Tag;
