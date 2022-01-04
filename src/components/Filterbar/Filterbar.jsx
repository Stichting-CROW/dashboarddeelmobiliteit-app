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
import Logo from '../Logo.jsx';

function Filterbar({showinterval=false, visible, hideLogo}) {
  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  return (
    <div className="filter-bar-inner py-2">

      {! hideLogo && <Logo />}

      {isLoggedIn && <div>
        { showinterval
          ? <FilteritemInterval />
          : <FilteritemDatum />
        }
      </div>}

      {<FilteritemGebieden />}

      {<FilteritemZones />}

      {isLoggedIn && <FilteritemMarkers />}

      {<FilteritemVoertuigTypes />}

      {<FilteritemAanbieders />}

    </div>
  )
}

export default Filterbar;
