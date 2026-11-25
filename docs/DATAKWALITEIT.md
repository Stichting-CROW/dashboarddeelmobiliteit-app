# Datakwaliteit page

The `/stats/datakwaliteit` page shows the data quality of every operator's feeds, so users can see whether issues need solving and which data to exclude from analyses. See [issue #266](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/266).

## What the page shows

One card per operator that is active in the selected municipality (or in all of The Netherlands). Each card has:

- **Aanbod / Verhuringen / Servicegebieden feed beschikbaar**: the latest 5-minute check, plus the availability percentage and the outages in the period. Colors:
  - green: online (reachable and has data)
  - red: offline (unreachable or empty)
  - red "Afgekeurd": at least one manual rejection for this data type overlaps the selected period. This overrides the feed status. A subtitle under the indicator name shows the rejected period (or the number of periods). Clicking the pill opens a popover with the details of each rejection, including edit and delete buttons for admins.
  - grey: "Geen feed verwacht" (the operator doesn't offer this feed) or "Onbekend" (no check yet)
- **Rejection list**: every rejection that overlaps the period, with the period, operator(s), area, vehicle type, data type, issue owner, note, and who created or last changed it.
- **Timeline**: one lane per feed with outages in red, and one lane with manual-rejection windows (hatched). The part of the period that lies in the future is grey.

Cards with issues are shown first. Operator accounts only see their own card.

Filters (left filter bar):

- **Periode**: `start_date` / `end_date` URL params (both inclusive). The default is the last 7 days including today.
- **Plaats**: `filter.gebied` / `gm_code`. Hidden for operator accounts and for accounts with a single municipality.

Admins (`isAdmin(state)`) can add, edit and delete manual rejections. One rejection can cover several operators or all of them, for example when Dashboard Deelmobiliteit itself had an outage. All visible rejections can be exported as CSV.

## Datakwaliteit on Prestaties aanbieders

Every card on `/stats/prestaties-aanbieders` has a "Datakwaliteit" row below the other KPIs. Like those KPIs, it shows one block per day for periods of up to 7 days, and a bar for longer periods. Per day:

- red: an expected feed (aanbod, verhuringen or servicegebieden) had an outage that day, or a manual rejection applies to the card's operator, municipality and vehicle type (any data type).
- green: no outages or rejections, and at least one feed has been checked.
- white: the day is in the future, or none of the operator's feeds has been checked yet.

Feeds with status `not_expected` are ignored. The block tooltip lists the status and outage times per feed, plus any rejections. The bar tooltip shows the number of days with and without issues, the availability per feed and the number of rejections.

The page fetches data quality once (`useDataQualityData`) and shares it with the cards through `DataQualityProvider`. The municipality view uses the selected municipality. The operator view fetches for all of NL, because its cards cover several municipalities. The row is hidden while loading, after an error, and for operators without data quality data. It does not affect the card's overall compliance or sort order.

## Code

| Path | Purpose |
|------|---------|
| `src/pages/dashboard/DashboardDatakwaliteit.tsx` | Page |
| `src/components/Filterbar/FilterbarDatakwaliteit.tsx` | Filter bar |
| `src/components/Datakwaliteit/useDataQualityData.ts` | Fetching, demo fallback, create/update/delete |
| `src/components/Datakwaliteit/dataQualityUtils.ts` | Pure helpers (period math, filtering, timeline, CSV, validation) |
| `src/components/Datakwaliteit/dataQualityDemoData.ts` | Deterministic demo data |
| `src/components/Datakwaliteit/DataQualityCard.tsx`, `DataQualityTimeline.tsx`, `ManualRejectionDialog.tsx` | UI |
| `src/components/Datakwaliteit/DataQualityContext.tsx`, `DataQualityKpi.tsx` | "Datakwaliteit" row on Prestaties aanbieders cards |
| `src/api/dataQuality.ts`, `src/types/DataQuality.ts` | API client and types |

## Demo mode

With `REACT_APP_DEMO_MODE=true`, the page shows dummy data when the API returns no data, fails, or the user is not logged in. Operator names and colors are anonymized like on Prestaties aanbieders. Demo data is anchored to the current time, so changing the period or municipality changes what you see. Changes made in the dialog are kept in memory only.

## API contract (backend to be built)

Base URL: `${REACT_APP_MAIN_API_URL}/dashboard-api/data_quality`. All requests use `authorization: Bearer <token>`.

### `GET /feed_status?gm_code=&start_date=&end_date=`

Returns `FeedAvailability[]`: one item per operator and data type.

```ts
{
  system_id: string;
  data_type: 'aanbod' | 'verhuringen' | 'servicegebieden';
  status: 'available' | 'unavailable' | 'not_expected' | 'unknown';
  last_checked_at: string | null;        // ISO datetime
  last_data_received_at: string | null;  // ISO datetime
  availability_pct: number | null;       // 0-100, share of checks in the period that passed
  outages: { start_time: string; end_time: string | null }[]; // overlapping the period; null = ongoing
}
```

- With `gm_code`: only operators active in that municipality during the period (they had vehicles or rentals there). Without `gm_code`: all operators in NL.
- Operator accounts only receive their own `system_id`.
- `start_date` / `end_date` are `YYYY-MM-DD`, both inclusive.

### `GET /rejections?gm_code=&start_date=&end_date=`

Returns `ManualRejection[]` that overlap the period and whose `municipalities` is `'all'` or contains `gm_code`.

```ts
{
  rejection_id: number;
  system_ids: string[] | 'all';
  start_time: string;            // ISO datetime
  end_time: string | null;       // null = ongoing
  municipalities: string[] | 'all';  // gm_codes
  vehicle_types: string[] | 'all';   // form_factor ids, e.g. 'bicycle', 'moped'
  data_types: ('aanbod' | 'verhuringen' | 'servicegebieden')[];
  issue_owner: 'operator' | 'dashboard_deelmobiliteit';
  note: string;
  created_by: string;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
}
```

All logged-in users may read rejections, including notes. Operator accounts should only receive rejections that apply to their own `system_id` (directly or via `'all'`).

### `POST /rejections`, `PUT /rejections/{id}`, `DELETE /rejections/{id}`

Admin only. The body for POST and PUT is a `ManualRejection` without `rejection_id` and the audit fields. The backend sets `created_by`/`created_at` and `updated_by`/`updated_at` from the token. POST and PUT return the saved `ManualRejection`; DELETE returns any 2xx.

### Feed checker

Every 5 minutes, per feed, check whether the feed is reachable and contains data, and store the result (see [Data model](#data-model-proposal)). `availability_pct` and `outages` are derived from the stored results. An operator without a feed for a data type must report `not_expected`, not `unavailable`.

## Data model (proposal)

The tables belong in the main database, next to `feeds` (schema in `dd-importer-v2/sql/main_model.sql`). Manual rejections are stored the same way in both options. The options differ in how feed availability is stored.

What exists today:

- `feeds`: one row per feed. An operator can have several feeds. Each feed delivers one kind of data, stored in `feeds.data_type` (see below).
- `feed_downtime`: outage intervals per feed. The feed monitor (`dd-importer-v2/monitor/feed_monitor.go`) writes them every minute when `feeds.last_time_succesfully_imported` is more than 5 minutes old. It only covers vehicle feeds. For those, a successful import already means "reachable and at least one vehicle".
- `feed_status` and `feed_status_logs`: defined in the schema, but no code in `dd-importer-v2` or `dashboard-api` reads or writes them.

### `feeds.data_type` (built)

Branch `feature/feeds-data-type` in `dd-importer-v2` and `dashboard-api`.

```sql
CREATE TYPE feed_data_type AS ENUM ('vehicles', 'trips', 'service_areas');
ALTER TABLE feeds ADD COLUMN data_type feed_data_type NOT NULL DEFAULT 'vehicles';
```

Every feed row delivers exactly one kind of data. This replaces the `import_vehicles` and `import_service_area` flags and the convention that a trips feed is recognised by `feed_type`. Because a `feed_id` now implies a data type, `feed_downtime` and any other table that refers to `feed_id` needs no data type column of its own.

The database uses English values, like the rest of the schema. The API maps them to the values in the contract above.

| Database (`feeds.data_type`) | API (`data_type`) |
|------------------------------|-------------------|
| `vehicles` | `aanbod` |
| `trips` | `verhuringen` |
| `service_areas` | `servicegebieden` |

The migration runs in two steps, both in `dd-importer-v2/sql/migrations/`:

1. `20261125_add_data_type_to_feeds.sql` adds the column and converts the existing rows. A feed with both flags on is split into two rows: the existing row keeps its `feed_id` and becomes `vehicles`, a new row becomes `service_areas`. `import_vehicles` and `import_service_area` stay readable, derived from `data_type`, so services that are not updated yet keep working.
2. `20261125_drop_feed_import_flags.sql` removes the two flags. Run it after the importer, service area importer, feed monitor and dashboard API are deployed from the branch.

What reads `data_type` now: the vehicle importer, the trip importer, the service area importer, the feed monitor and `/public/active_feeds` in the dashboard API.

### Manual rejections (both options)

```sql
CREATE TABLE data_quality_rejection (
    rejection_id   INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    start_time     TIMESTAMPTZ NOT NULL,
    end_time       TIMESTAMPTZ,                       -- NULL = ongoing
    system_ids     VARCHAR(255)[],                    -- NULL = all operators
    municipalities VARCHAR(255)[],                    -- gm_codes; NULL = all of NL
    modalities     VARCHAR(255)[],                    -- form factors; NULL = all (API: vehicle_types)
    data_types     feed_data_type[] NOT NULL,
    issue_owner    VARCHAR(30) NOT NULL
                   CHECK (issue_owner IN ('operator', 'dashboard_deelmobiliteit')),
    note           TEXT NOT NULL DEFAULT '',
    created_by     VARCHAR(255) NOT NULL,             -- acl.username
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by     VARCHAR(255),
    updated_at     TIMESTAMPTZ,
    deleted_by     VARCHAR(255),
    deleted_at     TIMESTAMPTZ,
    CHECK (end_time IS NULL OR end_time > start_time),
    CHECK (cardinality(data_types) > 0),
    CHECK (system_ids IS NULL OR cardinality(system_ids) > 0),
    CHECK (municipalities IS NULL OR cardinality(municipalities) > 0),
    CHECK (modalities IS NULL OR cardinality(modalities) > 0)
);
```

- Arrays instead of junction tables: a rejection is read and edited as one unit, and the table stays small. `NULL` means "all" and maps to `'all'` in the API.
- `DELETE` in the API sets `deleted_by` / `deleted_at` (soft delete), so it stays visible who rejected data and who removed the rejection. `GET` only returns rows where `deleted_at IS NULL`.

### Option A: outage intervals per feed

Extend what the feed monitor already does. Store when a feed went down and came back up, plus the latest check. Combine an operator's feeds when the API is called.

With `feeds.data_type` in place, `feed_downtime` stays as it is: `feed_id` already tells the data type.

#### Downtime for all three data types (built)

The feed monitor writes `feed_downtime` rows for vehicles, trips and service area feeds. Same branch, migration `20261125_add_import_attempt_tracking_to_feeds.sql`:

```sql
ALTER TABLE feeds
    ADD COLUMN last_time_import_attempted TIMESTAMPTZ,  -- last request, successful or not
    ADD COLUMN import_failing_since TIMESTAMPTZ;        -- first failed attempt since the last success
```

| | Vehicles | Trips | Service areas |
|---|----------|-------|---------------|
| Imported | Continuously | Hourly job | Hourly job |
| Import succeeds when | At least one vehicle | The requests succeed, also with zero trips | The feed downloads, parses and has at least one zone |
| Down when | No success for 5 minutes | Failing, and no success for 2.5 hours | Failing, and no success for 2.5 hours |
| Downtime starts at | The moment the monitor notices | The first failed attempt | The first failed attempt |
| Our importer not running | Every feed looks down | Not recorded as downtime; one Telegram alert | Not recorded as downtime; one Telegram alert |

- 2.5 hours is two hourly runs plus a margin, so one failed run opens no downtime.
- A trips or service area feed that was never attempted has no downtime: its status is unknown.
- The trip importer fetches missed hours once a feed is back. A trips outage therefore means "could not be fetched then", not "those trips are missing".
- Telegram alerts for trips and service area downtime are off unless `TELEGRAM_ALERT_DATA_TYPES` is set on the feed monitor.
- The vehicle importer does not write the two new columns.

#### Still to build: the API

How the API fields follow, per operator and data type, over the operator's active feeds:

| API field | Source |
|-----------|--------|
| `status` | `unavailable` if any feed has an open `feed_downtime` row, else `available`. `not_expected` if the operator has no active feed for the data type. `unknown` if no import was attempted yet. |
| `last_checked_at` | Latest `last_time_import_attempted` (vehicles: the time of the request, the importer runs continuously) |
| `last_data_received_at` | Oldest `last_time_succesfully_imported` (the worst feed) |
| `outages` | The feeds' `feed_downtime` intervals that overlap the period, merged where they overlap |
| `availability_pct` | 100 × (1 − merged outage time / elapsed time in the period) |

### Option B: status per feed per check, combined into one final status

Record the result of every check for every separate feed. In the same run, combine the feeds of one operator and data type into one final status and store that too.

```sql
CREATE TYPE feed_check_result AS ENUM ('ok', 'offline', 'empty');
CREATE TYPE operator_feed_status AS ENUM ('available', 'partly_available', 'unavailable');

-- 1. Status of every separate feed: one row per feed and check
--    (the data type follows from feeds.data_type)
CREATE TABLE feed_check (
    feed_id      INT NOT NULL REFERENCES feeds(feed_id) ON DELETE CASCADE,
    checked_at   TIMESTAMPTZ NOT NULL,              -- same value for all feeds in one run
    result       feed_check_result NOT NULL,
    record_count INT,                               -- vehicles, trips or service areas found
    message      TEXT,                              -- HTTP status or error, for debugging
    PRIMARY KEY (feed_id, checked_at)
);
CREATE INDEX feed_check_checked_at ON feed_check (checked_at);

-- 2. Final status: one row per operator, data type and check run
CREATE TABLE operator_feed_check (
    system_id     VARCHAR(255) NOT NULL,
    data_type     feed_data_type NOT NULL,
    checked_at    TIMESTAMPTZ NOT NULL,
    status        operator_feed_status NOT NULL,
    feeds_total   INT NOT NULL,
    feeds_failing INT NOT NULL,
    PRIMARY KEY (system_id, data_type, checked_at),
    CHECK (feeds_total > 0 AND feeds_failing BETWEEN 0 AND feeds_total)
);
```

Combine rule, applied per operator and data type over the `feed_check` rows of one run:

- `feeds_failing = 0`: `available`
- `feeds_failing = feeds_total`: `unavailable`
- otherwise: `partly_available`

Who writes: one check run every 5 minutes inserts the `feed_check` rows and the `operator_feed_check` rows in one transaction, with the same `checked_at`. `feed_downtime` stays as it is, for the Telegram alerts.

How the API fields follow, per operator and data type, from `operator_feed_check`:

| API field | Source |
|-----------|--------|
| `status` | `status` of the latest row. `not_expected` if the operator has no active feed for the data type. `unknown` if there are feeds but no rows yet. |
| `last_checked_at` | Latest `checked_at` |
| `last_data_received_at` | Latest `checked_at` where `status <> 'unavailable'` |
| `outages` | Runs of consecutive rows with `status = 'unavailable'`: from the first failing check to the first passing check after it (`null` if the latest check still fails) |
| `availability_pct` | Share of rows in the period with `status = 'available'` |

`feed_check` grows fast and is only needed for drill-down and debugging. It can be pruned (for example after 90 days), because `operator_feed_check` keeps the history the page shows.

### Comparison

| | Option A | Option B |
|---|----------|----------|
| What is stored | Outage intervals per feed, plus the latest check | Every check of every feed, plus the final status per operator |
| Changes still needed | 1 new table (rejections); the feed part is built | 3 new tables |
| Rows written | One per outage | Per day: 288 per feed, plus 288 per operator and data type |
| Several feeds per operator | Combined when the API is called. A changed rule also changes history. | Combined at check time and stored. History keeps the rule that applied then. |
| "Partly available" | Needs interval arithmetic over all feeds | Stored: `feeds_failing` / `feeds_total` |
| Why a feed failed | Free text in `feed_downtime.reason` | `result` per check (`offline` or `empty`) |
| Checker itself not running | Not visible: feeds look available | Visible: no rows for that time |
| Fit with `availability_pct` in the contract | Approximated from outage duration | Exact: share of checks that passed |
| Existing code reused | Feed monitor and `feed_downtime` | New check run |

### Open decisions

1. **`partly_available` (Option B).** The API and frontend only know `available` and `unavailable`. Either the API maps `partly_available` to `unavailable` (one broken feed turns the operator red, as in Option A), or the contract and the cards get a third state.
2. **Who runs the check (Option B).** The importers already have the authentication and parsing for every feed, so they could write the `feed_check` row (at most once per 5 minutes per feed). A separate checker would request every feed a second time.
3. **"Has data" for trips and service areas.** Decided, see [Downtime for all three data types](#downtime-for-all-three-data-types-built): a trips import may be empty, a service area feed needs at least one zone.
4. **Outages on our side.** Decided for trips and service areas: when our importer is not running, no downtime is recorded. For vehicles every feed still looks down when the importer stops; that is left to a manual rejection with issue owner "Dashboard Deelmobiliteit".
5. **Municipalities.** `feeds` has no link to municipalities, so in both options an operator's status is the same in every municipality.
6. **Operators active in a municipality.** No new table: derive it from existing statistics, probably `day_statistics` (`system_id`, `date`, `geometry_ref`). The exact query still has to be worked out.
