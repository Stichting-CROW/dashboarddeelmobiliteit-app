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
  buildProviderLabelHtml
} from '../../PrestatiesAanbieders/ProviderLabel';

import {
  getPrettyVehicleTypeName
} from '../../../helpers/vehicleTypes';

import {
  getVehicleTypeHeaderImgHtml
} from '../../../helpers/vehicleTypeIconCommon';

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

export const initPopupLogic = (
  theMap,
  providers,
  canSeeVehicleId,
  filterDate,
  hidePopupProviderTitle = false
) => {
  const providerLabelOptions = hidePopupProviderTitle ? { showTitle: false } : undefined;
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

      // Safety: MapLibre should always provide at least one feature, but avoid hard crashes.
      const features = e.features || [];
      if(! features.length) return;

      const primaryVehicleProperties = features[0].properties || {};
      const vehicleProperties = primaryVehicleProperties;
      const providerColor = getProviderColor(providers, vehicleProperties.system_id)

      var coordinates = features[0].geometry.coordinates.slice();
      // var description = e.features[0].properties.description;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const providerWebsiteUrl = getProviderWebsiteUrl(vehicleProperties.system_id);
      const prettyVehicleTypeName = getPrettyVehicleTypeName(vehicleProperties.form_factor);
      const headerLabel = `${getPrettyProviderName(vehicleProperties.system_id)} ${prettyVehicleTypeName ? prettyVehicleTypeName : ''}`;

      const escapeHtml = (value) => {
        const str = String(value ?? '');
        return str.replace(/[&<>"']/g, (c) => {
          switch (c) {
            case '&':
              return '&amp;';
            case '<':
              return '&lt;';
            case '>':
              return '&gt;';
            case '"':
              return '&quot;';
            case '\'':
              return '&#039;';
            default:
              return c;
          }
        });
      };

      const formatSinceDateTime = (props) => {
        if(! props || ! props.in_public_space_since) return '-';
        return moment(props.in_public_space_since).locale('nl').format('DD/MM HH:mm');
      };

      const buildVehicleBodyHtml = (theVehicleProperties, theProviderColor) => {
        const providerWebsiteUrl = getProviderWebsiteUrl(theVehicleProperties.system_id);

        return `
          <div class="Map-popup-body">
            ${theVehicleProperties.in_public_space_since ? `<div>
              Staat hier sinds ${moment(theVehicleProperties.in_public_space_since).locale('nl').from(filterDate)}<br />
              Geparkeerd sinds: ${moment(theVehicleProperties.in_public_space_since).format('DD-MM-YYYY HH:mm')}
            </div>` : ''}

            ${theVehicleProperties.distance_in_meters ? `<div>
              Dit voertuig is ${theVehicleProperties.distance_in_meters} meter verplaatst<br />
            </div>` : ''}

            ${(canSeeVehicleId && theVehicleProperties.vehicle_id) ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
              ${theVehicleProperties.vehicle_id}
            </div>` : ''}

            ${providerWebsiteUrl ? `<div class="mt-2">
              <a href="${providerWebsiteUrl}" rel="external" target="_blank" class="inline-block py-1 px-2 text-white rounded-md hover:opacity-80" style="background-color: ${theProviderColor};">
                website
              </a>
            </div>` : ''}
          </div>
        `;
      };

      const buildOverlappingVehiclesTableHtml = () => {
        const shouldShowVehicleId = canSeeVehicleId ? true : false;
        const rowsHtml = features.map((feature, idx) => {
          const props = feature.properties || {};
          const vehicleId = shouldShowVehicleId && props.vehicle_id ? props.vehicle_id : '-';
          const vehicleTypeIconHtml = getVehicleTypeHeaderImgHtml(
            props.form_factor,
            undefined,
            'height:18px; width:auto; margin-right: 6px;'
          );
          const sinceDateTime = formatSinceDateTime(props);

          return `
            <tr
              data-dd-vehicle-row="true"
              data-feature-index="${idx}"
              class="dd-vehicle-overlap-row"
              style="cursor: pointer;"
            >
              <td style="padding: 4px">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="white-space: nowrap;">${escapeHtml(vehicleId)}</span>
                  ${vehicleTypeIconHtml}
                </div>
              </td>
              <td style="padding: 4px;">${escapeHtml(sinceDateTime)}</td>
            </tr>
          `;
        }).join('');

        return `
          <div class="Map-popup-body">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; font-weight: 600; padding: 0 4px 6px 4px; font-size: 12px;">voertuig-id</th>
                  <th style="text-align: left; font-weight: 600; padding: 0 4px 6px 4px; font-size: 12px;">sinds</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      };

      const isVehicleMarkerLayer = (
        layerName === 'vehicles-point' || layerName === 'vehicles-clusters-point'
      );

      const primaryFeatureIsVehicle = (
        vehicleProperties && vehicleProperties.vehicle_id
      );

      const shouldShowOverlappingVehiclesTable = (
        isVehicleMarkerLayer && primaryFeatureIsVehicle && features.length > 1
      );

      popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          ${buildProviderLabelHtml(headerLabel, providerColor, providerLabelOptions)}
          ${
            shouldShowOverlappingVehiclesTable
              ? buildOverlappingVehiclesTableHtml()
              : buildVehicleBodyHtml(vehicleProperties, providerColor)
          }
        `)
        .addTo(theMap);

      if(shouldShowOverlappingVehiclesTable) {
        const popupEl = popup && popup.getElement && popup.getElement();
        if(popupEl) {
          popupEl.addEventListener('click', (evt) => {
            const tr = evt.target && evt.target.closest
              ? evt.target.closest('tr[data-dd-vehicle-row="true"]')
              : null;

            if(! tr) return;

            const idxStr = tr.getAttribute('data-feature-index');
            const idx = parseInt(idxStr, 10);
            const clickedFeature = features[idx];
            if(! clickedFeature) return;

            evt.preventDefault();
            evt.stopPropagation();

            const clickedVehicleProperties = clickedFeature.properties || {};
            const clickedProviderColor = getProviderColor(
              providers,
              clickedVehicleProperties.system_id
            );

            const clickedPrettyVehicleTypeName = getPrettyVehicleTypeName(
              clickedVehicleProperties.form_factor
            );
            const clickedHeaderLabel = `${getPrettyProviderName(clickedVehicleProperties.system_id)} ${clickedPrettyVehicleTypeName ? clickedPrettyVehicleTypeName : ''}`;

            var clickedCoordinates = clickedFeature.geometry.coordinates.slice();
            while (Math.abs(e.lngLat.lng - clickedCoordinates[0]) > 180) {
              clickedCoordinates[0] += e.lngLat.lng > clickedCoordinates[0] ? 360 : -360;
            }

            popup
              .setLngLat(clickedCoordinates)
              .setHTML(`
                ${buildProviderLabelHtml(clickedHeaderLabel, clickedProviderColor, providerLabelOptions)}
                ${buildVehicleBodyHtml(clickedVehicleProperties, clickedProviderColor)}
              `);
          })
        }
      }
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
