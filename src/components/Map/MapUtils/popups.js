import JSConfetti from 'js-confetti'
import moment from 'moment';
import maplibregl from 'maplibre-gl';
import localization from 'moment/locale/nl'

import {getProviderColor} from '../../../helpers/providers.js';

// Set language for momentJS
moment.locale('nl', localization);

const providerWebsiteUrls = {
  'baqme': 'https://www.baqme.com/',
  'cykl': 'https://www.cykl.nl/',
  'check': 'https://ridecheck.app/',
  'cargoroo': 'https://cargoroo.nl/',
  'deelfietsnederland': 'https://deelfietsnederland.nl/',
  'donkey': 'https://www.donkey.bike/',
  'felyx': 'https://felyx.com/',
  'flickbike': 'https://www.flickbike.nl/',
  'gosharing': 'https://go-sharing.com/',
  'hely': 'https://hely.com/',
  'htm': 'https://www.htm.nl/ons-vervoer/htm-fiets',
  'keobike': 'https://keobike.nl/',
  'lime': 'https://www.li.me/',
  'tier': 'https://www.tier.app/',
  'uwdeelfiets': 'https://www.uwdeelfiets.nl/',
}

const jsConfetti = new JSConfetti()
window.showConfetti = () => {
  jsConfetti.addConfetti()
  jsConfetti.addConfetti({
    emojis: ['🚲', '🚲', '🚴‍♀️', '🛵', '🛴', '🚗', '🚙', '✨', '✨'],
    emojiSize: 30,
    confettiNumber: 100,
  })
}

export const initPopupLogic = (theMap, providers, isLoggedIn, filterDate) => {
  // Docs: https://maplibre.org/maplibre-gl-js-docs/example/popup-on-click/
  const layerNamesToApplyPopupLogicTo = [
    'vehicles-point',
    'vehicles-clusters-point',
    'rentals-origins-point',
    'rentals-origins-clusters-point',
    'rentals-destinations-point',
    'rentals-destinations-clusters-point',
  ];

  layerNamesToApplyPopupLogicTo.forEach((layerName) => {
    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.
    function clickHandler (e) {
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

      console.log(filterDate);

      new maplibregl.Popup()
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
              ${vehicleProperties.system_id}
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

            ${providerWebsiteUrls && providerWebsiteUrls[vehicleProperties.system_id] ? `<div class="mt-2">
              <a href="${providerWebsiteUrls[vehicleProperties.system_id]}" rel="external" target="_blank" class="inline-block py-1 px-2 text-white rounded-md hover:opacity-80" style="background-color: ${providerColor};">
                website
              </a>
            </div>` : ''}
          </div>
        `)
        .addTo(theMap);
    }
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
  })
   
}
