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
import Logo from '../Logo.jsx';

function Filterbar({showinterval=false, visible=false}) {
  return (
    <SlideBox name="FilterBar" direction="left" options={{
      title: 'Filters',
      backgroundColor: '#F6F5F4',
    }} style={{
      width: '324px',
      height: '100%',
      top: 0,
      position: 'fixed'
    }}>
      <div className="filter-bar-inner py-2">
        <Logo />
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
  )
}

export default Filterbar;
