import './css/Filterbar.css';
import {useSelector} from 'react-redux';
// import SlideBox from '../SlideBox/SlideBox.jsx';
import FilteritemGebieden from './FilteritemGebieden.jsx';
import FilteritemDatum from './FilteritemDatum.jsx';
import FilteritemDuur from './FilteritemDuur.jsx';
import FilteritemAanbieders from './FilteritemAanbieders.jsx';
import FilteritemZones from './FilteritemZones.jsx';
import {
  FilteritemMarkersAfstand,
  FilteritemMarkersParkeerduur
} from './FilteritemMarkers.jsx';
import FilteritemHerkomstBestemming from './FilteritemHerkomstBestemming';
import FilteritemVoertuigTypes from './FilteritemVoertuigTypes.jsx';
import Logo from '../Logo.jsx';

function Filterbar({showduur=false, showparkeerduur=true, showafstand=false, showherkomstbestemming=false, visible, hideLogo}) {
  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });

  return (
    <div className="filter-bar-inner py-2">

      {! hideLogo && <Logo />}
      
      {isLoggedIn &&
        <div>
          <FilteritemDatum />

          { showduur ? <FilteritemDuur /> : null }
        </div>
      }

      {<FilteritemGebieden />}

      {<FilteritemZones />}

      {isLoggedIn && showparkeerduur && <FilteritemMarkersParkeerduur />}

      {isLoggedIn && showafstand && <FilteritemMarkersAfstand />}

      {isLoggedIn && showherkomstbestemming && <FilteritemHerkomstBestemming />}

      {<FilteritemVoertuigTypes />}

      {<FilteritemAanbieders />}

    </div>
  )
}

export default Filterbar;
