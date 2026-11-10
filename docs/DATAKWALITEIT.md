# Datakwaliteit page

The `/stats/datakwaliteit` page shows the data quality of every operator's feeds, so users can see whether issues need solving and which data to exclude from analyses. See [issue #266](https://github.com/Stichting-CROW/dashboarddeelmobiliteit-app/issues/266).

## What the page shows

One card per operator that is active in the selected municipality (or in all of The Netherlands). Each card has:

- **Handmatig afgekeurd**: red when at least one manual rejection overlaps the selected period. Each rejection lists the period, operator(s), area, vehicle type, data type, issue owner, note, and who created or last changed it.
- **Aanbod / Verhuringen / Servicegebieden feed beschikbaar**: the latest 5-minute check, plus the availability percentage and the outages in the period. Colors:
  - green: online (reachable and has data)
  - red: offline (unreachable or empty)
  - grey: "Geen feed verwacht" (the operator doesn't offer this feed) or "Onbekend" (no check yet)
- **Timeline**: one lane per feed with outages in red, and one lane with manual-rejection windows (hatched). The part of the period that lies in the future is grey.

Cards with issues are shown first. Operator accounts only see their own card.

Filters (left filter bar):

- **Periode**: `start_date` / `end_date` URL params (both inclusive). The default is the last 7 days including today.
- **Plaats**: `filter.gebied` / `gm_code`. Hidden for operator accounts and for accounts with a single municipality.

Admins (`isAdmin(state)`) can add, edit and delete manual rejections. One rejection can cover several operators or all of them, for example when Dashboard Deelmobiliteit itself had an outage. All visible rejections can be exported as CSV.

## Code

| Path | Purpose |
|------|---------|
| `src/pages/dashboard/DashboardDatakwaliteit.tsx` | Page |
| `src/components/Filterbar/FilterbarDatakwaliteit.tsx` | Filter bar |
| `src/components/Datakwaliteit/useDataQualityData.ts` | Fetching, demo fallback, create/update/delete |
| `src/components/Datakwaliteit/dataQualityUtils.ts` | Pure helpers (period math, filtering, timeline, CSV, validation) |
| `src/components/Datakwaliteit/dataQualityDemoData.ts` | Deterministic demo data |
| `src/components/Datakwaliteit/DataQualityCard.tsx`, `DataQualityTimeline.tsx`, `ManualRejectionDialog.tsx` | UI |
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

Every 5 minutes, per operator and data type, check whether the feed is reachable and contains data, and store the result (for example in `feed_status_logs`). `availability_pct` and `outages` are derived from these checks. A feed the operator doesn't offer must report `not_expected`, not `unavailable`.
