const base = {
  version: 8,
  sources: {
    composite: {
      type: 'vector',
      attribution: 'Mapbox',
      tiles: ['https://a.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoibWF0dCIsImEiOiJTUHZkajU0In0.oB-OGTMFtpkga8vC48HjIg']
    },
  },
  // "sprite": "mapbox://sprites/bartwr/cl8yy2i2c000014lk0s7mnr7e/ck2u8j60r58fu0sgyxrigm3cu",
  // "sprite": "https://api.mapbox.com/styles/v1/bartwr/cl8yy2i2c000014lk0s7mnr7e/draft/sprite@2x.json?fresh=true&access_token=tk.eyJ1IjoiYmFydHdyIiwiZXhwIjoxNjY1MTc5MTQ4LCJpYXQiOjE2NjUxNzU1NDgsInNjb3BlcyI6WyJlc3NlbnRpYWxzIiwic2NvcGVzOmxpc3QiLCJtYXA6cmVhZCIsIm1hcDp3cml0ZSIsInVzZXI6cmVhZCIsInVzZXI6d3JpdGUiLCJ1cGxvYWRzOnJlYWQiLCJ1cGxvYWRzOmxpc3QiLCJ1cGxvYWRzOndyaXRlIiwic3R5bGVzOnRpbGVzIiwic3R5bGVzOnJlYWQiLCJmb250czpsaXN0IiwiZm9udHM6cmVhZCIsImZvbnRzOndyaXRlIiwic3R5bGVzOndyaXRlIiwic3R5bGVzOmxpc3QiLCJzdHlsZXM6ZG93bmxvYWQiLCJzdHlsZXM6cHJvdGVjdCIsInRva2VuczpyZWFkIiwidG9rZW5zOndyaXRlIiwiZGF0YXNldHM6bGlzdCIsImRhdGFzZXRzOnJlYWQiLCJkYXRhc2V0czp3cml0ZSIsInRpbGVzZXRzOmxpc3QiLCJ0aWxlc2V0czpyZWFkIiwidGlsZXNldHM6d3JpdGUiLCJkb3dubG9hZHM6cmVhZCIsInZpc2lvbjpyZWFkIiwidmlzaW9uOmRvd25sb2FkIiwibmF2aWdhdGlvbjpkb3dubG9hZCIsIm9mZmxpbmU6cmVhZCIsIm9mZmxpbmU6d3JpdGUiLCJzdHlsZXM6ZHJhZnQiLCJmb250czptZXRhZGF0YSIsInNwcml0ZS1pbWFnZXM6cmVhZCIsImRhdGFzZXRzOnN0dWRpbyIsImN1c3RvbWVyczp3cml0ZSIsImNyZWRlbnRpYWxzOnJlYWQiLCJjcmVkZW50aWFsczp3cml0ZSIsImFuYWx5dGljczpyZWFkIl0sImNsaWVudCI6Im1hcGJveC5jb20iLCJsbCI6MTY2NTE3NDc0MzUyOCwiaXUiOm51bGwsImVtYWlsIjoibWFpbEBiYXJ0cm9vcmRhLm5sIn0.onvMaEj0urnm2g3FFyrAVg",
  sprite: "https://api.mapbox.com/styles/v1/bartwr/cl8yy2i2c000014lk0s7mnr7e/draft/sprite@2x.json?access_token=tk.eyJ1IjoiYmFydHdyIiwiZXhwIjoxNjY1MTc5MTQ4LCJpYXQiOjE2NjUxNzU1NDgsInNjb3BlcyI6WyJlc3NlbnRpYWxzIiwic2NvcGVzOmxpc3QiLCJtYXA6cmVhZCIsIm1hcDp3cml0ZSIsInVzZXI6cmVhZCIsInVzZXI6d3JpdGUiLCJ1cGxvYWRzOnJlYWQiLCJ1cGxvYWRzOmxpc3QiLCJ1cGxvYWRzOndyaXRlIiwic3R5bGVzOnRpbGVzIiwic3R5bGVzOnJlYWQiLCJmb250czpsaXN0IiwiZm9udHM6cmVhZCIsImZvbnRzOndyaXRlIiwic3R5bGVzOndyaXRlIiwic3R5bGVzOmxpc3QiLCJzdHlsZXM6ZG93bmxvYWQiLCJzdHlsZXM6cHJvdGVjdCIsInRva2VuczpyZWFkIiwidG9rZW5zOndyaXRlIiwiZGF0YXNldHM6bGlzdCIsImRhdGFzZXRzOnJlYWQiLCJkYXRhc2V0czp3cml0ZSIsInRpbGVzZXRzOmxpc3QiLCJ0aWxlc2V0czpyZWFkIiwidGlsZXNldHM6d3JpdGUiLCJkb3dubG9hZHM6cmVhZCIsInZpc2lvbjpyZWFkIiwidmlzaW9uOmRvd25sb2FkIiwibmF2aWdhdGlvbjpkb3dubG9hZCIsIm9mZmxpbmU6cmVhZCIsIm9mZmxpbmU6d3JpdGUiLCJzdHlsZXM6ZHJhZnQiLCJmb250czptZXRhZGF0YSIsInNwcml0ZS1pbWFnZXM6cmVhZCIsImRhdGFzZXRzOnN0dWRpbyIsImN1c3RvbWVyczp3cml0ZSIsImNyZWRlbnRpYWxzOnJlYWQiLCJjcmVkZW50aWFsczp3cml0ZSIsImFuYWx5dGljczpyZWFkIl0sImNsaWVudCI6Im1hcGJveC5jb20iLCJsbCI6MTY2NTE3NDc0MzUyOCwiaXUiOm51bGwsImVtYWlsIjoibWFpbEBiYXJ0cm9vcmRhLm5sIn0.onvMaEj0urnm2g3FFyrAVg",
  glyphs: "https://a.tiles.mapbox.com/v4/fontstack/{fontstack}/{range}.pbf?access_token=pk.eyJ1IjoibWF0dCIsImEiOiJTUHZkajU0In0.oB-OGTMFtpkga8vC48HjIg",
  layers: [
      {
          "id": "land",
          "type": "background",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, land"
          },
          "layout": {},
          "paint": {"background-color": "hsl(40, 8%, 96%)"}
      },
      {
          "id": "national-park",
          "type": "fill",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, land"
          },
          "source": "composite",
          "source-layer": "landuse_overlay",
          "minzoom": 5,
          "filter": ["==", ["get", "class"], "national_park"],
          "layout": {},
          "paint": {
              "fill-color": "hsl(78, 65%, 82%)",
              "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  0,
                  6,
                  0.5,
                  10,
                  0.5
              ]
          }
      },
      {
          "id": "landuse",
          "type": "fill",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, land"
          },
          "source": "composite",
          "source-layer": "landuse",
          "minzoom": 5,
          "filter": [
              "match",
              ["get", "class"],
              ["park", "airport", "glacier", "pitch", "sand", "facility"],
              true,
              "cemetery",
              true,
              "hospital",
              true,
              false
          ],
          "layout": {},
          "paint": {
              "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  [
                      "match",
                      ["get", "class"],
                      "park",
                      "hsl(78, 65%, 82%)",
                      "airport",
                      "hsl(225, 11%, 97%)",
                      "cemetery",
                      "hsl(60, 28%, 88%)",
                      "glacier",
                      "hsl(205, 49%, 93%)",
                      "hospital",
                      "hsl(3, 23%, 93%)",
                      "pitch",
                      "hsl(78, 66%, 77%)",
                      "sand",
                      "hsl(65, 52%, 95%)",
                      "hsl(40, 12%, 91%)"
                  ],
                  16,
                  [
                      "match",
                      ["get", "class"],
                      "park",
                      "hsl(78, 65%, 82%)",
                      "airport",
                      "hsl(225, 25%, 95%)",
                      "cemetery",
                      "hsl(60, 28%, 88%)",
                      "glacier",
                      "hsl(205, 49%, 93%)",
                      "hospital",
                      "hsl(3, 38%, 95%)",
                      "pitch",
                      "hsl(78, 66%, 77%)",
                      "sand",
                      "hsl(65, 52%, 95%)",
                      "hsl(40, 12%, 91%)"
                  ]
              ],
              "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  5,
                  0,
                  6,
                  ["match", ["get", "class"], "glacier", 0.5, 1]
              ]
          }
      },
      {
          "id": "pitch-outline",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, land"
          },
          "source": "composite",
          "source-layer": "landuse",
          "minzoom": 15,
          "filter": ["==", ["get", "class"], "pitch"],
          "layout": {},
          "paint": {"line-color": "hsl(60, 37%, 91%)"}
      },
      {
          "id": "waterway",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, water"
          },
          "source": "composite",
          "source-layer": "waterway",
          "minzoom": 8,
          "layout": {
              "line-cap": ["step", ["zoom"], "butt", 11, "round"],
              "line-join": "round"
          },
          "paint": {
              "line-color": "hsl(205, 69%, 90%)",
              "line-width": [
                  "interpolate",
                  ["exponential", 1.3],
                  ["zoom"],
                  9,
                  ["match", ["get", "class"], ["canal", "river"], 0.1, 0],
                  20,
                  ["match", ["get", "class"], ["canal", "river"], 8, 3]
              ],
              "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  0,
                  8.5,
                  1
              ]
          }
      },
      {
          "id": "water",
          "type": "fill",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, water"
          },
          "source": "composite",
          "source-layer": "water",
          "layout": {},
          "paint": {"fill-color": "hsl(205, 69%, 90%)"}
      },
      {
          "id": "land-structure-polygon",
          "type": "fill",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, built"
          },
          "source": "composite",
          "source-layer": "structure",
          "minzoom": 13,
          "filter": [
              "all",
              ["==", ["geometry-type"], "Polygon"],
              ["==", ["get", "class"], "land"]
          ],
          "layout": {},
          "paint": {"fill-color": "hsl(40, 8%, 96%)"}
      },
      {
          "id": "land-structure-line",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "land-and-water",
              "mapbox:group": "Land, water, & sky, built"
          },
          "source": "composite",
          "source-layer": "structure",
          "minzoom": 13,
          "filter": [
              "all",
              ["==", ["geometry-type"], "LineString"],
              ["==", ["get", "class"], "land"]
          ],
          "layout": {"line-cap": "round"},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.99],
                  ["zoom"],
                  14,
                  0.75,
                  20,
                  40
              ],
              "line-color": "hsl(40, 8%, 96%)"
          }
      },
      {
          "id": "aeroway-polygon",
          "type": "fill",
          "metadata": {
              "mapbox:featureComponent": "transit",
              "mapbox:group": "Transit, built"
          },
          "source": "composite",
          "source-layer": "aeroway",
          "minzoom": 11,
          "filter": [
              "all",
              ["==", ["geometry-type"], "Polygon"],
              [
                  "match",
                  ["get", "type"],
                  ["runway", "taxiway", "helipad"],
                  true,
                  false
              ]
          ],
          "layout": {},
          "paint": {
              "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  "hsl(225, 9%, 88%)",
                  16,
                  "hsl(225, 6%, 90%)"
              ],
              "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  11,
                  0,
                  11.5,
                  1
              ]
          }
      },
      {
          "id": "aeroway-line",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "transit",
              "mapbox:group": "Transit, built"
          },
          "source": "composite",
          "source-layer": "aeroway",
          "minzoom": 9,
          "filter": ["==", ["geometry-type"], "LineString"],
          "layout": {},
          "paint": {
              "line-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  "hsl(225, 9%, 88%)",
                  16,
                  "hsl(225, 6%, 90%)"
              ],
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  9,
                  ["match", ["get", "type"], "runway", 1, 0.5],
                  18,
                  ["match", ["get", "type"], "runway", 80, 20]
              ]
          }
      },
      {
          "id": "building-outline",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "buildings",
              "mapbox:group": "Buildings, built"
          },
          "source": "composite",
          "source-layer": "building",
          "minzoom": 15,
          "filter": [
              "all",
              ["!=", ["get", "type"], "building:part"],
              ["==", ["get", "underground"], "false"]
          ],
          "layout": {},
          "paint": {
              "line-color": "hsl(40, 4%, 86%)",
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  15,
                  0.75,
                  20,
                  3
              ],
              "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  16,
                  1
              ]
          }
      },
      {
          "id": "building",
          "type": "fill",
          "metadata": {
              "mapbox:featureComponent": "buildings",
              "mapbox:group": "Buildings, built"
          },
          "source": "composite",
          "source-layer": "building",
          "minzoom": 15,
          "filter": [
              "all",
              ["!=", ["get", "type"], "building:part"],
              ["==", ["get", "underground"], "false"]
          ],
          "layout": {},
          "paint": {
              "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  "hsl(40, 7%, 92%)",
                  16,
                  "hsl(40, 3%, 92%)"
              ],
              "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  15,
                  0,
                  16,
                  1
              ],
              "fill-outline-color": "hsl(40, 4%, 86%)"
          }
      },
      {
          "id": "tunnel-path",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., tunnels"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 14,
          "filter": [
              "all",
              ["==", ["get", "structure"], "tunnel"],
              ["==", ["get", "class"], "path"],
              ["!=", ["get", "type"], "steps"],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  15,
                  1,
                  18,
                  4
              ],
              "line-color": "hsl(40, 4%, 86%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [1, 0]],
                  15,
                  ["literal", [1.75, 1]],
                  16,
                  ["literal", [1, 0.75]],
                  17,
                  ["literal", [1, 0.5]]
              ]
          }
      },
      {
          "id": "tunnel-steps",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., tunnels"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 14,
          "filter": [
              "all",
              ["==", ["get", "structure"], "tunnel"],
              ["==", ["get", "type"], "steps"],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  15,
                  1,
                  16,
                  1.6,
                  18,
                  6
              ],
              "line-color": "hsl(40, 4%, 86%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [1, 0]],
                  15,
                  ["literal", [1.75, 1]],
                  16,
                  ["literal", [1, 0.75]],
                  17,
                  ["literal", [0.3, 0.3]]
              ]
          }
      },
      {
          "id": "tunnel-pedestrian",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., tunnels"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 13,
          "filter": [
              "all",
              ["==", ["get", "structure"], "tunnel"],
              ["==", ["get", "class"], "pedestrian"],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  14,
                  0.5,
                  18,
                  12
              ],
              "line-color": "hsl(40, 4%, 86%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [1, 0]],
                  15,
                  ["literal", [1.5, 0.4]],
                  16,
                  ["literal", [1, 0.2]]
              ]
          }
      },
      {
          "id": "tunnel-simple",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "road-network",
              "mapbox:group": "Road network, tunnels"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 13,
          "filter": [
              "all",
              ["==", ["get", "structure"], "tunnel"],
              [
                  "step",
                  ["zoom"],
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "secondary",
                          "tertiary",
                          "street",
                          "street_limited",
                          "primary_link",
                          "track"
                      ],
                      true,
                      false
                  ],
                  14,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "primary_link",
                          "secondary",
                          "secondary_link",
                          "tertiary",
                          "tertiary_link",
                          "street",
                          "street_limited",
                          "service",
                          "track"
                      ],
                      true,
                      false
                  ]
              ],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  13,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      4,
                      ["secondary", "tertiary"],
                      2.5,
                      [
                          "motorway_link",
                          "trunk_link",
                          "street",
                          "street_limited",
                          "primary_link"
                      ],
                      1,
                      0.5
                  ],
                  18,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      32,
                      ["secondary", "tertiary"],
                      26,
                      [
                          "motorway_link",
                          "trunk_link",
                          "street",
                          "street_limited",
                          "primary_link"
                      ],
                      18,
                      12
                  ]
              ],
              "line-color": "hsl(38, 55%, 93%)"
          }
      },
      {
          "id": "road-path",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., surface"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 12,
          "filter": [
              "all",
              ["==", ["get", "class"], "path"],
              [
                  "step",
                  ["zoom"],
                  [
                      "!",
                      [
                          "match",
                          ["get", "type"],
                          ["steps", "sidewalk", "crossing"],
                          true,
                          false
                      ]
                  ],
                  16,
                  ["!=", ["get", "type"], "steps"]
              ],
              ["match", ["get", "structure"], ["none", "ford"], true, false],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {"line-join": ["step", ["zoom"], "miter", 14, "round"]},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  13,
                  0.5,
                  14,
                  1,
                  15,
                  1,
                  18,
                  4
              ],
              "line-color": "hsl(40, 8%, 100%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [4, 0.3]],
                  15,
                  ["literal", [1.75, 0.3]],
                  16,
                  ["literal", [1, 0.3]],
                  17,
                  ["literal", [1, 0.25]]
              ]
          }
      },
      {
          "id": "road-steps",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., surface"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 14,
          "filter": [
              "all",
              ["==", ["get", "type"], "steps"],
              ["match", ["get", "structure"], ["none", "ford"], true, false],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {"line-join": "round"},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  15,
                  1,
                  16,
                  1.6,
                  18,
                  6
              ],
              "line-color": "hsl(40, 8%, 100%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [1, 0]],
                  15,
                  ["literal", [1.75, 1]],
                  16,
                  ["literal", [1, 0.75]],
                  17,
                  ["literal", [0.3, 0.3]]
              ]
          }
      },
      {
          "id": "road-pedestrian",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., surface"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 12,
          "filter": [
              "all",
              ["==", ["get", "class"], "pedestrian"],
              ["match", ["get", "structure"], ["none", "ford"], true, false],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {"line-join": ["step", ["zoom"], "miter", 14, "round"]},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  14,
                  0.5,
                  18,
                  12
              ],
              "line-color": "hsl(40, 8%, 100%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [1, 0]],
                  15,
                  ["literal", [1.5, 0.4]],
                  16,
                  ["literal", [1, 0.2]]
              ]
          }
      },
      {
          "id": "road-simple",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "road-network",
              "mapbox:group": "Road network, surface"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 5,
          "filter": [
              "all",
              [
                  "step",
                  ["zoom"],
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk"],
                      true,
                      false
                  ],
                  6,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      true,
                      false
                  ],
                  8,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary", "secondary"],
                      true,
                      false
                  ],
                  10,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "trunk",
                          "primary",
                          "secondary",
                          "tertiary",
                          "motorway_link",
                          "trunk_link"
                      ],
                      true,
                      false
                  ],
                  11,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "secondary",
                          "tertiary",
                          "street"
                      ],
                      true,
                      false
                  ],
                  12,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "secondary",
                          "tertiary",
                          "street",
                          "street_limited",
                          "primary_link"
                      ],
                      true,
                      false
                  ],
                  13,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "secondary",
                          "tertiary",
                          "street",
                          "street_limited",
                          "primary_link",
                          "track"
                      ],
                      true,
                      false
                  ],
                  14,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "primary_link",
                          "secondary",
                          "secondary_link",
                          "tertiary",
                          "tertiary_link",
                          "street",
                          "street_limited",
                          "service",
                          "track"
                      ],
                      true,
                      false
                  ]
              ],
              ["match", ["get", "structure"], ["none", "ford"], true, false],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {
              "line-cap": ["step", ["zoom"], "butt", 14, "round"],
              "line-join": ["step", ["zoom"], "miter", 14, "round"]
          },
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  5,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      0.75,
                      ["secondary", "tertiary"],
                      0.1,
                      0
                  ],
                  13,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      4,
                      ["secondary", "tertiary"],
                      2.5,
                      [
                          "motorway_link",
                          "trunk_link",
                          "primary_link",
                          "street",
                          "street_limited"
                      ],
                      1,
                      0.5
                  ],
                  18,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      32,
                      ["secondary", "tertiary"],
                      26,
                      [
                          "motorway_link",
                          "trunk_link",
                          "primary_link",
                          "street",
                          "street_limited"
                      ],
                      18,
                      10
                  ]
              ],
              "line-color": [
                  "match",
                  ["get", "class"],
                  [
                      "primary_link",
                      "secondary_link",
                      "tertiary_link",
                      "street",
                      "street_limited",
                      "service",
                      "track"
                  ],
                  "hsl(38, 55%, 97%)",
                  "hsl(38, 55%, 100%)"
              ]
          }
      },
      {
          "id": "bridge-path",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., barriers-bridges"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 14,
          "filter": [
              "all",
              ["==", ["get", "structure"], "bridge"],
              ["==", ["get", "class"], "path"],
              ["==", ["geometry-type"], "LineString"],
              ["!=", ["get", "type"], "steps"]
          ],
          "layout": {"line-join": "round"},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  15,
                  1,
                  18,
                  4
              ],
              "line-color": "hsl(40, 8%, 100%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [4, 0.3]],
                  15,
                  ["literal", [1.75, 0.3]],
                  16,
                  ["literal", [1, 0.3]],
                  17,
                  ["literal", [1, 0.25]]
              ]
          }
      },
      {
          "id": "bridge-steps",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., barriers-bridges"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 14,
          "filter": [
              "all",
              ["==", ["get", "type"], "steps"],
              ["==", ["get", "structure"], "bridge"],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {"line-join": "round"},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  15,
                  1,
                  16,
                  1.6,
                  18,
                  6
              ],
              "line-color": "hsl(40, 8%, 100%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [1, 0]],
                  15,
                  ["literal", [1.75, 1]],
                  16,
                  ["literal", [1, 0.75]],
                  17,
                  ["literal", [0.3, 0.3]]
              ]
          }
      },
      {
          "id": "bridge-pedestrian",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., barriers-bridges"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 13,
          "filter": [
              "all",
              ["==", ["get", "structure"], "bridge"],
              ["==", ["get", "class"], "pedestrian"],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {"line-join": "round"},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  14,
                  0.5,
                  18,
                  12
              ],
              "line-color": "hsl(40, 8%, 100%)",
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [1, 0]],
                  15,
                  ["literal", [1.5, 0.4]],
                  16,
                  ["literal", [1, 0.2]]
              ]
          }
      },
      {
          "id": "bridge-case-simple",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "road-network",
              "mapbox:group": "Road network, bridges"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 13,
          "filter": [
              "all",
              ["==", ["get", "structure"], "bridge"],
              [
                  "step",
                  ["zoom"],
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "secondary",
                          "tertiary",
                          "street",
                          "street_limited",
                          "primary_link",
                          "track"
                      ],
                      true,
                      false
                  ],
                  14,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "primary_link",
                          "secondary",
                          "secondary_link",
                          "tertiary",
                          "tertiary_link",
                          "street",
                          "street_limited",
                          "service",
                          "track"
                      ],
                      true,
                      false
                  ]
              ],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {"line-join": ["step", ["zoom"], "miter", 14, "round"]},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  13,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      6,
                      ["secondary", "tertiary"],
                      4,
                      [
                          "motorway_link",
                          "trunk_link",
                          "street",
                          "street_limited",
                          "primary_link"
                      ],
                      2.5,
                      1.25
                  ],
                  18,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      36,
                      ["secondary", "tertiary"],
                      30,
                      [
                          "motorway_link",
                          "trunk_link",
                          "street",
                          "street_limited",
                          "primary_link"
                      ],
                      22,
                      16
                  ]
              ],
              "line-color": "hsl(40, 8%, 96%)"
          }
      },
      {
          "id": "bridge-simple",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "road-network",
              "mapbox:group": "Road network, bridges"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 13,
          "filter": [
              "all",
              ["==", ["get", "structure"], "bridge"],
              [
                  "step",
                  ["zoom"],
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk"],
                      true,
                      false
                  ],
                  13,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "secondary",
                          "tertiary",
                          "street",
                          "street_limited",
                          "primary_link",
                          "track"
                      ],
                      true,
                      false
                  ],
                  14,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "motorway_link",
                          "trunk",
                          "trunk_link",
                          "primary",
                          "primary_link",
                          "secondary",
                          "secondary_link",
                          "tertiary",
                          "tertiary_link",
                          "street",
                          "street_limited",
                          "service",
                          "track"
                      ],
                      true,
                      false
                  ]
              ],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {
              "line-cap": ["step", ["zoom"], "butt", 14, "round"],
              "line-join": ["step", ["zoom"], "miter", 14, "round"]
          },
          "paint": {
              "line-width": [
                  "interpolate",
                  ["exponential", 1.5],
                  ["zoom"],
                  13,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      4,
                      ["secondary", "tertiary"],
                      2.5,
                      [
                          "motorway_link",
                          "trunk_link",
                          "street",
                          "street_limited",
                          "primary_link"
                      ],
                      1,
                      0.5
                  ],
                  18,
                  [
                      "match",
                      ["get", "class"],
                      ["motorway", "trunk", "primary"],
                      32,
                      ["secondary", "tertiary"],
                      26,
                      [
                          "motorway_link",
                          "trunk_link",
                          "street",
                          "street_limited",
                          "primary_link"
                      ],
                      18,
                      12
                  ]
              ],
              "line-color": [
                  "match",
                  ["get", "class"],
                  [
                      "primary_link",
                      "secondary_link",
                      "tertiary_link",
                      "street",
                      "street_limited",
                      "service",
                      "track"
                  ],
                  "hsl(38, 55%, 97%)",
                  "hsl(38, 55%, 100%)"
              ]
          }
      },
      {
          "id": "admin-1-boundary-bg",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "admin-boundaries",
              "mapbox:group": "Administrative boundaries, admin"
          },
          "source": "composite",
          "source-layer": "admin",
          "minzoom": 7,
          "filter": [
              "all",
              ["==", ["get", "admin_level"], 1],
              ["==", ["get", "maritime"], "false"],
              ["match", ["get", "worldview"], ["all", "US"], true, false]
          ],
          "layout": {"line-join": "bevel"},
          "paint": {
              "line-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  8,
                  "hsl(40, 8%, 96%)",
                  16,
                  "hsl(0, 0%, 96%)"
              ],
              "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  7,
                  3.75,
                  12,
                  5.5
              ],
              "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  7,
                  0,
                  8,
                  0.75
              ],
              "line-dasharray": [1, 0],
              "line-blur": ["interpolate", ["linear"], ["zoom"], 3, 0, 8, 3]
          }
      },
      {
          "id": "admin-0-boundary-bg",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "admin-boundaries",
              "mapbox:group": "Administrative boundaries, admin"
          },
          "source": "composite",
          "source-layer": "admin",
          "minzoom": 1,
          "filter": [
              "all",
              ["==", ["get", "admin_level"], 0],
              ["==", ["get", "maritime"], "false"],
              ["match", ["get", "worldview"], ["all", "US"], true, false]
          ],
          "layout": {},
          "paint": {
              "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  3.5,
                  10,
                  8
              ],
              "line-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  6,
                  "hsl(40, 8%, 96%)",
                  8,
                  "hsl(0, 0%, 96%)"
              ],
              "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  0,
                  4,
                  0.5
              ],
              "line-blur": ["interpolate", ["linear"], ["zoom"], 3, 0, 10, 2]
          }
      },
      {
          "id": "admin-1-boundary",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "admin-boundaries",
              "mapbox:group": "Administrative boundaries, admin"
          },
          "source": "composite",
          "source-layer": "admin",
          "minzoom": 2,
          "filter": [
              "all",
              ["==", ["get", "admin_level"], 1],
              ["==", ["get", "maritime"], "false"],
              ["match", ["get", "worldview"], ["all", "US"], true, false]
          ],
          "layout": {"line-join": "round", "line-cap": "round"},
          "paint": {
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [2, 0]],
                  7,
                  ["literal", [2, 2, 6, 2]]
              ],
              "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  7,
                  0.75,
                  12,
                  1.5
              ],
              "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  0,
                  3,
                  1
              ],
              "line-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  "hsl(0, 0%, 77%)",
                  7,
                  "hsl(0, 0%, 62%)"
              ]
          }
      },
      {
          "id": "admin-0-boundary",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "admin-boundaries",
              "mapbox:group": "Administrative boundaries, admin"
          },
          "source": "composite",
          "source-layer": "admin",
          "minzoom": 1,
          "filter": [
              "all",
              ["==", ["get", "admin_level"], 0],
              ["==", ["get", "disputed"], "false"],
              ["==", ["get", "maritime"], "false"],
              ["match", ["get", "worldview"], ["all", "US"], true, false]
          ],
          "layout": {"line-join": "round", "line-cap": "round"},
          "paint": {
              "line-color": "hsl(0, 0%, 51%)",
              "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  0.5,
                  10,
                  2
              ],
              "line-dasharray": [10, 0]
          }
      },
      {
          "id": "admin-0-boundary-disputed",
          "type": "line",
          "metadata": {
              "mapbox:featureComponent": "admin-boundaries",
              "mapbox:group": "Administrative boundaries, admin"
          },
          "source": "composite",
          "source-layer": "admin",
          "minzoom": 1,
          "filter": [
              "all",
              ["==", ["get", "disputed"], "true"],
              ["==", ["get", "admin_level"], 0],
              ["==", ["get", "maritime"], "false"],
              ["match", ["get", "worldview"], ["all", "US"], true, false]
          ],
          "layout": {"line-join": "round"},
          "paint": {
              "line-color": "hsl(0, 0%, 51%)",
              "line-width": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  0.5,
                  10,
                  2
              ],
              "line-dasharray": [
                  "step",
                  ["zoom"],
                  ["literal", [3.25, 3.25]],
                  6,
                  ["literal", [2.5, 2.5]],
                  7,
                  ["literal", [2, 2.25]],
                  8,
                  ["literal", [1.75, 2]]
              ]
          }
      },
      {
          "id": "road-label-simple",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "road-network",
              "mapbox:group": "Road network, road-labels"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 12,
          "filter": [
              "match",
              ["get", "class"],
              [
                  "motorway",
                  "trunk",
                  "primary",
                  "secondary",
                  "tertiary",
                  "street",
                  "street_limited"
              ],
              true,
              false
          ],
          "layout": {
              "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "trunk",
                          "primary",
                          "secondary",
                          "tertiary"
                      ],
                      10,
                      9
                  ],
                  18,
                  [
                      "match",
                      ["get", "class"],
                      [
                          "motorway",
                          "trunk",
                          "primary",
                          "secondary",
                          "tertiary"
                      ],
                      16,
                      14
                  ]
              ],
              "text-max-angle": 30,
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "symbol-placement": "line",
              "text-padding": 1,
              "text-rotation-alignment": "map",
              "text-pitch-alignment": "viewport",
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-letter-spacing": 0.01
          },
          "paint": {
              "text-color": "hsl(40, 8%, 48%)",
              "text-halo-color": "hsl(38, 55%, 100%)",
              "text-halo-width": 1
          }
      },
      {
          "id": "path-pedestrian-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "walking-cycling",
              "mapbox:group": "Walking, cycling, etc., walking-cycling-labels"
          },
          "source": "composite",
          "source-layer": "road",
          "minzoom": 12,
          "filter": [
              "step",
              ["zoom"],
              ["match", ["get", "class"], ["pedestrian"], true, false],
              15,
              ["match", ["get", "class"], ["path", "pedestrian"], true, false]
          ],
          "layout": {
              "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  10,
                  ["match", ["get", "class"], "pedestrian", 9, 6.5],
                  18,
                  ["match", ["get", "class"], "pedestrian", 14, 13]
              ],
              "text-max-angle": 30,
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "symbol-placement": "line",
              "text-padding": 1,
              "text-rotation-alignment": "map",
              "text-pitch-alignment": "viewport",
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-letter-spacing": 0.01
          },
          "paint": {
              "text-color": "hsl(40, 8%, 48%)",
              "text-halo-color": "hsl(40, 6%, 100%)",
              "text-halo-width": 1,
              "text-halo-blur": 1
          }
      },
      {
          "id": "waterway-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "natural-features",
              "mapbox:group": "Natural features, natural-labels"
          },
          "source": "composite",
          "source-layer": "natural_label",
          "minzoom": 13,
          "filter": [
              "all",
              [
                  "match",
                  ["get", "class"],
                  ["canal", "river", "stream"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  ["disputed_canal", "disputed_river", "disputed_stream"],
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {
              "text-font": ["DIN Pro Italic", "Arial Unicode MS Regular"],
              "text-max-angle": 30,
              "symbol-spacing": [
                  "interpolate",
                  ["linear", 1],
                  ["zoom"],
                  15,
                  250,
                  17,
                  400
              ],
              "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  13,
                  12,
                  18,
                  16
              ],
              "symbol-placement": "line",
              "text-pitch-alignment": "viewport",
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]]
          },
          "paint": {"text-color": "hsl(205, 37%, 57%)"}
      },
      {
          "id": "natural-line-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "natural-features",
              "mapbox:group": "Natural features, natural-labels"
          },
          "source": "composite",
          "source-layer": "natural_label",
          "minzoom": 4,
          "filter": [
              "all",
              [
                  "match",
                  ["get", "class"],
                  ["glacier", "landform"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  ["disputed_glacier", "disputed_landform"],
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              ["==", ["geometry-type"], "LineString"],
              ["<=", ["get", "filterrank"], 2]
          ],
          "layout": {
              "text-size": [
                  "step",
                  ["zoom"],
                  ["step", ["get", "sizerank"], 18, 5, 12],
                  17,
                  ["step", ["get", "sizerank"], 18, 13, 12]
              ],
              "text-max-angle": 30,
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "symbol-placement": "line-center",
              "text-pitch-alignment": "viewport"
          },
          "paint": {
              "text-halo-width": 0.5,
              "text-halo-color": "hsl(40, 15%, 100%)",
              "text-halo-blur": 0.5,
              "text-color": [
                  "step",
                  ["zoom"],
                  [
                      "step",
                      ["get", "sizerank"],
                      "hsl(26, 30%, 45%)",
                      5,
                      "hsl(26, 35%, 35%)"
                  ],
                  17,
                  [
                      "step",
                      ["get", "sizerank"],
                      "hsl(26, 30%, 45%)",
                      13,
                      "hsl(26, 35%, 35%)"
                  ]
              ]
          }
      },
      {
          "id": "natural-point-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "natural-features",
              "mapbox:group": "Natural features, natural-labels"
          },
          "source": "composite",
          "source-layer": "natural_label",
          "minzoom": 4,
          "filter": [
              "all",
              [
                  "match",
                  ["get", "class"],
                  ["dock", "glacier", "landform", "water_feature", "wetland"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  [
                      "disputed_dock",
                      "disputed_glacier",
                      "disputed_landform",
                      "disputed_water_feature",
                      "disputed_wetland"
                  ],
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              ["==", ["geometry-type"], "Point"],
              ["<=", ["get", "filterrank"], 2]
          ],
          "layout": {
              "text-size": [
                  "step",
                  ["zoom"],
                  ["step", ["get", "sizerank"], 18, 5, 12],
                  17,
                  ["step", ["get", "sizerank"], 18, 13, 12]
              ],
              "icon-image": ["get", "maki"],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "text-offset": [
                  "step",
                  ["zoom"],
                  [
                      "step",
                      ["get", "sizerank"],
                      ["literal", [0, 0]],
                      5,
                      ["literal", [0, 0.75]]
                  ],
                  17,
                  [
                      "step",
                      ["get", "sizerank"],
                      ["literal", [0, 0]],
                      13,
                      ["literal", [0, 0.75]]
                  ]
              ],
              "text-anchor": [
                  "step",
                  ["zoom"],
                  ["step", ["get", "sizerank"], "center", 5, "top"],
                  17,
                  ["step", ["get", "sizerank"], "center", 13, "top"]
              ],
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]]
          },
          "paint": {
              "icon-opacity": [
                  "step",
                  ["zoom"],
                  ["step", ["get", "sizerank"], 0, 5, 1],
                  17,
                  ["step", ["get", "sizerank"], 0, 13, 1]
              ],
              "text-halo-color": "hsl(40, 15%, 100%)",
              "text-halo-width": 0.5,
              "text-halo-blur": 0.5,
              "text-color": [
                  "step",
                  ["zoom"],
                  [
                      "step",
                      ["get", "sizerank"],
                      "hsl(26, 30%, 45%)",
                      5,
                      "hsl(26, 35%, 35%)"
                  ],
                  17,
                  [
                      "step",
                      ["get", "sizerank"],
                      "hsl(26, 30%, 45%)",
                      13,
                      "hsl(26, 35%, 35%)"
                  ]
              ]
          }
      },
      {
          "id": "water-line-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "natural-features",
              "mapbox:group": "Natural features, natural-labels"
          },
          "source": "composite",
          "source-layer": "natural_label",
          "filter": [
              "all",
              [
                  "match",
                  ["get", "class"],
                  ["bay", "ocean", "reservoir", "sea", "water"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  [
                      "disputed_bay",
                      "disputed_ocean",
                      "disputed_reservoir",
                      "disputed_sea",
                      "disputed_water"
                  ],
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              ["==", ["geometry-type"], "LineString"]
          ],
          "layout": {
              "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  7,
                  ["step", ["get", "sizerank"], 20, 6, 18, 12, 12],
                  10,
                  ["step", ["get", "sizerank"], 15, 9, 12],
                  18,
                  ["step", ["get", "sizerank"], 15, 9, 14]
              ],
              "text-max-angle": 30,
              "text-letter-spacing": [
                  "match",
                  ["get", "class"],
                  "ocean",
                  0.25,
                  ["sea", "bay"],
                  0.15,
                  0
              ],
              "text-font": ["DIN Pro Italic", "Arial Unicode MS Regular"],
              "symbol-placement": "line-center",
              "text-pitch-alignment": "viewport",
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]]
          },
          "paint": {
              "text-color": [
                  "match",
                  ["get", "class"],
                  ["bay", "ocean", "sea"],
                  "hsl(205, 65%, 70%)",
                  "hsl(205, 37%, 57%)"
              ]
          }
      },
      {
          "id": "water-point-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "natural-features",
              "mapbox:group": "Natural features, natural-labels"
          },
          "source": "composite",
          "source-layer": "natural_label",
          "filter": [
              "all",
              [
                  "match",
                  ["get", "class"],
                  ["bay", "ocean", "reservoir", "sea", "water"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  [
                      "disputed_bay",
                      "disputed_ocean",
                      "disputed_reservoir",
                      "disputed_sea",
                      "disputed_water"
                  ],
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              ["==", ["geometry-type"], "Point"]
          ],
          "layout": {
              "text-line-height": 1.3,
              "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  7,
                  ["step", ["get", "sizerank"], 20, 6, 15, 12, 12],
                  10,
                  ["step", ["get", "sizerank"], 15, 9, 12]
              ],
              "text-font": ["DIN Pro Italic", "Arial Unicode MS Regular"],
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-letter-spacing": [
                  "match",
                  ["get", "class"],
                  "ocean",
                  0.25,
                  ["bay", "sea"],
                  0.15,
                  0.01
              ],
              "text-max-width": [
                  "match",
                  ["get", "class"],
                  "ocean",
                  4,
                  "sea",
                  5,
                  ["bay", "water"],
                  7,
                  10
              ]
          },
          "paint": {
              "text-color": [
                  "match",
                  ["get", "class"],
                  ["bay", "ocean", "sea"],
                  "hsl(205, 65%, 70%)",
                  "hsl(205, 37%, 57%)"
              ]
          }
      },
      {
          "id": "poi-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "point-of-interest-labels",
              "mapbox:group": "Point of interest labels, poi-labels"
          },
          "source": "composite",
          "source-layer": "poi_label",
          "minzoom": 6,
          "filter": [
              "<=",
              ["get", "filterrank"],
              ["+", ["step", ["zoom"], 0, 16, 1, 17, 2], 2]
          ],
          "layout": {
              "text-size": [
                  "step",
                  ["zoom"],
                  ["step", ["get", "sizerank"], 18, 5, 12],
                  17,
                  ["step", ["get", "sizerank"], 18, 13, 12]
              ],
              "icon-image": [
                  "case",
                  ["has", "maki_beta"],
                  [
                      "coalesce",
                      ["image", ["get", "maki_beta"]],
                      ["image", ["get", "maki"]]
                  ],
                  ["image", ["get", "maki"]]
              ],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "text-offset": [
                  "step",
                  ["zoom"],
                  [
                      "step",
                      ["get", "sizerank"],
                      ["literal", [0, 0]],
                      5,
                      ["literal", [0, 0.75]]
                  ],
                  17,
                  [
                      "step",
                      ["get", "sizerank"],
                      ["literal", [0, 0]],
                      13,
                      ["literal", [0, 0.75]]
                  ]
              ],
              "text-anchor": [
                  "step",
                  ["zoom"],
                  ["step", ["get", "sizerank"], "center", 5, "top"],
                  17,
                  ["step", ["get", "sizerank"], "center", 13, "top"]
              ],
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]]
          },
          "paint": {
              "icon-opacity": [
                  "step",
                  ["zoom"],
                  ["step", ["get", "sizerank"], 0, 5, 1],
                  17,
                  ["step", ["get", "sizerank"], 0, 13, 1]
              ],
              "text-halo-color": [
                  "match",
                  ["get", "class"],
                  "park_like",
                  "hsl(78, 70%, 100%)",
                  "medical",
                  "hsl(3, 43%, 100%)",
                  "hsl(40, 15%, 100%)"
              ],
              "text-halo-width": 0.5,
              "text-halo-blur": 0.5,
              "text-color": [
                  "step",
                  ["zoom"],
                  [
                      "step",
                      ["get", "sizerank"],
                      [
                          "match",
                          ["get", "class"],
                          "food_and_drink",
                          "hsl(20, 42%, 58%)",
                          "park_like",
                          "hsl(76, 51%, 26%)",
                          "medical",
                          "hsl(3, 18%, 55%)",
                          "hsl(26, 30%, 45%)"
                      ],
                      5,
                      [
                          "match",
                          ["get", "class"],
                          "food_and_drink",
                          "hsl(20, 74%, 41%)",
                          "park_like",
                          "hsl(76, 50%, 15%)",
                          "medical",
                          "hsl(3, 24%, 45%)",
                          "hsl(26, 35%, 35%)"
                      ]
                  ],
                  17,
                  [
                      "step",
                      ["get", "sizerank"],
                      [
                          "match",
                          ["get", "class"],
                          "food_and_drink",
                          "hsl(20, 42%, 58%)",
                          "park_like",
                          "hsl(76, 51%, 26%)",
                          "medical",
                          "hsl(3, 18%, 55%)",
                          "hsl(26, 30%, 45%)"
                      ],
                      13,
                      [
                          "match",
                          ["get", "class"],
                          "food_and_drink",
                          "hsl(20, 74%, 41%)",
                          "park_like",
                          "hsl(76, 50%, 15%)",
                          "medical",
                          "hsl(3, 24%, 45%)",
                          "hsl(26, 35%, 35%)"
                      ]
                  ]
              ]
          }
      },
      {
          "id": "airport-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "transit",
              "mapbox:group": "Transit, transit-labels"
          },
          "source": "composite",
          "source-layer": "airport_label",
          "minzoom": 8,
          "filter": [
              "match",
              ["get", "class"],
              ["military", "civil"],
              ["match", ["get", "worldview"], ["all", "US"], true, false],
              ["disputed_military", "disputed_civil"],
              [
                  "all",
                  ["==", ["get", "disputed"], "true"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false]
              ],
              false
          ],
          "layout": {
              "text-line-height": 1.1,
              "text-size": ["step", ["get", "sizerank"], 18, 9, 12],
              "icon-image": ["get", "maki"],
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "text-offset": [0, 0.75],
              "text-rotation-alignment": "viewport",
              "text-anchor": "top",
              "text-field": [
                  "step",
                  ["get", "sizerank"],
                  ["coalesce", ["get", "name_en"], ["get", "name"]],
                  15,
                  ["get", "ref"]
              ],
              "text-letter-spacing": 0.01,
              "text-max-width": 9
          },
          "paint": {
              "text-color": "hsl(225, 4%, 40%)",
              "text-halo-color": "hsl(225, 30%, 100%)",
              "text-halo-width": 1
          }
      },
      {
          "id": "settlement-subdivision-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "place-labels",
              "mapbox:group": "Place labels, place-labels"
          },
          "source": "composite",
          "source-layer": "place_label",
          "minzoom": 10,
          "maxzoom": 15,
          "filter": [
              "all",
              [
                  "match",
                  ["get", "class"],
                  "settlement_subdivision",
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  "disputed_settlement_subdivision",
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              ["<=", ["get", "filterrank"], 3]
          ],
          "layout": {
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-transform": "uppercase",
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "text-letter-spacing": [
                  "match",
                  ["get", "type"],
                  "suburb",
                  0.15,
                  0.1
              ],
              "text-max-width": 7,
              "text-padding": 3,
              "text-size": [
                  "interpolate",
                  ["cubic-bezier", 0.5, 0, 1, 1],
                  ["zoom"],
                  11,
                  ["match", ["get", "type"], "suburb", 11, 10.5],
                  15,
                  ["match", ["get", "type"], "suburb", 15, 14]
              ]
          },
          "paint": {
              "text-halo-color": "hsla(40, 15%, 100%, 0.75)",
              "text-halo-width": 1,
              "text-color": "hsl(0, 0%, 27%)",
              "text-halo-blur": 0.5
          }
      },
      {
          "id": "settlement-minor-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "place-labels",
              "mapbox:group": "Place labels, place-labels"
          },
          "source": "composite",
          "source-layer": "place_label",
          "minzoom": 3,
          "maxzoom": 13,
          "filter": [
              "all",
              ["<=", ["get", "filterrank"], 3],
              [
                  "match",
                  ["get", "class"],
                  "settlement",
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  "disputed_settlement",
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              [
                  "step",
                  ["zoom"],
                  [">", ["get", "symbolrank"], 6],
                  4,
                  [">=", ["get", "symbolrank"], 7],
                  6,
                  [">=", ["get", "symbolrank"], 8],
                  7,
                  [">=", ["get", "symbolrank"], 10],
                  10,
                  [">=", ["get", "symbolrank"], 11],
                  11,
                  [">=", ["get", "symbolrank"], 13],
                  12,
                  [">=", ["get", "symbolrank"], 15]
              ]
          ],
          "layout": {
              "icon-image": "",
              "text-font": ["DIN Pro Regular", "Arial Unicode MS Regular"],
              "text-radial-offset": [
                  "step",
                  ["zoom"],
                  ["match", ["get", "capital"], 2, 0.6, 0.55],
                  8,
                  0
              ],
              "text-anchor": ["step", ["zoom"], "center", 8, "center"],
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-max-width": 7,
              "text-line-height": 1.1,
              "text-size": [
                  "interpolate",
                  ["cubic-bezier", 0.2, 0, 0.9, 1],
                  ["zoom"],
                  3,
                  [
                      "step",
                      ["get", "symbolrank"],
                      12,
                      9,
                      11,
                      10,
                      10.5,
                      12,
                      9.5,
                      14,
                      8.5,
                      16,
                      6.5,
                      17,
                      4
                  ],
                  13,
                  [
                      "step",
                      ["get", "symbolrank"],
                      23,
                      9,
                      21,
                      10,
                      19,
                      11,
                      17,
                      12,
                      16,
                      13,
                      15,
                      15,
                      13
                  ]
              ]
          },
          "paint": {
              "text-color": "hsl(0, 0%, 0%)",
              "text-halo-color": "hsl(40, 15%, 100%)",
              "text-halo-width": 1,
              "icon-opacity": ["step", ["zoom"], 1, 8, 0],
              "text-halo-blur": 1
          }
      },
      {
          "id": "settlement-major-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "place-labels",
              "mapbox:group": "Place labels, place-labels"
          },
          "source": "composite",
          "source-layer": "place_label",
          "minzoom": 3,
          "maxzoom": 15,
          "filter": [
              "all",
              ["<=", ["get", "filterrank"], 3],
              [
                  "match",
                  ["get", "class"],
                  "settlement",
                  ["match", ["get", "worldview"], ["all", "US"], true, false],
                  "disputed_settlement",
                  [
                      "all",
                      ["==", ["get", "disputed"], "true"],
                      [
                          "match",
                          ["get", "worldview"],
                          ["all", "US"],
                          true,
                          false
                      ]
                  ],
                  false
              ],
              [
                  "step",
                  ["zoom"],
                  false,
                  3,
                  ["<=", ["get", "symbolrank"], 6],
                  4,
                  ["<", ["get", "symbolrank"], 7],
                  6,
                  ["<", ["get", "symbolrank"], 8],
                  7,
                  ["<", ["get", "symbolrank"], 10],
                  10,
                  ["<", ["get", "symbolrank"], 11],
                  11,
                  ["<", ["get", "symbolrank"], 13],
                  12,
                  ["<", ["get", "symbolrank"], 15],
                  13,
                  [">=", ["get", "symbolrank"], 11],
                  14,
                  [">=", ["get", "symbolrank"], 15]
              ]
          ],
          "layout": {
              "icon-image": "",
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "text-radial-offset": [
                  "step",
                  ["zoom"],
                  ["match", ["get", "capital"], 2, 0.6, 0.55],
                  8,
                  0
              ],
              "text-anchor": ["step", ["zoom"], "center", 8, "center"],
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-max-width": 7,
              "text-line-height": 1.1,
              "text-size": [
                  "interpolate",
                  ["cubic-bezier", 0.2, 0, 0.9, 1],
                  ["zoom"],
                  3,
                  ["step", ["get", "symbolrank"], 13, 6, 12],
                  6,
                  ["step", ["get", "symbolrank"], 16, 6, 15, 7, 14],
                  8,
                  ["step", ["get", "symbolrank"], 18, 9, 17, 10, 15],
                  15,
                  [
                      "step",
                      ["get", "symbolrank"],
                      23,
                      9,
                      22,
                      10,
                      20,
                      11,
                      18,
                      12,
                      16,
                      13,
                      15,
                      15,
                      13
                  ]
              ]
          },
          "paint": {
              "text-color": "hsl(0, 0%, 0%)",
              "text-halo-color": "hsl(40, 15%, 100%)",
              "text-halo-width": 1,
              "icon-opacity": ["step", ["zoom"], 1, 8, 0],
              "text-halo-blur": 1
          }
      },
      {
          "id": "state-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "place-labels",
              "mapbox:group": "Place labels, place-labels"
          },
          "source": "composite",
          "source-layer": "place_label",
          "minzoom": 3,
          "maxzoom": 9,
          "filter": [
              "match",
              ["get", "class"],
              "state",
              ["match", ["get", "worldview"], ["all", "US"], true, false],
              "disputed_state",
              [
                  "all",
                  ["==", ["get", "disputed"], "true"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false]
              ],
              false
          ],
          "layout": {
              "text-size": [
                  "interpolate",
                  ["cubic-bezier", 0.85, 0.7, 0.65, 1],
                  ["zoom"],
                  4,
                  ["step", ["get", "symbolrank"], 10, 6, 9.5, 7, 9],
                  9,
                  ["step", ["get", "symbolrank"], 21, 6, 16, 7, 13]
              ],
              "text-transform": "uppercase",
              "text-font": ["DIN Pro Bold", "Arial Unicode MS Bold"],
              "text-field": [
                  "step",
                  ["zoom"],
                  [
                      "step",
                      ["get", "symbolrank"],
                      ["coalesce", ["get", "name_en"], ["get", "name"]],
                      5,
                      [
                          "coalesce",
                          ["get", "abbr"],
                          ["get", "name_en"],
                          ["get", "name"]
                      ]
                  ],
                  5,
                  ["coalesce", ["get", "name_en"], ["get", "name"]]
              ],
              "text-letter-spacing": 0.15,
              "text-max-width": 6
          },
          "paint": {
              "text-color": "hsl(0, 0%, 0%)",
              "text-halo-color": "hsl(40, 15%, 100%)",
              "text-halo-width": 1
          }
      },
      {
          "id": "country-label",
          "type": "symbol",
          "metadata": {
              "mapbox:featureComponent": "place-labels",
              "mapbox:group": "Place labels, place-labels"
          },
          "source": "composite",
          "source-layer": "place_label",
          "minzoom": 1,
          "maxzoom": 10,
          "filter": [
              "match",
              ["get", "class"],
              "country",
              ["match", ["get", "worldview"], ["all", "US"], true, false],
              "disputed_country",
              [
                  "all",
                  ["==", ["get", "disputed"], "true"],
                  ["match", ["get", "worldview"], ["all", "US"], true, false]
              ],
              false
          ],
          "layout": {
              "icon-image": "",
              "text-field": ["coalesce", ["get", "name_en"], ["get", "name"]],
              "text-line-height": 1.1,
              "text-max-width": 6,
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
              "text-radial-offset": ["step", ["zoom"], 0.6, 8, 0],
              "text-size": [
                  "interpolate",
                  ["cubic-bezier", 0.2, 0, 0.7, 1],
                  ["zoom"],
                  1,
                  ["step", ["get", "symbolrank"], 11, 4, 9, 5, 8],
                  9,
                  ["step", ["get", "symbolrank"], 22, 4, 19, 5, 17]
              ]
          },
          "paint": {
              "icon-opacity": [
                  "step",
                  ["zoom"],
                  ["case", ["has", "text_anchor"], 1, 0],
                  7,
                  0
              ],
              "text-color": "hsl(0, 0%, 0%)",
              "text-halo-color": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  2,
                  "hsla(40, 15%, 100%, 0.75)",
                  3,
                  "hsl(40, 15%, 100%)"
              ],
              "text-halo-width": 1.25
          }
      }
  ],
  "created": "2022-10-07T20:32:58.385Z",
  "modified": "2022-10-07T20:32:58.385Z",
  "id": "cl8yy2i2c000014lk0s7mnr7e",
  "owner": "bartwr",
  "visibility": "private",
  "protected": false,
  "draft": false
}

export default base;
