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

You do not always have to run all tools at the same time. For example, if you only want to develop the frontend app, you only need `dashboarddeelmobiliteit-app`. If you only want to get MDS-, GBFS- or TOMP-feeds you only need `go-import-vehicles`. If you do have raw data and want to aggregate it for quick analysis, you can run `zone-stats-aggregator`.

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
