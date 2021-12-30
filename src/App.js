import { useEffect, useRef } from 'react';
import {
 BrowserRouter as Router,
 Switch,
 Route,
 Redirect
} from "react-router-dom";
import { store } from './AppProvider.js';

import Menu from './components/Menu.jsx';
import MenuSecondary from './components/Menu/MenuSecondary.jsx';
import MapPage from './pages/MapPage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import Login from './pages/Login.jsx';
import Monitoring from './pages/Monitoring.jsx';
import FilterbarDesktop from './components/Filterbar/FilterbarDesktop.jsx';
import FilterbarMobile from './components/Filterbar/FilterbarMobile.jsx';
import {SelectLayerMobile} from './components/SelectLayer/SelectLayerMobile.jsx';

import { useSelector } from 'react-redux';

import { initUpdateAccessControlList, forceUpdateAccessControlList } from './poll-api/pollMetadataAccessControlList.js';
import { initUpdateZones, forceUpdateZones } from './poll-api/pollMetadataZones.js';
import { initUpdateParkingData, forceUpdateParkingData } from './poll-api/pollParkingData.js';
import { initUpdateTripData, forceUpdateTripData } from './poll-api/pollTripData.js';
import { initUpdateZonesgeodata, forceUpdateZonesgeodata } from './poll-api/pollMetadataZonesgeodata.js';
import { initUpdateVerhuringenData, forceUpdateVerhuringenData } from './poll-api/pollVerhuringenData.js';

import './App.css';

function App() {
  const mapContainer = useRef(null);

  // let [json, setJson] = useState(false);
  // let [timestamp, setTimestamp] = useState(false);
  const isLoggedIn = useSelector(state => {
    return state.authentication.user_data ? true : false;
  });
  
  const showfilter = useSelector(state => {
    return state.filter ? state.filter.visible : false;
  });

  const isFilterBarVisible = useSelector(state => {
    return state.ui ? state.ui['FILTERBAR'] : false;
  });

  const filter = useSelector(state => {
    return state.filter;
  });

  // Init polling scripts
  useEffect(() => {
    initUpdateZones(store);
    initUpdateZonesgeodata(store);
    initUpdateAccessControlList(store);
    initUpdateParkingData(store);
    initUpdateTripData(store);
    initUpdateVerhuringenData(store);
    forceUpdateZones();
    forceUpdateZonesgeodata();
    forceUpdateAccessControlList();
  });

  // update scripts
  useEffect(() => {
    forceUpdateTripData();
    forceUpdateParkingData();
    forceUpdateVerhuringenData();
  }, [filter]);

  // Mobile menu: Filters / Layers
  const renderMobileMenus = () => {
    return <>
      <div className="hidden sm:block h-full">
        <FilterbarDesktop isVisible={isLoggedIn && isFilterBarVisible} showinterval={false} />
      </div>
      <div className="block sm:hidden">
        <FilterbarMobile isVisible={isLoggedIn && isFilterBarVisible} showinterval={false} />
      </div>
      <SelectLayerMobile />
    </>
  }

  const renderMapElements = () => {
    return <>
      <div ref={mapContainer} className="map-layer"></div>
      <MenuSecondary />
      {renderMobileMenus()}
    </>
  }

  return (
    <Router>

      {/*<Redirect exact from="/" to="/map/park" />*/}

      <div className="app">
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
          </Switch>

          <Menu />

         </div>
       </div>

     </Router>
  );
}

export default App;
