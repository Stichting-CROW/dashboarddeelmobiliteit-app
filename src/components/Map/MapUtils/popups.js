import JSConfetti from 'js-confetti'
import moment from 'moment';
import maplibregl from 'maplibre-gl';
import localization from 'moment/locale/nl'

import {
  getProviderColor,
  getPrettyProviderName,
  getProviderWebsiteUrl
} from '../../../helpers/providers.js';

import {
  getPrettyVehicleTypeName
} from '../../../helpers/vehicleTypes';

// Set language for momentJS
moment.updateLocale('nl', localization);

const jsConfetti = new JSConfetti()
window.showConfetti = () => {
  jsConfetti.addConfetti()
  jsConfetti.addConfetti({
    emojis: ['🚲', '🚲', '🚴‍♀️', '🛵', '🛴', '🚗', '🚙', '✨', '✨'],
    emojiSize: 30,
    confettiNumber: 100,
  })
}

const removeExistingPopups = () => {
  // Only remove on mobile
  if(window.innerWidth > 640) return;
  // Remove existing popups
  const existingPopups = document.getElementsByClassName("mapboxgl-popup");
  if(existingPopups.length) {
    existingPopups[0].remove();
  }
}

export const initPopupLogic = (theMap, providers, canSeeVehicleId, filterDate) => {
  // Docs: https://maplibre.org/maplibre-gl-js-docs/example/popup-on-click/
  const layerNamesToApplyPopupLogicTo = [
    'vehicles-point',
    'vehicles-clusters-point',
    'rentals-origins-point',
    'rentals-origins-clusters-point',
    'rentals-destinations-point',
    'rentals-destinations-clusters-point',
  ];

  let popup;

  layerNamesToApplyPopupLogicTo.forEach((layerName) => {
    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    function clickHandler (e) {
      // Remove popups
      if(popup) popup.remove();
      // Remove popups in an other way,
      // because on mobile popup doesn't get removed on map click
      // Reason has to do with both maplibre + mapbox gl draw are installed
      removeExistingPopups();

      const vehicleProperties = e.features[0].properties;
      const providerColor = getProviderColor(providers, vehicleProperties.system_id)

      var coordinates = e.features[0].geometry.coordinates.slice();
      // var description = e.features[0].properties.description;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const providerWebsiteUrl = getProviderWebsiteUrl(vehicleProperties.system_id);
      const prettyVehicleTypeName = getPrettyVehicleTypeName(vehicleProperties.form_factor);

      popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <h1 class="mb-2">
            <span
              class="rounded-full inline-block w-4 h-4"
              style="background-color: ${providerColor};position: relative;top: 2px"
              onClick="window.showConfetti()"
              >
            </span>
            <span class="Map-popup-title ml-1" style="color: ${providerColor};">
              ${getPrettyProviderName(vehicleProperties.system_id)} ${prettyVehicleTypeName ? prettyVehicleTypeName : ''}
            </span>
          </h1>
          <div class="Map-popup-body">
            ${vehicleProperties.in_public_space_since ? `<div>
              Staat hier sinds ${moment(vehicleProperties.in_public_space_since).locale('nl').from(filterDate)}<br />
              Geparkeerd sinds: ${moment(vehicleProperties.in_public_space_since).format('DD-MM-YYYY HH:mm')}
            </div>` : ''}

            ${vehicleProperties.distance_in_meters ? `<div>
              Dit voertuig is ${vehicleProperties.distance_in_meters} meter verplaatst<br />
            </div>` : ''}

            ${canSeeVehicleId ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
              ${vehicleProperties.vehicle_id}
            </div>` : ''}

            ${providerWebsiteUrl ? `<div class="mt-2">
              <a href="${providerWebsiteUrl}" rel="external" target="_blank" class="inline-block py-1 px-2 text-white rounded-md hover:opacity-80" style="background-color: ${providerColor};">
                website
              </a>
            </div>` : ''}

          </div>
        `)
        .addTo(theMap);
    }
    // Touch event
    // https://github.com/mapbox/mapbox-gl-draw/issues/1019#issuecomment-850229493=
    theMap.off('touchend', layerName, clickHandler);
    theMap.on('touchend', layerName, clickHandler);
    // Click event
    theMap.off('click', layerName, clickHandler);
    theMap.on('click', layerName, clickHandler);
    // Change the cursor to a pointer when the mouse is over the places layer.
    theMap.on('mouseenter', layerName, function () {
      theMap.getCanvas().style.cursor = 'pointer';
    });
    // Change it back to a pointer when it leaves.
    theMap.on('mouseleave', layerName, function () {
      theMap.getCanvas().style.cursor = '';
    });
    theMap.on('zoomstart', layerName, function() {
      removeExistingPopups()
    })
    theMap.on('movestart', layerName, function() {
      removeExistingPopups()
    })
  })

}
