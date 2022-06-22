## Isochrones

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
