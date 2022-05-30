import {themes} from '../../themes';
import {motion} from 'framer-motion/dist/framer-motion'


function Tag({
  title,
  backgroundColor,
  onClick
}) {
  return (
    <motion.div
      className={`
        inline-block
        rounded
        text-white
        px-2
        py-2
        mr-2
        mb-2
        text-sm
        ${onClick ? 'cursor-pointer' : ''}
      `}
      style={{backgroundColor: backgroundColor}}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 1.01 }}
    >
      {title}
    </motion.div>
  )
}

export const renderZoneTag = ({
  zone_id,
  name,
  geography_type,
  onClick
}) => {
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
  >
    {name}
  </Tag>
}

export default Tag;
