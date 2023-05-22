import { useEffect, useRef, useState } from 'react';
import {
 BrowserRouter,
 Routes,
 Route,
 useLocation,
} from "react-router-dom";
import moment from 'moment';
import { store } from './AppProvider.js';
import { useSelector, useDispatch } from 'react-redux';
import {AnimatePresence, motion} from 'framer-motion'
import * as te from 'tw-elements';

import {StateType} from './types/StateType';

import Menu from './components/Menu.jsx';
import MenuSecondary from './components/Menu/MenuSecondary.jsx';
import MapPage from './pages/MapPage.jsx';
import ContentPage from './pages/ContentPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import Login from './pages/Login.jsx';
import SetPassword from './pages/SetPassword.jsx';
import Monitoring from './pages/Monitoring.jsx';
import FilterbarDesktop from './components/Filterbar/FilterbarDesktop.jsx';
import FilterbarMobile from './components/Filterbar/FilterbarMobile.jsx';
import About from './components/About/About.jsx';
import Tour from './components/Tour/Tour.jsx';
import Overlay from './components/Overlay/Overlay.jsx';
import Misc from './components/Misc/Misc.jsx';
import Faq from './components/Faq/Faq';
import Profile from './components/Profile/Profile';
import Export from './components/Export/Export';
import Admin from './components/Admin/Admin';
import {SelectLayerMobile} from './components/SelectLayer/SelectLayerMobile.jsx';
import LoadingIndicator from './components/LoadingIndicator/LoadingIndicator.jsx';
import LoginStats from './components/LoginStats/LoginStats';
import UserList from './components/UserList/UserList';
import EditUser from './components/EditUser/EditUser';

import { initAccessControlList } from './poll-api/metadataAccessControlList.js';
import { updateZones } from './poll-api/metadataZones.js';
import { updateZonesgeodata } from './poll-api/metadataZonesgeodata.js';

import { initUpdateParkingData } from './poll-api/pollParkingData.js';
import {
  initUpdateVerhuringenData
} from './poll-api/pollVerhuringenData.js';

import {
  showNotification,
} from './helpers/notify';

import {
  DISPLAYMODE_PARK,
  DISPLAYMODE_RENTALS,
  DISPLAYMODE_ZONES_PUBLIC,
  DISPLAYMODE_ZONES_ADMIN,
  DISPLAYMODE_OTHER,
} from './reducers/layers.js';

import './App.css';

const Notification = ({ doShowNotification, setDoShowNotification, isFilterBarOpen }) => {
  return <AnimatePresence>
    {doShowNotification && <motion.div
      key="notification"
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-5 z-20 left-5 right-5"
    >
      <motion.div
        drag
        dragConstraints={{
          top: -10,
          left: -50,
          right: 50,
          bottom: 10,
        }}
        className="relative bg-white/60 backdrop-blur-xl w-max-w-md rounded-lg mx-auto p-6 shadow hover:opacity-75" style={{
          width: window.innerWidth > 640 ? '322px' : '100%',
          left: (isFilterBarOpen && window.innerWidth > 640) ? '162px' : 0,
          cursor: 'pointer'
        }}
        onClick={() => setDoShowNotification(false)}
      >
        <h1 className="text-lg text-slate-700 font-medium text-center">
          {doShowNotification}
        </h1>
        <div className="flex justify-between items-center">
          <a href="#" className="hidden text-slate-500 hover:text-slate-700 text-sm inline-flex space-x-1 items-center">
            <span>Go to Dashboard</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
          </a>
        </div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>
}

function App() {
  // Our state variables
  const [pathName, setPathName] = useState(document.location.pathname);
  const [uriParams, setUriParams] = useState(document.location.search);
  const [delayTimeout, setDelayTimeout] = useState(null);
  const [doShowNotification, setDoShowNotification] = useState('');
  
  const dispatch = useDispatch()
  
  const mapContainer = useRef(null);

  let DELAY_TIMEOUT_IN_MS = 250;

  const exportState = useSelector((state: StateType) => {
    return { filter: state.filter, layers: state.layers, ui:state.ui };
  });
  const isFilterBarOpen = exportState && exportState.ui && exportState.ui.FILTERBAR;

  // Store window location in a local variable
  let location = useLocation();
  useEffect(() => {
    setPathName(location ? location.pathname : null);
    setUriParams(location ? location.search : null);
  }, [location]);
  
  // Init notify bar logic
  useEffect(() => {
    window.notify = (msg) => {
      showNotification(msg, setDoShowNotification);
    }
  }, [])

  useEffect(() => {
    if(uriParams!==null) {
      let params = new URLSearchParams(uriParams);
      let view = params.get('view')
      if(view) {
        try {
          const importstate = JSON.parse(decodeURIComponent(view));
          // force update to map extent
          dispatch({type: 'IMPORT_STATE', payload: importstate });
          
          setTimeout(() => dispatch({type: 'LAYER_SET_ZONES_EXTENT', payload: importstate.layers.mapextent}), 2500);
          return;
        } catch(ex) {
          console.warn("unable to decode application state")
          alert("Ongeldige link ingegeven");
        }
        // continue
      }
    }
    
    // Decide on which display mode we use, based on URL
    let payload;
    if(pathName.includes("/map/park")||pathName==='/') {
      payload=DISPLAYMODE_PARK;
    } else if(pathName.includes("/map/rentals")) {
      payload=DISPLAYMODE_RENTALS;
    } else if(pathName.includes("/map/zones")) {
      payload=DISPLAYMODE_ZONES_PUBLIC;
    } else if(pathName.includes("/admin/zones")) {
      payload=DISPLAYMODE_ZONES_ADMIN;
    } else {
      payload=DISPLAYMODE_OTHER;
    }
    dispatch({type: 'LAYER_SET_DISPLAYMODE', payload});

  }, [pathName, uriParams]);

  const isLoggedIn = useSelector((state: StateType) => {
    return state.authentication.user_data ? true : false;
  });
  
  const isAdmin = useSelector((state: StateType) => {
    if(! state.authentication) return false;
    if(! state.authentication.user_data) return false;
    let userIsAdmin = false;
    state.authentication.user_data.user.registrations.forEach(x => {
      if(x.roles.indexOf('administer') > -1) userIsAdmin = true;
      if(x.roles.indexOf('admin') > -1) userIsAdmin = true;
    });
    return userIsAdmin;
  });
  
  const filterDate = useSelector((state: StateType) => {
    return state.filter ? state.filter.datum : false;
  });

  const isLayersMobileVisible = useSelector((state: StateType) => {
    return state.ui ? state.ui['MenuSecondary.layers'] : false;
  });

  const isFilterBarVisible = useSelector((state: StateType) => {
    return state.ui ? state.ui['FILTERBAR'] : false;
  });

  const filter = useSelector((state: StateType) => {
    return state.filter;
  });
  
  const layers = useSelector((state: StateType) => {
    return state.layers;
  });

  const displayMode = useSelector((state: StateType) => {
    return state.layers ? state.layers.displaymode : DISPLAYMODE_PARK;
  });
  
  const metadata = useSelector((state: StateType) => {
    return state.metadata;
  });

  // Set date to current date/time on load
  useEffect(() => {
    const setFilterDatum = newdt => {
      dispatch({
        type: 'SET_FILTER_DATUM',
        payload: newdt.toISOString()
      })
    }

    // On load, set datetime to NOW
    // - Don't do this if datetime < 10 ago
    // - Don't do this if this is a shared link (we'll then keep the shared datetime)
    const params = new URLSearchParams(uriParams);
    const isFilterDateMoreThan10MinutesAgo = moment(filterDate).diff(moment(), 'minutes') < -10;
    const isSharedLink = params.get('view');// Check if this is a shared link
    if(! isSharedLink && isFilterDateMoreThan10MinutesAgo) {
      setTimeout(x => {
        setFilterDatum(moment().toDate())
      }, 500)
    }
  }, []);

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
    initAccessControlList(store);
  }, [isLoggedIn]);
  
  useEffect(() => {
    if(process && process.env.DEBUG) console.log('useEffect zones', filter.gebied)
    if(! metadata.metadata_loaded) return;

    updateZones(store);
  }, [
    isLoggedIn,
    metadata.metadata_loaded,
    filter.gebied
  ])

  useEffect(() => {
    if(process && process.env.DEBUG) console.log('useEffect zones geodata')
    if(! metadata.zones_loaded) return;

    updateZonesgeodata(store);
  }, [
    isLoggedIn,
    metadata.zones_loaded,
    filter.gebied,
    filter.zones
  ])

  // On app start,
  //  if zones are loaded
  //  or if pathName/filter is changed:
  //  reload park events data
  useEffect(() => {
    if(displayMode !== 'displaymode-park') return;
    if(isLoggedIn && metadata.zones_loaded === false) return;

    if(delayTimeout) clearTimeout(delayTimeout);

    setDelayTimeout(setTimeout(x => {
      initUpdateParkingData(store);
    }, DELAY_TIMEOUT_IN_MS))
  }, [
    isLoggedIn,
    metadata.zones_loaded,
    filter
    // DELAY_TIMEOUT_IN_MS,
    // delayTimeout,
    // displayMode
  ]);

  // Reload rentals data if i.e. filter changes
  useEffect(() => {
    if(displayMode !== 'displaymode-rentals') return;
    if(isLoggedIn && metadata.zones_loaded === false) return;

    if(delayTimeout) clearTimeout(delayTimeout);

    setDelayTimeout(setTimeout(x => {
      initUpdateVerhuringenData(store);
    }, DELAY_TIMEOUT_IN_MS))
  }, [
    isLoggedIn,// If we change from guest to logged in we want to update rentals
    metadata.zones_loaded,// We only do an API call if zones are loaded
    filter,
    // DELAY_TIMEOUT_IN_MS,
    // delayTimeout,
    // displayMode
  ]);

  // Mobile menu: Filters / Layers
  const renderMobileMenus = () => {
    return <div className="MobileMenus">
      <div className="hidden sm:block relative h-full z-10">
        <FilterbarDesktop isVisible={isFilterBarVisible} displayMode={displayMode} />
      </div>
      <div className="block sm:hidden relative z-10">
        <FilterbarMobile isVisible={isFilterBarVisible} displayMode={displayMode} />
      </div>
      <SelectLayerMobile />
    </div>
  }

  const renderMapElements = () => {
    return <>
      <MenuSecondary />
      {renderMobileMenus()}
    </>
  }

  return (
    <div className={`app ${(isFilterBarVisible || isLayersMobileVisible) ? 'overflow-y-hidden' : ''}`}>

      <Notification doShowNotification={doShowNotification} setDoShowNotification={setDoShowNotification} isFilterBarOpen={isFilterBarOpen} />

      <LoadingIndicator  />

      <div className="gui-layer">

      <Routes>
        { isLoggedIn ?
          <>
            { isAdmin ?
              <>
                <Route exact path="/admin" element={
                  <Overlay>
                    <Admin>
                      <UserList />
                    </Admin>
                  </Overlay>
                } />
                <Route exact path="/admin/users" element={
                  <Overlay>
                    <Admin>
                      <UserList />
                    </Admin>
                  </Overlay>
                } />
                <Route exact path="/admin/users/new" element={
                  <Overlay>
                    <Admin>
                      <UserList showAddUserModule={true} />
                    </Admin>
                  </Overlay>
                } />
                <Route exact path="/admin/users/:username" element={
                  <Overlay>
                    <Admin>
                      <UserList />
                    </Admin>
                  </Overlay>
                } />
                <Route exact path="/admin/stats" element={
                  <Overlay>
                    <Admin>
                      <LoginStats />
                    </Admin>
                  </Overlay>
                } />
              </> : null
            }
            <Route exact path="/" element={renderMapElements()} />
            <Route exact path="/map/park" element={renderMapElements()} />
            <Route exact path="/map/rentals" element={renderMapElements()} />
            <Route path="/map/zones" element={renderMapElements()} />
            <Route path="/admin/zones" element={renderMapElements()} />
            <Route exact path="/stats/overview" element={<>
              <ContentPage>
                <StatsPage />
              </ContentPage>
              {renderMapElements()}
            </>} />
            <Route exact path="/monitoring" element={
              <ContentPage>
                <Monitoring />
              </ContentPage>
            } />
            <Route exact path="/over" element={
              <Overlay>
                <About />
              </Overlay>
            } />
            <Route exact path="/rondleiding" element={
              <ContentPage forceFullWidth={true}>
                <Tour />
              </ContentPage>
            } />
            <Route exact path="/misc" element={
              <Overlay>
                <Misc />
              </Overlay>
            } />
            <Route exact path="/profile" element={
              <Overlay>
                <Misc>
                  <Profile />
                </Misc>
              </Overlay>
            } />
            <Route exact path="/export" element={
              <Overlay>
                <Misc>
                  <Export />
                </Misc>
              </Overlay>
            } />
            <Route exact path="/faq" element={
              <Overlay>
                <Misc>
                  <Faq />
                </Misc>
              </Overlay>
            } />
          </>
          :
          null
        }

        { ! isLoggedIn ? <>
          <Route exact path="/" element={renderMapElements()} />
          <Route exact path="/map/park" element={renderMapElements()} />
          <Route exact path="/map/rentals" element={renderMapElements()} />
          <Route path="/map/zones" element={renderMapElements()} />
          <Route exact path="/misc" element={
            <Overlay>
              <Misc />
            </Overlay>
          } />
          <Route exact path="/profile" element={
            <Overlay>
              <Misc>
                <Profile />
              </Misc>
            </Overlay>
          } />
          <Route exact path="/faq" element={
            <Overlay>
              <Misc>
                <Faq />
              </Misc>
            </Overlay>
          } />
        </> : '' }

        <Route exact path="/over" element={
          <Overlay>
            <About />
          </Overlay>
        } />
        <Route exact path="/rondleiding" element={
          <ContentPage forceFullWidth={true}>
            <Tour />
          </ContentPage>
        } />
        <Route exact path="/login" element={
          <Overlay>
            <Login />
          </Overlay>
        } />
        <Route exact path="/reset-password/:changePasswordCode" element={
          <Overlay>
            <SetPassword />
          </Overlay>
        } />
        <Route element={renderMapElements()} />
      </Routes>

      <div key="mapContainer" ref={mapContainer} className="map-layer top-0"></div>
      <MapPage mapContainer={mapContainer} />
      <Menu pathName={pathName} />

     </div>
    </div>
  );
}

export default App;
