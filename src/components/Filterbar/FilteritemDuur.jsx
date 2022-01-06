import './css/Filterbar.css';
import './css/FilteritemDuur.css';
import { useDispatch, useSelector } from 'react-redux';

const c1Hour = 60 * 60 * 1000;

function FilterItemInterval() {
  const dispatch = useDispatch()
  
  const filterDuration = useSelector(state => {
    return state.filter ? state.filter.intervalduur : c1Hour;
  });
  
  const cAnnotations = [
    { label:'1h', anchor: 'start', pos: '0%', value: c1Hour },
    { label:'4h', anchor: 'middle', pos: '15%', value: c1Hour * 4},
    { label:'8h', anchor: 'middle', pos: '26.5%', value: c1Hour * 8},
    { label:'12h', anchor: 'middle', pos: '39%', value: c1Hour * 12},
    { label:'16h', anchor: 'middle', pos: '50%', value: c1Hour * 16},
    { label:'20h', anchor: 'middle', pos: '62%', value: c1Hour * 20},
    { label:'24h', anchor: 'middle', pos: '73.5%', value: c1Hour * 24},
    { label:'2d', anchor: 'middle', pos: '85.5%', value: c1Hour * 24 * 2},
    { label:'3d', anchor: 'middle', pos: '96%', value: c1Hour * 24 * 3}
  ];
  let elements = cAnnotations.map(
    (e,i) => (<text key={'fide-'+i} className="filter-duur-annotation" x={e.pos} y="14" textAnchor={e.anchor}>{e.label}</text>)
  );
  
  let ticks = cAnnotations.map(
    (e,i) => (<rect key={'fidt-'+i} className="filter-duur-tickmark" x={e.pos} y="0" width="1" height="20"></rect>)
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
