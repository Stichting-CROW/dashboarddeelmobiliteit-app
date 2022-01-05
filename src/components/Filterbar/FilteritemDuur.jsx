import './css/Filterbar.css';
import './css/FilteritemDuur.css';
import { useDispatch, useSelector } from 'react-redux';

const c1Hour = 60 * 60 * 1000;

function FilterItemInterval() {
  const dispatch = useDispatch()
  
  const filterDuration = useSelector(state => {
    return state.filter ? state.filter.intervalduur : c1Hour;
  });
  
  // const setFilterInterval = e => {
  //   e.preventDefault();
  //
  //   if (!e.target['validity'].valid) return;
  //
  //   const datum = (new Date(e.target.value)).toISOString();
  //   dispatch({
  //     type: useduration ? 'SET_FILTER_INTERVAL_START':'SET_FILTER_INTERVAL_END',
  //     payload: datum
  //   })
  // }
  
  // https://webreflection.medium.com/using-the-input-datetime-local-9503e7efdce
  // function toDatetimeLocal(ISOString) {
  //   const date = new Date(ISOString)
  //   const
  //     ten = function (i) {
  //       return (i < 10 ? '0' : '') + i;
  //     },
  //     YYYY = date.getFullYear(),
  //     MM = ten(date.getMonth() + 1),
  //     DD = ten(date.getDate()),
  //     HH = ten(date.getHours()),
  //     II = ten(date.getMinutes()),
  //     SS = ten(date.getSeconds())
  //   ;
  //   return YYYY + '-' + MM + '-' + DD + 'T' +
  //            HH + ':' + II + ':' + SS;
  // };
  //
  // const renderSelectInterval = (isStart) => {
  //   const value = toDatetimeLocal(isStart ? filterDuration : filterIntervalEnd);
  //   return (
  //     <ModalBox className="min-width-48" closeFunction={setShowSelectInterval}>
  //       <div className="filter-form-selectie">
  //         <div className="filter-form-title">Selecteer Datum</div>
  //         <form key="f-end" className="h-12 w-auto flex flex-row border-solid border-4 border-light-blue-500 box-border">
  //           <input className="bg-transparent flex-2 flex-grow" type="datetime-local" value={value} onChange={setFilterInterval} />
  //           <div className="flex-2"/>
  //         </form>
  //         <div className="flex-none closebutton text-center mt-4" onClick={e=>setShowSelectInterval(false)}>OK</div>
  //       </div>
  //    </ModalBox>);
  // }
  //
  // let duration = new Date(filterDuration).toLocaleString();
  // let intervalEnd = new Date(filterIntervalEnd).toLocaleString();
  // console.log("got interval %s - %s", duration, intervalEnd);

    //  onClick={e=>{setShowSelectInterval(!showSelectInterval)}}
    //  onClick={e=>{setUseduration(true); setShowSelectInterval(true)}}
  const cAnnotations = [
    { label:'1h', anchor: 'start', pos: '0%', value: c1Hour },
    { label:'4h', anchor: 'middle', pos: '15%', value: c1Hour * 4},
    { label:'8h', anchor: 'middle', pos: '26.5%', value: c1Hour * 8},
    { label:'12h', anchor: 'middle', pos: '39%', value: c1Hour * 12},
    { label:'16h', anchor: 'middle', pos: '50%', value: c1Hour * 16},
    { label:'20h', anchor: 'middle', pos: '62%', value: c1Hour * 20},
    { label:'24h', anchor: 'middle', pos: '73.5%', value: c1Hour * 24},
    { label:'5d', anchor: 'middle', pos: '85.5%', value: c1Hour * 24 * 5},
    { label:'7d', anchor: 'end', pos: '100%', value: c1Hour * 24 * 7}];
  let elements = cAnnotations.map(
    e=>(<text class="filter-duur-annotation" x={e.pos} y="14" text-anchor={e.anchor}>{e.label}</text>)
  );
  
  let ticks = cAnnotations.map(
    e=>(<rect class="filter-duur-tickmark" x={e.pos} y="0" width="1" height="20"></rect>)
  );
  
  const handleSetDuration = e => {
    dispatch({
      type: 'SET_FILTER_INTERVAL_DUUR',
      payload: cAnnotations[e.target.value].value
    })
  }
  
  let currentDurationIdx = cAnnotations.findIndex(v=>(v.value===filterDuration));
  if(currentDurationIdx===-1) { currentDurationIdx = 4 }
  
  return (
    <div className="filter-duur-container">
      <div className="filter-duur-box-row">
        <input className="filter-duur-range" width="100%" type="range" min="0" max={cAnnotations.length-1} step="1" onChange={handleSetDuration} value={currentDurationIdx}/>
        <svg className="filter-duur-tickmarks" role="presentation" width="100%" height="10" xmlns="http://www.w3.org/2000/svg">
          { ticks }
        </svg>
        <svg className="filter-duur-elements" role="presentation" width="100%" height="14" xmlns="http://www.w3.org/2000/svg">
          { elements }
        </svg>
      </div>
    </div>
  )
}

export default FilterItemInterval;
