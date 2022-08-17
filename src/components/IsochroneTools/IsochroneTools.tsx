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

const IsochroneTools = () => {

  // Add isochrone marker
  const addIsochroneMarker = (theMap) => {
    if(! theMap) return;
    if(isochroneMarker) return;

    const addIsochronesForLngLat = async (theMap, lng, lat) => {
      // Get foot walking isochrones
      const result = await getIsochronesForFootWalking([lng, lat]);
      addIsochronesToMap(theMap, result)
      return;
    }

    const onDragEnd = async () => {
      const lngLat = marker.getLngLat();
      await addIsochronesForLngLat(theMap, lngLat.lng, lngLat.lat)
    }

    // Get center of map
    const {lng, lat} = theMap.getCenter();
    var marker = new maplibregl.Marker({
      draggable: true
    })
    .setLngLat([lng, lat])
    .addTo(theMap);

    // Add isochrones around the new marker
    addIsochronesForLngLat(theMap, lng, lat)

    marker.on('dragend', onDragEnd);

    setIsochroneMarker(marker);
  }


  // Remove isochrone marker
  const removeIsochroneMarker = (theMap) => {
    if(! isochroneMarker) return;

    // Remove it
    isochroneMarker.remove();

    // Update state
    setIsochroneMarker(null);

    // Hide isochrones layer
    theMap.U.hide('zones-isochrones')
  }


  const [isochroneMarker, setIsochroneMarker] = useState(false);

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
        {! isochroneMarker && <div 
          className="cursor-pointer"
          onClick={() => {
            addIsochroneMarker(window.ddMap)
          }}
          title="Voeg punt voor isochronenweergave toe"
        >
          ⚓
        </div>}

        {isochroneMarker && <>
          <div 
            className="cursor-pointer mb-2"
            onClick={() => {removeIsochroneMarker(window.ddMap)}}
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
