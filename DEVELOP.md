# Developing the Dashboard Deelmobiliteit app

Interested in developing this app further?

In this document you find all the information you need.

## How to start

If you only want to run the frontend app, just run `npm install && npm start` as described in [README.md](./README.md).

If you want to run the full Dashboard Deelmobiliteit app on your local machine, you need to run multiple projects at the same time:

- [dashboarddeelmobiliteit-app](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app) - De frontend app that runs in the browser
- [dashboard-api](https://gitlab.com/bikedashboard/dashboard-api) - The API that returns data you ask for
- [go-import-vehicles](https://gitlab.com/bikedashboard/go-import-vehicles) - The data feed importer that requests provider data every 30s
- [importer](https://gitlab.com/bikedashboard/importer) - The old data feed importer
- [microhubs-importer](https://gitlab.com/bikedashboard/microhubs-controller) - Script that counts vehicles in microhubs and auto opens/closes microhubs
- [zone-stats-aggregator](https://gitlab.com/bikedashboard/zone-stats-aggregator) - Script that creates aggregated data for vehicles & rentals

You do not always have to run all tools at the same time. For example, if you only want to develop the frontend app, you only need `dashboarddeelmobiliteit-app`. If you only want to get MDS- or GBFS-feeds you only need `go-import-vehicles`. If you do have raw data and want to aggregate it for quick analysis, you can run `zone-stats-aggregator`.

## Isochrones

In the app there's an isochrones viewer. To be able to calculate isochrones, we use an external server running openrouteservice.

### Where is openrouteservice hosted?

root@65.108.103.58 (server running openrouteservice)

### Example calls

```
curl -X "POST" "https://ors.dashboarddeelmobiliteit.nl/v2/isochrones/foot-walking" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "range": [
    60,
    120,
    180,
    300
  ],
  "locations": [
    [
      4.454877,
      "51.907671"
    ]
  ],
  "range_type": "time"
}'
```

```
curl -X "POST" "https://ors.dashboarddeelmobiliteit.nl/v2/isochrones/foot-walking" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "range": [
    60,
    120,
    180,
    300
  ],
  "range_type": "time",
  "locations": [
    [
      4.454877,
      51.907671
    ],
    [
      4.457664232125704,
      51.90899808235536
    ]
  ],
  "intersections": false
}'
```

And we can even do it for bikes:

```
curl -X "POST" "https://ors.dashboarddeelmobiliteit.nl/v2/isochrones/cycling-regular" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "range": [
    60,
    120,
    180,
    300
  ],
  "range_type": "time",
  "locations": [
    [
      4.454877,
      51.907671
    ],
    [
      4.457664232125704,
      51.90899808235536
    ]
  ],
  "intersections": false
}'
```

## Aggregated rental data API call

Example of aggregated rental data API call:

```bash
curl --location --request GET 'https://api.deelfietsdashboard.nl/dashboard-api/stats_v2/rental_stats?zone_ids=51802&aggregation_level=hour&start_time=2022-12-06T20:00:00&end_time=2022-12-06T23:00:00' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--header 'Authorization: Bearer TOKEN'
```

## HB matrices

### HB matrices for H3 grid areas

``` bash
curl --location 'https://api.deelfietsdashboard.nl/od-api/destinations/h3?h3_resolution=7&end_date=2023-02-06&start_date=2023-01-05&time_periods=2-6&days_of_week=fr%2Csa%2Csu&origin_cells=87196bb51ffffff' \
--header 'authorization: Bearer TOKEN'
```

### HB matrices for municipality zones

```bash
curl --location 'https://api.deelfietsdashboard.nl/od-api/origins/geometry?end_date=2022-02-06&start_date=2022-01-05&destination_stat_refs=cbs%3AWK059901' \
--header 'authorization: Bearer TOKEN'
```
Everything's the same as for H3 grid HB matrices, apart from:

- We use the endpoint `/origins/geometry` instead of `/origins/h3`
- Key `destination_stat_refs` is used instead of `destination_cells`

## Bulk import KML files

Start importing KML file:

    curl --location 'https://mds.dashboarddeelmobiliteit.nl/admin/kml/pre_import?municipality=GM0014' \
    --header 'Authorization: Bearer TOKEN' \
    --form 'file=@"/path/to/Hubs_fiets-1.kml"'

Parameters:

- <municipality> De gemeente waar je deze data voor wil uploaden
- --form =file   Het KML-bestand dat je wil uploaden

Example result:

    [
        {
            "is_within_borders_municipality": true,
            "zone": {
                "zone_id": null,
                "area": {
                    "type": "Feature",
                    "geometry": {
                        "coordinates": [
                            [
                                [
                                    6.652729,
                                    53.232254
                                ],
                                [
                                    6.652733,
                                    53.232217
                                ],
                                [
                                    6.652739,
                                    53.232146
                                ],
                                [
                                    6.652872,
                                    53.232151
                                ],
                                [
                                    6.653257,
                                    53.232164
                                ],
                                [
                                    6.65334,
                                    53.232167
                                ],
                                [
                                    6.653329,
                                    53.232275
                                ],
                                [
                                    6.652729,
                                    53.232254
                                ]
                            ]
                        ],
                        "type": "Polygon"
                    },
                    "properties": {},
                    "id": null,
                    "bbox": null
                },
                "name": "174,144407642542",
                "municipality": "GM0014",
                "geography_id": "15f5a414-d2e8-11ed-911e-2ae14e3a52cb",
                "description": "174,144407642542",
                "geography_type": "monitoring",
                "effective_date": "2023-04-04T12:56:16.101974+00:00",
                "published_date": "2023-04-04T12:56:16.102013+00:00",
                "retire_date": null,
                "stop": null,
                "no_parking": null,
                "published": false
            }
        },
        {
            "is_within_borders_municipality": true,
            "zone": {
                "zone_id": null,
                "area": {
                    "type": "Feature",
                    "geometry": {
                        "coordinates": [
                            [
                                [
                                    6.651772,
                                    53.231588
                                ],
                                [
                                    6.65191,
                                    53.231607
                                ],
                                [
                                    6.651899,
                                    53.231635
                                ],
                                [
                                    6.651761,
                                    53.231615
                                ],
                                [
                                    6.651772,
                                    53.231588
                                ]
                            ]
                        ],
                        "type": "Polygon"
                    },
                    "properties": {},
                    "id": null,
                    "bbox": null
                },
                "name": "42,0319917550024",
                "municipality": "GM0014",
                "geography_id": "15f64270-d2e8-11ed-911e-2ae14e3a52cb",
                "description": "42,0319917550024",
                "geography_type": "monitoring",
                "effective_date": "2023-04-04T12:56:16.106022+00:00",
                "published_date": "2023-04-04T12:56:16.106061+00:00",
                "retire_date": null,
                "stop": null,
                "no_parking": null,
                "published": false
            }
        },
        ...

Bovenstaand zie je zone-objecten met daarboven een container die aangeeft of de zone binnen of buiten de gemeentegrenzen ligt. Als de zone de gemeentegrens ligt moet er een waarschuwing komen, en moet de zone standaard uitgevinkt zijn.

Do bulk import after checking if everything is right:

    curl -X "POST" "https://mds.dashboarddeelmobiliteit.nl/admin/bulk_insert_zones" \
         -H 'Authorization: Bearer TOKEN' \
         -H 'Content-Type: application/json; charset=utf-8' \
         -d $'[
      {
        "published": true,
        "geography_type": "monitoring",
        "area": {
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  4.45236,
                  51.90422
                ],
                [
                  4.44233,
                  51.91682
                ],
                [
                  4.45847,
                  51.91919
                ],
                [
                  4.45236,
                  51.90422
                ]
              ]
            ]
          }
        },
        "name": "Test zone1",
        "municipality": "GM0599",
        "description": "Een test analyse zone"
      },
      {
        "description": "174,144407642542",
        "municipality": "GM0014",
        "geography_id": "c1c5ca6c-d2d9-11ed-b5ed-8c859049551b",
        "stop": null,
        "zone_id": null,
        "geography_type": "monitoring",
        "retire_date": null,
        "area": {
          "properties": {},
          "id": null,
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  6.652729,
                  53.232254
                ],
                [
                  6.652733,
                  53.232217
                ],
                [
                  6.652739,
                  53.232146
                ],
                [
                  6.652872,
                  53.232151
                ],
                [
                  6.653257,
                  53.232164
                ],
                [
                  6.65334,
                  53.232167
                ],
                [
                  6.653329,
                  53.232275
                ],
                [
                  6.652729,
                  53.232254
                ]
              ]
            ]
          },
          "bbox": null
        },
        "no_parking": null,
        "published": false,
        "effective_date": "2023-04-04T13:13:41.905498+02:00",
        "published_date": "2023-04-04T13:13:41.905518+02:00",
        "name": "174,144407642542"
      },
      {
        "description": "42,0319917550024",
        "municipality": "GM0014",
        "geography_id": "51386f72-d2e1-11ed-919d-8c859049551b",
        "stop": null,
        "zone_id": null,
        "geography_type": "monitoring",
        "retire_date": null,
        "area": {
          "properties": {},
          "id": null,
          "type": "Feature",
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  6.651772,
                  53.231588
                ],
                [
                  6.65191,
                  53.231607
                ],
                [
                  6.651899,
                  53.231635
                ],
                [
                  6.651761,
                  53.231615
                ],
                [
                  6.651772,
                  53.231588
                ]
              ]
            ]
          },
          "bbox": null
        },
        "no_parking": null,
        "published": false,
        "effective_date": "2023-04-04T14:07:49.048136+02:00",
        "published_date": "2023-04-04T14:07:49.048159+02:00",
        "name": "42,0319917550024"
      }
    ]'

geography_id's zijn daarmee al opgeslagen. Als importeren van een van de zones faalt, faalt alles.
