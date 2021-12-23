import './css/Filterbar.css';
import {useSelector} from 'react-redux';
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

function Filterbar({showinterval=false, visible}) {
  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  return (
    <SlideBox name="FilterBar" direction="left" options={{
      title: 'Filters',
      backgroundColor: '#F6F5F4',
    }} style={{
      width: '324px',
      height: '100%',
      top: 0,
      position: 'fixed'
    }}
    isVisible={visible}
    >
      <div className="filter-bar-inner py-2">
        <Logo />
        {isLoggedIn && <div>
          { showinterval
            ? <FilteritemInterval />
            : <FilteritemDatum />
          }
        </div>}
        {isLoggedIn && <FilteritemGebieden />}
        {isLoggedIn && <FilteritemZones />}
        {isLoggedIn && <FilteritemMarkers />}
        {isLoggedIn && <FilteritemVoertuigTypes />}
        {isLoggedIn && <FilteritemAanbieders />}
      </div>
    </SlideBox>
  )
}

export default Filterbar;
