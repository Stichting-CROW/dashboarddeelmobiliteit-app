import React, {useEffect, useState} from 'react';
import { useSelector } from 'react-redux';
import SlideBox from '../SlideBox/SlideBox.jsx';

import {getParkEventsStats} from '../../api/parkEventsStats.js';

// import './MetaStats.css';

function StatRow({data}) {
  if(! data.stats) return <></>

  let total = 0;
  data.stats.forEach(x => {
    total += x
  })

  return <tr key={data.zone_id}>
    <td key={data.zone_id+'name'} className="py-1 px-2">{data.name}</td>
    <td key={data.zone_id+'total'}className="py-1 px-2">{total}</td>
    {data.stats.map((x,i) => {
      return <td key={'p'+i} className="py-1 px-2 text-center">{x}</td>
    })}
  </tr>
}

function MetaStats(props) {
  // const {setLayers, setActiveSource} = props;
  // const dispatch = useDispatch()

  // const isLoggedIn = useSelector(state => {
  //   return state.authentication.user_data ? true : false;
  // });

  const token = useSelector(state => {
    if(state.authentication && state.authentication.user_data) {
      return state.authentication.user_data.token;
    }
    return null;
  });
  const filter = useSelector(state => state.filter)
  const metadata = useSelector(state => state.metadata)

  const [metaStatsData, setMetaStatsData] = useState([])

  useEffect(() => {
    // Do not get meta stats until you have 'zones'
    if(! metadata || ! metadata.zones || metadata.zones.length <= 0) return;
    async function gogogo() {
      const result = await getParkEventsStats(token, {
        filter: filter,
        metadata: metadata
      });
      setMetaStatsData(result);
    }
    gogogo();
  }, [filter, metadata, token]);
    
  const markers = [
    { id: 0, color: '#1FA024', fillcolor: '#1FA024', name: '< 1 uur'},
    { id: 1, color: '#48E248', fillcolor: '#48E248', name: '< 24 uur'},
    { id: 2, color: '#FFD837', fillcolor: '#FFD837', name: '< 4 d'},
    { id: 3, color: '#FD3E48', fillcolor: '#FD3E48', name: '> 4 d'}
  ];

  if(! metaStatsData || ! metaStatsData.park_event_stats || metaStatsData.park_event_stats.length <= 0) {
    return <></>
  }

  return (
    <SlideBox name="MetaStats" direction="right" options={{
      title: 'Info',
      backgroundColor: '#fff',
    }} style={{
      position: 'absolute',
      top: '125px',
      right: 0
    }}>
      <div className="MetaStats px-2 py-2" style={{minWidth: '356px', minHeight: '105px'}}>
        <table className="text-sm text-left w-full">
          <thead className="border-b-2 border-gray-200">
            <tr>
              <th className="py-1 px-2 text-left font-normal">Zone</th>
              <th className="py-1 px-2 pr-4 text-left font-normal">Totaal</th>
              {markers.map(marker => {
                return <th className="py-1 px-2 text-center">
                  <div className="w-6 h-6 ">
                    <svg viewBox='0 0 30 30' >
                      <circle cx={'50%'} cy={'50%'} r={'40%'} fill={marker.color} />
                      <circle cx={'50%'} cy={'50%'} r={'34%'} fill={marker.fillcolor} />
                    </svg>
                  </div>
                </th>
              })}
            </tr>
          </thead>
          <tbody>
            {metaStatsData.park_event_stats.map(x => {
              return <StatRow data={x} />
            })}
          </tbody>
        </table>
      </div>
    </SlideBox>
  )
}

export {
  MetaStats
}