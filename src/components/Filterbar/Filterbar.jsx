import './css/Filterbar.css';
// import SlideBox from '../SlideBox/SlideBox.jsx';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import FilteritemInterval from './FilteritemInterval.jsx';
import FilteritemAanbieders from './FilteritemAanbieders.jsx';
import FilteritemZones from './FilteritemZones.jsx';
import FilteritemMarkers from './FilteritemMarkers.jsx';
import FilteritemVoertuigTypes from './FilteritemVoertuigTypes.jsx';
import SlideBox from '../SlideBox/SlideBox.jsx';

function Filterbar({showinterval=false, visible=false}) {
  return (
    <div className="filter-bar">
      <SlideBox direction="left" options={{
        title: 'Filters',
        backgroundColor: '#F6F5F4',
      }}>
        <div className="filter-bar-inner">
          { showinterval
            ? <FilteritemInterval />
            : <FilteritemDatum />
          }
          <FilteritemGebieden />
          <FilteritemZones />
          <FilteritemMarkers />
          <FilteritemVoertuigTypes />
          <FilteritemAanbieders />
        </div>
      </SlideBox>
    </div>
  )
}

export default Filterbar;
