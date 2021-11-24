import './Topbar.css';
import getVehicleMarkers from './../Map/vehicle_marker.js';
import { useEffect } from 'react';



function Topbar() {
  useEffect(() => {
    var test = async() => {
      var value = await getVehicleMarkers("#000000");
      console.log(value);
    };
    test(); 
  }, [])

  // console.log("show interval %s", showinterval)
  return (
    <div className="topbar">
      <div className="topbar-logo" />
      test
      <a href="#this">menu</a>
    </div>
    )
}



export default Topbar;
