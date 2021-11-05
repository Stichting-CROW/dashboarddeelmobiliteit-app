export default {
  'id': 'vehicles-heatmap-city-level',
  'type': 'heatmap',
  'source': 'vehicles',
  'paint': {
    // Increase the heatmap weight based on frequency and property magnitude
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'mag'],
      0, 0.0001,
      10, 1
    ],

    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 0.0025,
      5, 0.005,
      7.5, 0.01,
      10, 0.05,
      12, 0.075,/* city level */
      15, 0.1,
      20, 1,
    ],

    // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
    // Begin color ramp at 0-stop with a 0-transparancy color
    // to create a blur-like effect.
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0, 0, 255, 0)',
      0.25, '#ffd837',
      0.5, '#fe862e',
      0.75, '#fd3e48',
      1, '#9a231f'
    ],

    // Adjust the heatmap radius by zoom level
    // Groter = grotere radius = duidelijker waar het druk is
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 10,
      10, 12,
      12, 20,
      15, 40,
      20, 60,
      30, 100,
      40, 100
    ],
    'heatmap-opacity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      7, 1,
      9, 0.8
    ]
  }
}