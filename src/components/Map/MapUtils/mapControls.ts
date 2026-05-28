import maplibregl from 'maplibre-gl';

interface GeolocateControlOptions {
  positionOptions?: PositionOptions;
  fitBoundsOptions?: maplibregl.FitBoundsOptions;
  trackUserLocation?: boolean;
  showAccuracyCircle?: boolean;
  showUserLocation?: boolean;
}

/**
 * GeolocateControl checks geolocation support asynchronously in onAdd.
 * If the map is removed before that callback runs (e.g. React Strict Mode
 * double-mount), _setupUI runs with this._map already cleared and throws.
 * Guard the async path the same way _onSuccess already does internally.
 */
export const createSafeGeolocateControl = (
  options: GeolocateControlOptions
): maplibregl.GeolocateControl => {
  const control = new maplibregl.GeolocateControl(options);
  const controlWithSetup = control as maplibregl.GeolocateControl & {
    _setupUI: (supported: boolean) => void;
  };
  const setupUI = controlWithSetup._setupUI.bind(control);
  controlWithSetup._setupUI = (supported: boolean) => {
    if (!controlWithSetup._map) return;
    setupUI(supported);
  };
  return control;
};
