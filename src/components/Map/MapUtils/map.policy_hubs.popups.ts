import maplibregl from "maplibre-gl";
import PolicyHubsPopup from '../../PolicyHubsPopup/PolicyHubsPopup';

const removeExistingPopups = () => {
  // Only remove on mobile
  if(window.innerWidth > 640) return;
  // Remove existing popups
  const existingPopups = document.getElementsByClassName("mapboxgl-popup");
  if(existingPopups.length) {
    existingPopups[0].remove();
  }
}

const providerColor = '#000';

const createPopupContent = (event, props) => {
  const popupContent = [];

  const labelClasses = `block`;
  const inputClasses = `h-8 my-2 border border-solid px-2`;
  const buttonClasses = `rounded-lg border-solid border-2 px-2 py-2`;

  popupContent['default'] = document.createElement('div');
  popupContent['default'].innerHTML = `
    <h1 class="mb-2">
      <span
        class="rounded-full inline-block w-4 h-4"
        style="background-color: ${providerColor};position: relative;top: 2px"
        onClick="window.showConfetti()"
        >
      </span>
      <span class="Map-popup-title ml-1" style="color: ${providerColor};">
        ${props.name}
        <small>(${props.phase})</small>
      </span>
    </h1>
    <div class="Map-popup-body">
      <div>
        Tekst
      </div>
      ${(event.features && event.features.length > 1) ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
          Let op: er staan hier meerdere hubs over elkaar heen. Je ziet hiervan nu slechts 1 hub. Gebruik de tabelweergave om de verschillende hubs op deze plek te zien.
      </div>` : ''}
    </div>
  `;

  popupContent['stelvast'] = document.createElement('div');
  popupContent['stelvast'].innerHTML =`
    <h1 class="mb-2">
      <span
        class="rounded-full inline-block w-4 h-4"
        style="background-color: ${providerColor};position: relative;top: 2px"
        onClick="window.showConfetti()"
        >
      </span>
      <span class="Map-popup-title ml-1" style="color: ${providerColor};">
        ${props.name}
        <small>(${props.phase})</small>
      </span>
    </h1>
    <div class="Map-popup-body">
      <div class="my-2">
        Stel de publicatie- en startdatum in:
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Publicatiedatum</b> (standaard +7 dagen)</label>
        <input type="date" value="2024-04-09" class="${inputClasses}" />
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Startdatum</b> (standaard +14 dagen)</label>
        <input type="date" value="2024-04-23" class="${inputClasses}" />
      </div>
      <div class="my-4 flex justify-end">
        <button type="submit" class="${buttonClasses}">Stel vast</button>
      </div>
      ${(event.features && event.features.length > 1) ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
          Let op: er staan hier meerdere hubs over elkaar heen. Je ziet hiervan nu slechts 1 hub. Gebruik de tabelweergave om de verschillende hubs op deze plek te zien.
      </div>` : ''}
    </div>
  `;

  popupContent['concept'] = document.createElement('div');
  popupContent['concept'].innerHTML =`
    <h1 class="mb-2">
      <span
        class="rounded-full inline-block w-4 h-4"
        style="background-color: ${providerColor};position: relative;top: 2px"
        onClick="window.showConfetti()"
        >
      </span>
      <span class="Map-popup-title ml-1" style="color: ${providerColor};">
        ${props.name}
        <small>(${props.phase})</small>
      </span>
    </h1>
    <div class="Map-popup-body">
      <div class="my-2">
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Naam</b></label>
        <input type="text" value="${props.name}" placeholder="Hub 28 Binnenstad: Korte Voorhout" class="${inputClasses} w-full" />
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Type zone</b></label>
        <div class=" flex rounded-lg bg-white border-solid border border-gray-400 text-sm ">
          <div class="
            Button-orange
            cursor-pointer
            flex-1
            
            rounded-lg
            text-gray-500
            text-center
            h-10
            flex
            flex-col
            justify-center
          " style="background-color: rgb(253, 134, 46);">
            Parking
          </div>
          <div class="
            cursor-pointer
            flex-1
            
            rounded-lg
            text-gray-500
            text-center
            h-10
            flex
            flex-col
            justify-center
          ">
            No parking
          </div>
        </div>
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Bepaal beschikbaarheid</b></label>
        <div class="flex rounded-lg bg-white border-solid border border-gray-400 text-sm ">
          <div class="
            Button-blue
            cursor-pointer
            flex-1
            rounded-lg
            text-gray-500
            text-center
            border-gray-500
            h-10
            flex
            flex-col
            justify-center
          ">
            Automatisch
          </div>
          <div class="
            cursor-pointer
            flex-1
            rounded-lg
            text-gray-500
            text-center
            border-gray-500
            h-10
            flex
            flex-col
            justify-center
          ">Open</div>
          <div class="
            cursor-pointer
            flex-1
            rounded-lg
            text-gray-500
            text-center
            border-gray-500
            h-10
            flex
            flex-col
            justify-center
          ">Gesloten</div>
        </div>
      </div>
      <div class="my-4">
        <div class="visible"><p class="mb-2 text-sm"><b>Limiet</b> <a class="
                
        cursor-pointer
        ">per modaliteit</a> | <a class="
          underline
          cursor-pointer
        ">totaal</a></p><div class=" rounded-lg bg-white border-solid border border-gray-400 p-4 "><div class=" bg-no-repeat pl-12 h-8 flex w-full " style="background-image: url(&quot;&quot;); background-size: 30px; background-position: left center;"><input name="vehicles-limit.combined" class="flex-1" width="100%" type="range" min="0" max="250" step="1" value="100" style="width: calc(100% - 48px);"><div class="text-xs ml-2 h-8 flex justify-center flex-col">100</div></div></div></div>
      </div>
      <div class="my-4 flex justify-between">
        <button type="submit" class="${buttonClasses}">Stel vast</button>
        <button type="submit" class="${buttonClasses}">Opslaan</button>
      </div>
      ${(event.features && event.features.length > 1) ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
          Let op: er staan hier meerdere hubs over elkaar heen. Je ziet hiervan nu slechts 1 hub. Gebruik de tabelweergave om de verschillende hubs op deze plek te zien.
      </div>` : ''}
    </div>
  `;

  popupContent['committed_concept'] = document.createElement('div');
  popupContent['committed_concept'].innerHTML =`
    <h1 class="mb-2">
      <span
        class="rounded-full inline-block w-4 h-4"
        style="background-color: ${providerColor};position: relative;top: 2px"
        onClick="window.showConfetti()"
        >
      </span>
      <span class="Map-popup-title ml-1" style="color: ${providerColor};">
        ${props.name}
        <small>(vastgesteld concept)</small>
      </span>
    </h1>
    <div class="Map-popup-body">
      <div class="my-2">
        Bewerk de attributen van deze vastgestelde zone:
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Publicatiedatum</b> (standaard +7 dagen)</label>
        <input type="date" value="2024-04-09" class="${inputClasses}" />
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Startdatum</b> (standaard +14 dagen)</label>
        <input type="date" value="2024-04-23" class="${inputClasses}" />
      </div>
      <div class="mt-4 mb-4 text-xs block text-red-500">
        Deze zone wordt automatisch definitief (gepland) op 2024-04-09.
      </div>
      <div class="my-4 flex justify-between">
        <button type="submit" class="${buttonClasses}">Verwijder</button>
        <button type="submit" class="${buttonClasses}">Terugzetten naar concept</button>
      </div>
      ${(event.features && event.features.length > 1) ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
          Let op: er staan hier meerdere hubs over elkaar heen. Je ziet hiervan nu slechts 1 hub. Gebruik de tabelweergave om de verschillende hubs op deze plek te zien.
      </div>` : ''}
    </div>
  `;

  popupContent['published'] = document.createElement('div');
  popupContent['published'].innerHTML =`
    <h1 class="mb-2">
      <span
        class="rounded-full inline-block w-4 h-4"
        style="background-color: ${providerColor};position: relative;top: 2px"
        onClick="window.showConfetti()"
        >
      </span>
      <span class="Map-popup-title ml-1" style="color: ${providerColor};">
        ${props.name}
        <small>(definitief gepland)</small>
      </span>
    </h1>
    <div class="Map-popup-body">
      <div class="my-2">
        Onderstaand de attributen van deze definitief geplande zone:
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Publicatiedatum</b> (standaard +7 dagen)</label>
        <input disabled type="date" value="2024-04-09" class="${inputClasses}" />
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Startdatum</b> (standaard +14 dagen)</label>
        <input disabled type="date" value="2024-04-23" class="${inputClasses}" />
      </div>
      <div class="mt-4 mb-4 text-xs block text-red-500">
        Deze zone wordt automatisch actief op 2024-04-23.
      </div>
      <div class="my-4 flex justify-between flex-wrap">
        <button type="submit" class="${buttonClasses} w-full mb-2">Voorstel tot verwijderen</button>
        <button type="submit" class="${buttonClasses} w-full">Bewerk in nieuw concept</button>
      </div>
      ${(event.features && event.features.length > 1) ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
          Let op: er staan hier meerdere hubs over elkaar heen. Je ziet hiervan nu slechts 1 hub. Gebruik de tabelweergave om de verschillende hubs op deze plek te zien.
      </div>` : ''}
    </div>
  `;

  popupContent['active'] = document.createElement('div');
  popupContent['active'].innerHTML =`
    <h1 class="mb-2">
      <span
        class="rounded-full inline-block w-4 h-4"
        style="background-color: ${providerColor};position: relative;top: 2px"
        onClick="window.showConfetti()"
        >
      </span>
      <span class="Map-popup-title ml-1" style="color: ${providerColor};">
        ${props.name}
        <small>(definitief actief)</small>
      </span>
    </h1>
    <div class="Map-popup-body">
      <div class="my-2">
      Onderstaand de attributen van deze actieve zone:
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Publicatiedatum</b> (standaard +7 dagen)</label>
        <input type="date" value="2024-04-09" class="${inputClasses}" />
      </div>
      <div class="my-4">
        <label class="${labelClasses}"><b>Startdatum</b> (standaard +14 dagen)</label>
        <input disabled type="date" value="2024-04-23" class="${inputClasses}" />
      </div>
      <div class="my-4 flex justify-between flex-wrap">
        <button type="submit" class="${buttonClasses} w-full mb-2">Voorstel tot verwijderen</button>
        <button disabled type="submit" class="${buttonClasses} w-full">Bewerk in nieuw concept</button>
      </div>
      ${(event.features && event.features.length > 1) ? `<div class="mt-4 mb-4 text-xs block text-gray-400">
          Let op: er staan hier meerdere hubs over elkaar heen. Je ziet hiervan nu slechts 1 hub. Gebruik de tabelweergave om de verschillende hubs op deze plek te zien.
      </div>` : ''}
    </div>
  `;

  return popupContent[props.phase] || popupContent['default'];
}


export const initPopupLogic = (theMap) => {
  // Docs: https://maplibre.org/maplibre-gl-js-docs/example/popup-on-click/
  const layerNamesToApplyPopupLogicTo = [
    'policy_hubs-layer-fill'
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

    //   const vehicleProperties = e.features[0].properties;
    //   const providerColor = getProviderColor(providers, vehicleProperties.system_id)

     // Stop if no features were found
      if(! e.features || ! e.features[0]) {
        return;
      }

      const coordinates = e.lngLat;
      const props = e.features[0].properties;

      // Ensure that if the map is zoomed out such that multiple
      // copies of the feature are visible, the popup appears
      // over the copy being pointed to.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      // TODO Add it as component:
      // - https://visgl.github.io/react-map-gl/docs/api-reference/popup
      // - https://mariestarck.com/how-to-display-popups-on-a-mapbox-map-mapbox-react-tutorial-part-3/
      popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setDOMContent(createPopupContent(e, props))
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
