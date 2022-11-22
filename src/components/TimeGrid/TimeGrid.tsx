import {useState} from 'react';

import {themes} from '../../themes';

import Button from '../Form/Button.jsx';

const weekDays = [
  'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'
];

const getOpacityForCount = (count: number, maxCount: number): number => {
  if(! count) return 0;
  if(! maxCount) return 0;
  return (count / maxCount).toFixed(1);
}

const getHourlyCount = (data, dayNumber, hour, maxCount) => {
  if(! data) return 0;
  if(! data[dayNumber]) return 0;
  if(! data[dayNumber][hour]) return 0;
  return data[dayNumber][hour];
}

const renderHourlyCounts = (data, dayNumber, maxCount) => {
  let html = [];
  for(let hour = 0; hour <= 23; hour++) {
    const hourlyCount = getHourlyCount(data, dayNumber, hour);
    const opacityForCount = getOpacityForCount(hourlyCount, maxCount);
    html.push(<div key={`day-${dayNumber}-hour-${hour}`} className="flex-1 text-center" style={{
      color: `rgba(21, 174, 239, ${opacityForCount})`,
      backgroundColor: `rgba(21, 174, 239, ${opacityForCount})`,
      borderBottom: 'solid 1px #fff',
      borderLeft: 'solid 1px #fff',
    }}>
      {/*{hourlyCount}*/}
    </div>)
  }
  return <div className="flex flex-1">
    {html}
  </div>
}

const renderHours = (data) => {
  let html = [];
  html.push(<div className="w-12"></div>)
  for(let hour = 0; hour <= 23; hour++) {
    html.push(<div key={`hour-${hour}`} className="flex-1 text-center">{hour}</div>)
  }
  return <div className="flex flex-1 h-8">
    {html}
  </div>
}

// Day row
const renderWeekDay = (data, day, idx, maxCount) => {
  const dayAsNumber = idx+1;
  return <div className="flex h-8" key={`${day}`}>
    <div className="w-12">{day}</div>
    {renderHourlyCounts(data, dayAsNumber, maxCount)}
  </div>
}

const getHighestCount = (data) => {
  let maxCount = 0;
  Object.keys(data).forEach(weekDay => {
    if(! data[weekDay]) return;
    Object.keys(data[weekDay]).forEach(hour => {
      if(! data[weekDay][hour]) return;
      if(data[weekDay][hour] > maxCount) {
        maxCount = data[weekDay][hour];
      }
    })
  })
  return maxCount;
}

function TimeGrid({
  data
}) {

  const [showIt, setShowIt] = useState(false);

  // Get max count for all data
  let maxCount = 0;
  if(showIt) {
    maxCount = getHighestCount(data);
  }

  return <div className="TimeGrid">
    {! showIt && <button className="
      px-6 py-2 my-4 -mt-8 rounded-lg
      transition-all
      duration-100
      bg-theme-blue hover:bg-black text-white
      
      mr-2
    " onClick={() => setShowIt(true)}>
      Toon gemiddelde bezetting
    </button>}

    {showIt && <>
      {renderHours(data)}
      {weekDays.map((day, idx) => renderWeekDay(data, day, idx, maxCount))}
    </>}
  </div>
}

export default TimeGrid;
