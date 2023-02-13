import {useState, useEffect} from 'react';

import {themes} from '../../themes';

import $ from 'jquery';

import Button from '../Form/Button.jsx';

const weekDays = [
  'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'
];

const getOpacityForCount = (count: number, maxCount: number): number => {
  if(! count) return 0;
  if(! maxCount) return 0;
  return (count / maxCount).toFixed(1);
}

const getHourlyCount = (data, weekDay, hour, maxCount) => {
  if(! data) return 0;
  if(! data[`day-${weekDay}`]) return 0;
  if(! data[`day-${weekDay}`][`hour-${hour}`]) return 0;
  return data[`day-${weekDay}`][`hour-${hour}`];
}

const renderHourlyCounts = (data, weekDay, maxCount) => {
  let html = [];
  for(let hour = 0; hour <= 23; hour++) {
    const hourlyCount = getHourlyCount(data, weekDay, hour);
    const opacityForCount = getOpacityForCount(hourlyCount, maxCount);
    html.push(<div key={`day-${weekDay}-hour-${hour}`} data-day={weekDay} data-hour={hour} className={`flex-1 text-center TimeGrid-day TimeGrid-hour`} style={{
      color: `rgba(21, 174, 239, ${opacityForCount})`,
      backgroundColor: `rgba(21, 174, 239, ${opacityForCount})`,
      borderBottom: 'solid 1px #fff',
      borderLeft: 'solid 1px #fff',
    }} data-value={hourlyCount}>
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
    html.push(<div key={`hour-${hour}`} data-hour={hour} className={`TimeGrid-hour-header flex-1 text-center text-sm`}>{hour}</div>)
  }
  return <div className="flex flex-1 h-8">
    {html}
  </div>
}

// Day row
const renderWeekDay = (data, day, weekDay, maxCount) => {
  return <div className="flex h-8" key={`${day}`}>
    <div className="w-12 TimeGrid-day-header flex justify-center flex-col" data-day={weekDay}>{day}</div>
    {renderHourlyCounts(data, weekDay, maxCount)}
  </div>
}

// Gets highest count, so we can do conditional formatting
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

  const [counter, setCounter] = useState(0);
  const [showIt, setShowIt] = useState(false);

  useEffect(() => {
    if(! showIt) return;

    const onMouseOverHour = (e) => {
      const hour = $(e.target).data('hour');
      $(`.TimeGrid-hour-header[data-hour=${hour}]`).css('color', '#15aeef').addClass('font-bold');

      const day = $(e.target).data('day');
      $(`.TimeGrid-day-header[data-day=${day}]`).css('color', '#15aeef').addClass('font-bold');
    }

    const onMouseOutHour = (e) => {
      const hour = $(e.target).data('hour');
      $(`.TimeGrid-hour-header[data-hour=${hour}]`).css('color', '#000').removeClass('font-bold');

      const day = $(e.target).data('day');
      $(`.TimeGrid-day-header[data-day=${day}]`).css('color', '#000').removeClass('font-bold');
    }

    $('.TimeGrid-hour').on('mouseover', onMouseOverHour);
    $('.TimeGrid-hour').on('mouseout', onMouseOutHour);

    return () => {
      $('.TimeGrid-hour').off('mouseover', onMouseOverHour);
      $('.TimeGrid-hour').off('mouseout', onMouseOutHour);
    }

  }, [showIt]);

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
