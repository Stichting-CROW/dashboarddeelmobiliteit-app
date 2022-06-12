import {themes} from '../../themes';
import {
  getIndicatorColor,
  getNumVehiclesAvailable,
  getNumPlacesAvailable
} from '../Map/MapUtils/zones.js';
import {motion} from 'framer-motion/dist/framer-motion'

function Tag({
  title,
  backgroundColor,
  beforeHtml,
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
      <div className="inline-block" dangerouslySetInnerHTML={{ __html: beforeHtml}} />
      {title}
    </motion.div>
  )
}

export const renderZoneTag = (
  {
    zone_id,
    name,
    geography_type,
    stop,
    onClick
  },
  isActive,
  viewMode
) => {
  const backgroundColors = {
    'monitoring': themes.zone.monitoring.primaryColor,
    'stop': themes.zone.stop.primaryColor,
    'no_parking': themes.zone.no_parking.primaryColor
  }
  // Function that adds some HTML to the tag
  const getBeforeHtml = (stop) => {
    if(! stop) return '';
    // 1. If manually closed: show this is the case
    if(stop.status.control_automatic ===  false && stop.status.is_returning === false) {
      return '<div class="mr-1">🔒</div>';
    }
    // 2. Set color that represents how full the zone is
    // Don't show color indicator if in admin mode
    if(viewMode !== 'readonly') return;
    // Check if stop has capacity property
    if(stop && stop.capacity) {
      const numPlacesAvailable = getNumPlacesAvailable(stop)
      const numVehiclesAvailable = getNumVehiclesAvailable(stop.realtime_data)
      return `<div class="
        rounded-full w-3 h-3 mr-2
        border border-2 border-white
      " style="background-color: ${getIndicatorColor(numPlacesAvailable, numVehiclesAvailable)}" />`
    }
    return '';
  }
  return <Tag
    key={zone_id}
    title={name}
    backgroundColor={backgroundColors[geography_type] || '#000'}
    beforeHtml={getBeforeHtml(stop)}
    onClick={onClick}
    isActive={isActive}
  >
    {name}
  </Tag>
}

export default Tag;
