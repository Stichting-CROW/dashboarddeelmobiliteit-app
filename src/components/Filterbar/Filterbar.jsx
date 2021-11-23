import './css/Filterbar.css';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import FilteritemInterval from './FilteritemInterval.jsx';
import FilteritemAanbieders from './FilteritemAanbieders.jsx';
import FilteritemZones from './FilteritemZones.jsx';
import FilteritemMarkers from './FilteritemMarkers.jsx';

function Filterbar({showinterval=false, visible=false}) {
  // console.log("show interval %s", showinterval)
  return (
    <div className="filter-bar" style={{left: visible ? '0':'-324px'}}>
      { showinterval
        ? <FilteritemInterval />
        : <FilteritemDatum />
      }
      <FilteritemGebieden />
      <FilteritemZones />
      <FilteritemMarkers />
      <FilteritemAanbieders />
    </div>
    )
}

export default Filterbar;
