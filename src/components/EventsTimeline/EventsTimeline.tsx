import {useEffect, useState, useRef} from 'react';
import { Timeline } from "vis-timeline";
import { DataSet } from "vis-data";

import {getProviderColor, getProviderColors} from '../../helpers/providers.js';

// Import components
import { useSearchParams } from 'react-router-dom'

import './EventsTimeline.css';
import './visjs-timeline.css';

let timeline;

// https://mds.dashboarddeelmobiliteit.nl/public/service_area/history?municipalities=GM0599&operators=check&start_date=2024-01-21&end_date=2024-02-28
const EventsTimeline = ({
  changeHistory
}: {
  changeHistory: any
}) => {
  const [events, setEvents] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [providerColors, setProviderColors] = useState({});

  useEffect(() => {
    setProviderColors(getProviderColors())
  }, []);

  useEffect(() => {
    populateHistoryTimeline();
  }, [
    changeHistory
  ])

  let TO_toggleTimeline;

  // Create a ref to provide DOM access
  const visJsRef = useRef<HTMLDivElement>(null);

  const today = new Date(new Date().setHours(0,0,0,0));
  const sixDaysAgo = new Date(today); sixDaysAgo.setDate(today.getDate() - 6);

  // Set timeline options
  var timelineOptions = {
    showCurrentTime: true,
    showWeekScale: true,//When showWeekScale is true, week number labels are shown.
    start: sixDaysAgo,
    end: today,
    stack: false,
    orientation: {// demo: https://visjs.github.io/vis-timeline/examples/timeline/styling/axisOrientation.html
      axis: 'top',
      item: 'top'
    },
    height: '125px',
    min: new Date(2023, 0, 1),                // lower limit of visible range
    // max: new Date(2013, 0, 1),                // upper limit of visible range
    zoomMin: 1000 * 60 * 60 * 24 * 3,             // 6 days in milliseconds
    zoomMax: 1000 * 60 * 60 * 24 * 31 * 3     // about three months in milliseconds
  };
  var clusterOpts = {
    cluster: {
      titleTemplate: "{count} wijzigingen: zoom in om deze te bekijken",
      showStipes: true,
    }
  };
  Object.assign(timelineOptions, clusterOpts);

  // Once the ref is created, we'll be able to use vis
  useEffect(() => {
    if(! visJsRef) return;
    if(! events || events.length <= 0) return;

    // Set timeline items
    var items = new DataSet(events);

    // Clear timeline div
    visJsRef.current.innerHTML = '';

    // Init timeline
    timeline = new Timeline(visJsRef.current, items, timelineOptions);

    timeline.on('click', function (properties) {
      if(! properties || ! properties.item) return;

      // Get service_area_version_id from item name:
      const version = properties.item.split('-')[properties.item.split('-').length-1];
      if(! version) return;

      searchParams.set('version', version);
      setSearchParams(searchParams);
    });
  }, [
      visJsRef,
      events
  ]);

  const populateHistoryTimeline = () => {
    if(! changeHistory) return;

    const events = changeHistory.map((x) => {
      const dateObj = new Date(x.valid_from);
      const month   = dateObj.getUTCMonth(); // months from 0-11
      const day     = dateObj.getUTCDate();
      const year    = dateObj.getUTCFullYear();
      const date = new Date(year, month, day);

      return {
        id: `${x.municipality}-${x.operator}-${x.service_area_version_id}`,
        start: date,
        content: new Date(x.valid_from).toLocaleString('nl-NL').slice(0, -3)
      }
    });
    // .slice(changeHistory.length-10, changeHistory.length);

    setEvents(events)
  }
  
  // const enlargeTimeline = () => {
  //     if(! visJsRef || ! visJsRef.current) return;
  //     if(! timeline) return;

  //     timeline.setOptions(Object.assign({}, timelineOptions, {height:"225px"}));
  //     visJsRef.current.style.height = '225px';
  // }

  // const shrinkTimeline = () => {
  //     if(! visJsRef || ! visJsRef.current) return;
  //     if(! timeline) return;

  //     timeline.setOptions(Object.assign({}, timelineOptions, {height:"125px"}));
  //     visJsRef.current.style.height = '125px';
  // }

  if(! changeHistory || changeHistory.length <= 0) {
    return <div />
  }

  return <div
    ref={visJsRef}
    className="EventsTimeline sm:rounded-3xl"
    onMouseOver={() => {
      // clearTimeout(TO_toggleTimeline);
      // enlargeTimeline();
    }}
    onMouseOut={() => {
      // clearTimeout(TO_toggleTimeline);
      // TO_toggleTimeline = setTimeout(() => {
      //     shrinkTimeline();
      // }, 500);
    }}>
      {/* <div className="line" />
      <div className="events-wrapper">
          {events.map(x => <div className={`
              event dot-label
              text-xs
              ${searchParams.get('version') == x.service_area_version_id ? 'is-active' : ''}
          `}
          key={`${x.operator}-${x.service_area_version_id}`}
      >
              <span className="event-title">
                  {x.validjalf_from_formatted}
              </span>
              <span className={`
                  dot
                  ${searchParams.get('version') == x.service_area_version_id ? 'is-active' : ''}
              `} onClick={() => {
                  searchParams.set('version', x.service_area_version_id);
                  setSearchParams(searchParams);
              }} />
          </div>)}
      </div> */}
    </div>
}

export default EventsTimeline;
