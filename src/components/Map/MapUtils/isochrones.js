export const addIsochronesToMap = (theMap, featureCollection) => {

  if(! theMap) return;
  if(! featureCollection) return;

  // Check if the source exists
  if(! theMap.getSource('zones-isochrones')) return;

  // Set geoJson data
  theMap.U.setData('zones-isochrones', featureCollection);

  // Show layer
  theMap.U.show('zones-isochrones')

}
