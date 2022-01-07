import { useEffect, useRef, useState } from 'react';
import {
 Switch,
 Route,
 useLocation,
} from "react-router-dom";
import moment from 'moment';
import { store } from './AppProvider.js';
import { useSelector, useDispatch } from 'react-redux';

import Menu from './components/Menu.jsx';
import MenuSecondary from './components/Menu/MenuSecondary.jsx';
import MapPage from './pages/MapPage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import Login from './pages/Login.jsx';
import Monitoring from './pages/Monitoring.jsx';
import FilterbarDesktop from './components/Filterbar/FilterbarDesktop.jsx';
import FilterbarMobile from './components/Filterbar/FilterbarMobile.jsx';
import About from './components/About/About.jsx';
import {SelectLayerMobile} from './components/SelectLayer/SelectLayerMobile.jsx';

import { initUpdateAccessControlList, forceUpdateAccessControlList } from './poll-api/pollMetadataAccessControlList.js';
import { initUpdateZones, forceUpdateZones } from './poll-api/pollMetadataZones.js';
import { initUpdateParkingData, forceUpdateParkingData } from './poll-api/pollParkingData.js';
import {
  // initUpdateTripData,
  // forceUpdateTripData
} from './poll-api/pollTripData.js';
import {
  initUpdateZonesgeodata,
  forceUpdateZonesgeodata
} from './poll-api/pollMetadataZonesgeodata.js';
import {
  initUpdateVerhuringenData,
  forceUpdateVerhuringenData
} from './poll-api/pollVerhuringenData.js';

import {
    DISPLAYMODE_PARK,
    DISPLAYMODE_RENTALS,
    DISPLAYMODE_OTHER,
  } from './reducers/layers.js';

import './App.css';

function App() {
  const [pathName, setPathName] = useState(document.location.pathname);
  
  const dispatch = useDispatch()
  
  const mapContainer = useRef(null);

  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
  }, [location]);
  
  useEffect(() => {
    let payload;
    if(pathName.includes("/map/park")||pathName==='/') {
      payload=DISPLAYMODE_PARK;
    } else if(pathName.includes("/map/rentals")) {
      payload=DISPLAYMODE_RENTALS;
    } else {
      payload=DISPLAYMODE_OTHER;
    }
    dispatch({type: 'LAYER_SET_DISPLAYMODE',payload });

  }, [pathName, dispatch]);

  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  const filterDate = useSelector(state => {
    return state.filter ? state.filter.datum : false;
  });

  const isLayersMobileVisible = useSelector(state => {
    return state.ui ? state.ui['MenuSecondary.layers'] : false;
  });

  const isFilterBarVisible = useSelector(state => {
    return state.ui ? state.ui['FILTERBAR'] : false;
  });

  const filter = useSelector(state => {
    return state.filter;
  });
  
  const displayMode = useSelector(state => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });
  
  const metadata = useSelector(state => {
    return state.metadata;
  });

  const setFilterDatum = newdt => {
    dispatch({
      type: 'SET_FILTER_DATUM',
      payload: newdt.toISOString()
    })
  }

  // Set date to current date/time on load
  useEffect(() => {
    if(moment(filterDate).diff(moment(), 'minutes') < -10) {
      setFilterDatum(moment().toDate())
    }
  }, [filterDate, setFilterDatum]);

  /*
  To load data using the API we use the scripts in the poll-api folder.
  We need zones to be able to fetch parking & trips data.

  First, on app load, we load user information.
  Then, we load the zones.
  As soon as the zones are loaded, we load the parking data and rentals data.
  We reload the parking data and rentals data if the filters or the URL change.
  */

  // On app start: get user data
  useEffect(() => {
    initUpdateAccessControlList(store);
  }, []);

  // If path changes: clear zones
  useEffect(() => {
    store.dispatch({ type: 'CLEAR_ZONES', payload: null});
    initUpdateZones(store);
    initUpdateZonesgeodata(store);
  }, [filter.gebied, pathName]);

  // On app start or if user data is loaded or if place is updated: get zones data
  useEffect(() => {
    initUpdateZones(store);
    initUpdateZonesgeodata(store);
  }, [isLoggedIn, filter.gebied, pathName]);

  // On app start, if zones are loaded or pathName/filter is changed: reload data
  useEffect(() => {
    initUpdateParkingData(store);
    initUpdateVerhuringenData(store);
    forceUpdateAccessControlList();
    initUpdateZonesgeodata(store);
  }, [isLoggedIn, metadata.zones_loaded, pathName, filter]);

  // Mobile menu: Filters / Layers
  const renderMobileMenus = () => {
    return <div>
      <div className="hidden sm:block h-full">
        <FilterbarDesktop isVisible={isLoggedIn && isFilterBarVisible} displayMode={displayMode} />
      </div>
      <div className="block sm:hidden">
        <FilterbarMobile isVisible={isLoggedIn && isFilterBarVisible} displayMode={displayMode} />
      </div>
      <SelectLayerMobile />
    </div>
  }

  const renderMapElements = () => {
    return <>
      <div ref={mapContainer} className="map-layer"></div>
      <MenuSecondary />
      {renderMobileMenus()}
    </>
  }

  return (
    <div className={`app ${(isFilterBarVisible || isLayersMobileVisible) ? 'overflow-y-hidden' : ''}`}>
      <div className="gui-layer">
        <Switch>
          <Route exact path="/">
            <MapPage mapContainer={mapContainer} />
            {renderMapElements()}
          </Route>
          <Route exact path="/login">
            <Login />
          </Route>
          <Route exact path="/map/park">
            <MapPage mapContainer={mapContainer} />
            {renderMapElements()}
          </Route>
          <Route exact path="/map/rentals">
            <MapPage mapContainer={mapContainer} />
            {renderMapElements()}
          </Route>
          <Route exact path="/stats/overview">
            <ContentPage>
              <StatsPage />
            </ContentPage>
            {renderMobileMenus()}
          </Route>
          <Route exact path="/monitoring">
            <Monitoring />
          </Route>
          <Route exact path="/over">
            <ContentPage>
              <About />
            </ContentPage>
          </Route>
        </Switch>

        <Menu pathName={pathName} />

       </div>
     </div>
  );
}

export default App;
