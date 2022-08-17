import { useRef, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import maplibregl from 'maplibre-gl';
import {
  getIsochronesForFootWalking
} from '../../api/isochrones';

const addIsochronesToMap = (theMap, featureCollection) => {

  if(! theMap) return;
  if(! featureCollection) return;

  // Check if the source exists
  if(! theMap.getSource('zones-isochrones')) return;

  // Set geoJson data
  theMap.U.setData('zones-isochrones', featureCollection);

  // Show layer
  theMap.U.show('zones-isochrones')

}

const addIsochronesForMarkers = async (theMap, locations) => {
  // Get foot walking isochrones
  const result = await getIsochronesForFootWalking(locations);
  addIsochronesToMap(theMap, result)
  return;
}

const IsochroneTools = () => {

  const [isochroneMarkers, setIsochroneMarkers] = useState([]);

  // Add isochrone marker
  const addIsochroneMarker = (theMap) => {
    if(! theMap) return;

    // Get center of map
    const {lng, lat} = theMap.getCenter();
    var marker = new maplibregl.Marker({
      draggable: true
    })
    .setLngLat([lng, lat])
    .addTo(theMap);

    // Add isochrones around the new marker
    (() => {
      let locations = [];
      // Get all existing marker
      isochroneMarkers.forEach(x => {
        const lngLat = x.getLngLat();
        locations.push([lngLat.lng, lngLat.lat]);
      });
      // Add last added marker
      locations.push([lng, lat]);
      // Add isochrones
      addIsochronesForMarkers(theMap, locations)
    })();

    // On drag end: calculate isochrones and add these to the map
    const onDragEnd = async () => {
      let locations = [];
      // Get every marker
      isochroneMarkers.forEach(x => {
        const lngLat = x.getLngLat();
        locations.push([lngLat.lng, lngLat.lat]);
      });
      await addIsochronesForMarkers(theMap, locations)
    }
    marker.on('dragend', onDragEnd);

    // Add isochrone marker to local state
    isochroneMarkers.push(marker);
    setIsochroneMarkers(isochroneMarkers);
  }


  // Remove isochrone marker
  const removeIsochroneMarker = (theMap) => {
    if(! isochroneMarkers) return;

    // Remove it
    isochroneMarkers.forEach(x => {
      x.remove();
    });

    // Update state
    setIsochroneMarkers([]);

    // Hide isochrones layer
    theMap.U.hide('zones-isochrones')
  }


  const isLoggedIn = useSelector(state => state.authentication.user_data ? true : false);

  return (
    <>

      <div className="fixed bg-white p-1" style={{
        bottom: '177px',
        right: '10px',
        borderRadius: '4px',
        minWidth: '29px',
        textAlign: 'center',
        boxShadow: '0 0 0 2px rgb(0 0 0 / 10%)'
      }}>
        {(! isochroneMarkers || isochroneMarkers.length <= 0) && <div 
          className="cursor-pointer"
          onClick={() => {
            addIsochroneMarker(window.ddMap)
          }}
          title="Voeg punt voor isochronenweergave toe"
        >
          ⚓
        </div>}

        {(isochroneMarkers && isochroneMarkers.length > 0) && <>
          <div 
            className="cursor-pointer mb-2"
            onClick={() => {addIsochroneMarker(window.ddMap)}}
            title="Voeg nieuw punt toe"
          >
            ➕
          </div>
          <div 
            className="cursor-pointer"
            onClick={() => {removeIsochroneMarker(window.ddMap)}}
            title="Stop isochronenweergave"
          >
            ❎
          </div>
        </>}

      </div>
    </>
  )
}

export default IsochroneTools;
