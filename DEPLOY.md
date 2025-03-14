# DEPLOY

Deployment instructions for the Dashboard Deelmobiliteit app.

## Deploy new 'front' app, deelfietsdashboard:

### 1. Build Docker container

Login:

    docker login registry.gitlab.com

Find latest tag, and increment:

- Go to https://gitlab.com/bikedashboard/front/container_registry
- If latest tag was 1.17.1, increment the version number to i.e. 1.17.2 or 1.18.0.

Build new Docker container and add tag:

    docker build -t registry.gitlab.com/bikedashboard/front:1.17.2 .

Push Docker container:

    docker push registry.gitlab.com/bikedashboard/front:1.17.2

### 2. Login on Kubernetes server

- Go to https://cloud.digitalocean.com/kubernetes/clusters?i=285f00
- Go to https://cloud.digitalocean.com/kubernetes/clusters/2c9d4c5d-a535-49ff-9d90-61a0ae272d52?i=285f00
- Click "Connecting to Kubernetes"
- `sudo snap install doctl`
- `doctl auth init`
- Go to https://cloud.digitalocean.com/account/api/tokens?i=285f00 to create a new token
- Copy token
- Paste token in terminal.
- `doctl kubernetes cluster kubeconfig save 2c9d4c5d-a535-49ff-9d90-61a0ae272d52`

- `sudo snap install kubectl`
- `kubectl get deployments`
- `kubectl edit deployment dashboard-front`

- Update version number.
- Save

- `kubectl get pods` to see that new one is deploying

## Deploy new API

### 1. New API deployment

- `docker login registry.gitlab.com`
- `docker build -t registry.gitlab.com/bikedashboard/dashboard-api:1.8.3 .`
- `docker push registry.gitlab.com/bikedashboard/dashboard-api:1.8.3`
- `kubectl edit deployment dashboard-api`
- `Update version number & save`
- `kubectl get pods` - to see that new one is deploying

## Explore database

### Using terminal

    ssh root@167.99.219.233
    su - postgres
    psql -d deelfietsdashboard
    SELECT * FROM park_events LIMIT 10;
    [escape]
    \q

### Using a GUI like postbird

NOTES:
- The internal IP address of the running database is 10.133.75.95.
- Database `deelfietsdashboard` is the production database
- Database `deelfietsdashboard3` is the development database

1. Link remote database to local port

    ssh root@167.99.219.233 -L 5431:10.133.75.95:5432

2. Open postbird (a postgresql GUI)

3. Connect to:
- Host: localhost
- Port: 5431
- Username: deelfietsdashboard
- Database: deelfietsdashboard

## FAQ

### How to see logs?

On localhost, check logs like this:

    kubectl get pods
    kubectl logs go-import-bikes-8585584b88-vjqpj -f

To see logs just before the latest crash:

    kubectl logs go-import-bikes-8585584b88-vjqpj -p

### What different pods are running?

Explanation of all pods:

- daf-api-7597569ffc-9pxtf <= de DAF API gebruikt in het dashboard
- daf-input-api-75564f94ff-hkfnt <= de DAF API waar externe partijen data (PerfectView) naar sturen
- kindly-toad-kong-86b8c859d9-z9595 <= API proxy (voor authenticatie)
- kindly-toad-postgresql-0 <= API proxy database
- webhook-demo-578785cbdf-bxffq <= was een voorbeeld voor DAF (Telegram bot), wordt niet meer gebruikt

### What to do if a pod is broken?

If -in example- the API pod is 'broken', run this:

    kubectl delete pod <pod id>

The pod gets destroyed and restarts automatically.

## Export raw data manually

    ssh root@auth.deelfietsdashboard.nl
    su - postgres

Export trips (change variables first) ->

    psql deelfietsdashboard -c "
    COPY (SELECT *, st_y(start_location) as start_location_latitude, st_x(start_location) as start_location_longitude,
    st_y(end_location) as end_location_latitude, st_x(end_location) as end_location_longitude,
    ST_WITHIN(start_location,
    (
     select area from zones where zone_id = 34236
    )) as start_location_in_filtered_zone,
    ST_WITHIN(end_location,
    (
     select area from zones where zone_id = 34236
    )) as end_location_in_filtered_zone
    FROM trips
    WHERE (ST_WITHIN(start_location,
    (
     select area from zones where zone_id = 34236
    )) or 
    ST_WITHIN(end_location,
    (
     select area from zones where zone_id = 34236
    ))
    ) 
    AND start_time >= '2021-09-01' and start_time < '2021-10-01') TO STDOUT CSV HEADER" > 20220404_export_trips_Schiedam__kelt.csv

Export park events (change variables first) ->

    psql deelfietsdashboard -c "
    COPY (SELECT *, st_y(location) as latitude, st_x(location) as longitude
    FROM park_events
    WHERE ST_WITHIN(location,
    (
     select area from zones where zone_id = 34236
    )) AND start_time >= '2021-09-01' and start_time < '2021-10-01') TO STDOUT CSV HEADER" > 20220404_export_parked_Schiedam__kelt.csv

From localhost, copy the files over to your local machine:

    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_trips_Barendrecht__kelt.csv ~/tmp
    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_parked_Barendrecht__kelt.csv ~/tmp

    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_trips_Albrandswaard__kelt.csv ~/tmp
    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_parked_Albrandswaard__kelt.csv ~/tmp

    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_trips_Ridderkerk__kelt.csv ~/tmp
    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_parked_Ridderkerk__kelt.csv ~/tmp

    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_trips_Schiedam__kelt.csv ~/tmp
    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/20220404_export_parked_Schiedam__kelt.csv ~/tmp

## Backup database

    sudo su - postgres
    pg_dump -U postgres -c -f backup_2022-04-25.sql deelfietsdashboard

en dan op localhost:

    rsync root@auth.deelfietsdashboard.nl:/var/lib/postgresql/backup_2022-04-25.sql ~/tmp
