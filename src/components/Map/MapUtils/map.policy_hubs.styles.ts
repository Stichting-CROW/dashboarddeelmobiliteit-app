import { themes } from "../../../themes";

export const polygonLineStyle = {
    'line-color': [
      "case",
      // If selected: give yellow color
      ["==", ["get", "is_selected"], 1], '#ff0',
      // Otherwise: give color based on type
      ['match', ['get', 'geography_type'], // get the property
      'stop', themes.zone.stop.primaryColor,
      'no_parking', themes.zone.no_parking.primaryColor,
      'monitoring', themes.zone.monitoring.primaryColor,
      "#D20C0C"]
    ],
    'line-width': [
      "case",
      ["==", ["get", "is_selected"], 1], 3,
      ["boolean", ["feature-state", "hover"], false], 2,
      2
    ],
    'line-opacity': [
      'case',
      ['==', ['get', 'is_in_drawing_mode'], 1], 0,
      1
    ],
    "line-dasharray": [2, 3],
    // 'line-opacity': [
    //   "case",
    //     ["all",
    //       ["==", ["get", "is_selected"], 1],
    //       ["==", ["get", "phase"], 'concept'],
    //     ], 0,
    //     1
    // ]
  }

export const polygonFillStyle = {
    'fill-color': [
      'match', ['get', 'geography_type'], // get the property
      'stop', themes.zone.stop.primaryColor,
      'no_parking', themes.zone.no_parking.primaryColor,
      'monitoring', themes.zone.monitoring.primaryColor,
      themes.zone.monitoring.primaryColor
    ],
    'fill-outline-color': '#3bb2d0',
    'fill-opacity': [
      // If in drawing mode: give 0 opacity
      'case',
      ['==', ['get', 'is_in_drawing_mode'], 1], 0,
      // Otherwise: Give opacity based on geography_type
      ['match', ['get', 'geography_type'], // get the property
      'no_parking', 0.1,
      'monitoring', 0.2,
      'stop', 0.8,
       0.5]
    ]
  }
  
  const oldAdmin = [
    // Polygon outline stroke
    // This doesn't style the first edge of the polygon, which uses the line stroke styling instead
    {
      'id': 'gl-draw-polygon-stroke-active',
      'type': 'line',
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      'filter': [
        'all',
        ['==', '$type', 'Polygon'],
        ['!=', 'active', 'false']
      ],
      "paint": {
        "line-color": [
          // Matching based on user property: https://stackoverflow.com/a/70721495
          'match', ['get', 'geography_type'], // get the property
          'stop', themes.zone.stop.primaryColor,
          'no_parking', themes.zone.no_parking.primaryColor,
          'monitoring', themes.zone.monitoring.primaryColor,
          "#D20C0C"
         ],
        "line-dasharray": [0.2, 2],
        "line-width": 3
      }
    },
    // Vertex points
    {
      "id": "gl-draw-polygon-and-line-vertex-active",
      "type": "circle",
      "filter": [
        "all",
        ["==", "meta", "vertex"],
        ["!=", 'meta', 'midpoint'],
        ["==", "$type", "Point"],
        ["!=", "mode", "static"]
      ],
      "paint": {
        "circle-radius": 4,
        "circle-color": [
          // Matching based on user property: https://stackoverflow.com/a/70721495
          'match', ['get', 'geography_type'], // get the property
          'stop', themes.zone.stop.primaryColor,
          'no_parking', themes.zone.no_parking.primaryColor,
          'monitoring', themes.zone.monitoring.primaryColor,
          "#D20C0C"
        ]
      }
    },
    // Midpoints points
    {
      "id": "gl-draw-polygon-and-line-midpoint-active",
      "type": "circle",
      "filter": [
        "all",
        ["==", 'meta', 'midpoint'],
        ["==", "$type", "Point"],
        ["!=", "mode", "static"]
      ],
      "paint": {
        "circle-radius": 3,
        "circle-color": [
          // Matching based on user property: https://stackoverflow.com/a/70721495
          'match', ['get', 'geography_type'], // get the property
          'stop', themes.zone.stop.primaryColor,
          'no_parking', themes.zone.no_parking.primaryColor,
          'monitoring', themes.zone.monitoring.primaryColor,
          "#D20C0C"
        ]
      },
      'circle-opacity': 0.5
    }
  ];

const oldPublic = [
    // Polygon fill
    {
      'id': 'gl-draw-polygon-fill',
      'type': 'fill',
      'filter': [
        'all',
        // ['==', 'active', 'false'],
        ['==', '$type', 'Polygon'],
        ['!=', 'mode', 'static']
      ],
      'paint': {
        'fill-color': [
          // Matching based on user property: https://stackoverflow.com/a/70721495
          'match', ['get', 'user_geography_type'], // get the property
          'stop', themes.zone.stop.primaryColor,
          'no_parking', themes.zone.no_parking.primaryColor,
          'monitoring', themes.zone.monitoring.primaryColor,
          themes.zone.monitoring.primaryColor
         ],
        'fill-outline-color': '#3bb2d0',
        'fill-opacity': [
          // Matching based on user property: https://stackoverflow.com/a/70721495
          'match', ['get', 'user_geography_type'], // get the property
          'no_parking', 0.2,
          'monitoring', 0.3,
          'stop', 0.8,
          0.5
        ]
      }
    }
  ];