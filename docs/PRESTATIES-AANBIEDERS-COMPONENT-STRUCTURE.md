# Prestaties aanbieders – Component structure

Page: `/stats/prestaties-aanbieders?gm_code=GM0599&start_date=2026-02-06&end_date=2026-02-11`

## Overview layout (no details panel)

When the URL has `gm_code`, `start_date`, and `end_date` but no `operator`/`form_factor`/`propulsion_type`, the page shows the overview only (no split view with details panel).

---

## Component tree

```
App
├── Notification
├── LoadingIndicator
├── div.gui-layer
│   ├── Routes
│   │   └── Route "/stats/:dashboard"
│   │       ├── ContentPage
│   │       │   └── DashboardPage
│   │       │       └── DashboardPrestatiesAanbieders
│   │       │           └── div.DashboardPrestatiesAanbieders
│   │       │               └── PrestatiesAanbiedersMunicipalityView
│   │       │
│   │       └── FilterbarDesktop (slide-out panel)
│   │           └── Filterbar
│   │               └── FilterbarPermits
│   │
│   └── FloatingMobileMenu
├── MapPage
├── Menu
└── Toaster
```

---

## Prestaties aanbieders view – Detail

### DashboardPrestatiesAanbieders

**File:** `src/pages/dashboard/DashboardPrestatiesAanbieders.tsx`

- Reads `activeorganisation` from Redux (`state.filter.gebied`)
- Reads URL params: `gm_code`, `operator`, `form_factor`, `propulsion_type`, `fullscreen`
- **Overview mode** (no details params): renders `PrestatiesAanbiedersMunicipalityView` in a full-width container
- **Split mode** (with details params): overview + `PrestatiesAanbiedersDetailsPanel` side by side

---

### PrestatiesAanbiedersMunicipalityView

**File:** `src/components/PrestatiesAanbieders/PrestatiesAanbiedersMunicipalityView.tsx`

**Data:** `usePermitData('municipality', activeorganisation)`, `usePermitActions()`

**Structure:**

```
div
├── div.flex.justify-between.mb-8
│   └── PageTitle
│       └── "Prestaties aanbieders"
│
├── div#permits-container.permits-container
│   └── PermitCardCollection
│       ├── rowData: vehicle types from metadata (bicycle, car, scooter, etc.)
│       ├── renderHeader: renderVehicleTypeHeader
│       ├── renderCards: renderVehicleTypeCards
│       └── filterPermits: filterVehicleTypePermits
│
└── Modals (conditionally)
    ├── Modal (SelectProviderDialog)
    ├── Modal (SelectVehicleTypeDialog)
    └── EditLimitsDialog
```

**Empty / loading / error states:**
- No `activeorganisation`: "Selecteer een gemeente om vergunningseisen te bekijken"
- Loading: "Laden..."
- Error: "Fout: ..."

---

### PermitCardCollection

**File:** `src/components/PrestatiesAanbieders/PermitCardCollection.tsx`

Renders one row per vehicle type that has permits. Rows are ordered by severity (red → green → grey).

**Structure per row:**

```
div.permits-collection-row
└── div.permits-collection-row-content
    ├── div.permits-collection-header
    │   └── renderHeader(rowItem)
    │       └── img (vehicle icon) + div (vehicle type name)
    │
    └── div.permits-collection-cards
        └── div.permits-collection-cards-content
            └── PrestatiesAanbiederCard[] (from renderCards)
```

---

### PrestatiesAanbiederCard

**File:** `src/components/PrestatiesAanbieders/PrestatiesAanbiederCard.tsx`

**Props:** `label`, `logo`, `permit`, `onEditLimits`

**Structure:**

```
div.permits-card (id="permits-card-{permit_limit_id}")
├── div.permits-card-content
│   ├── div.hidden (logo or fallback)
│   └── div.flex.justify-between
│       ├── ProviderLabel
│       │   └── colored dot + label + propulsion emoji (⚡/🛢️)
│       └── div (DetailsLink + gear button)
│
├── div.indicator-container (data-name="indicator-container")
│   ├── "Laden..." (when loading and no kpis)
│   └── PerformanceIndicator[] (one per KPI)
```

**Important behavior:**
- Reads `start_date`, `end_date` from URL
- Fetches performance indicators via `getOperatorPerformanceIndicators`
- Gear: click → edit limits (if propulsion_type present)

---

### PerformanceIndicator

**File:** `src/components/PrestatiesAanbieders/PerformanceIndicator.tsx`

**Props:** `kpi`, `performanceIndicatorDescriptions`

**Structure:**

```
div (data-name="performance-indicator")
└── section
    ├── header
    │   └── title + PerformanceIndicatorTooltip (info icon)
    │
    ├── [period ≤ 7 days] div.performance-indicator-blocks
    │   └── PerformanceIndicatorBlock[] (one per day)
    │
    └── [period ≥ 8 days] div.performance-indicator-bar-wrapper
        └── PerformanceIndicatorBar
```

---

### Child components

| Component | File | Role |
|-----------|------|------|
| **ProviderLabel** | `ProviderLabel.tsx` | Colored dot + provider name + propulsion emoji |
| **DetailsLink** | `PrestatiesAanbiederCard.tsx` | Link to details page |
| **PerformanceIndicatorBlock** | `PerformanceIndicatorBlock.tsx` | Single day block (green/red/white) |
| **PerformanceIndicatorBar** | `PerformanceIndicatorBar.tsx` | Stacked bar for multi-day period |
| **PageTitle** | `common/PageTitle.tsx` | Page heading |

---

## Filterbar (slide-out panel)

**File:** `src/components/Filterbar/FilterbarPermits.tsx`

Shown when `displayMode === DISPLAYMODE_DASHBOARD` (stats page).

**Structure:**

```
FilterbarPermits
├── Fieldset "Statistiek"
│   └── FilterbarStatistiek
│       └── FilterbarExtended (Beleidsinfo / Prestaties aanbieders)
│
├── Fieldset "Plaats"
│   └── FilteritemGebieden
│
└── Fieldset "Periode"
    └── FilteritemDatumVanTot
```

---

## Split view (details panel)

When URL has `gm_code`, `operator`, `form_factor` (and optionally `propulsion_type`):

```
div.DashboardPrestatiesAanbieders--split
├── div.DashboardPrestatiesAanbieders__overview (hidden when fullscreen)
│   └── PrestatiesAanbiedersMunicipalityView
│
└── div.DashboardPrestatiesAanbieders__details
    └── PrestatiesAanbiedersDetailsPanel
```

---

## Data flow

| Source | Purpose |
|--------|---------|
| `state.filter.gebied` | Municipality for permit fetch (`activeorganisation`) |
| URL `gm_code`, `start_date`, `end_date` | Display context; cards read dates for KPI fetch |
| `usePermitData('municipality', activeorganisation)` | Fetches permits via `getPermitLimitOverviewForMunicipality` |
| `getOperatorPerformanceIndicators` | Per-card KPI data (operator, form_factor, propulsion) |

---

## API calls

Base URL: `https://mds.dashboarddeelmobiliteit.nl`

All permit/KPI endpoints use `Authorization: Bearer {token}` and `Content-Type: application/json`.

### 1. `GET /kpi_overview_operators`

**Used by:** Overview permit list, per-card KPIs, details panel, filterbar combinations

| Param | Required | Description |
|-------|----------|-------------|
| `start_date` | ✓ | YYYY-MM-DD |
| `end_date` | ✓ | YYYY-MM-DD |
| `municipality` | ✓ | e.g. GM0599 |
| `system_id` | optional | Operator id (e.g. greenwheels) |
| `form_factor` | optional | Vehicle type (car, bicycle, scooter) |
| `propulsion_type` | optional | electric, combustion, human, etc. |

**Response:** `{ performance_indicator_description: [...], municipality_modality_operators: [...] }`

**Callers:**
- `getPermitLimitOverviewForMunicipality` – last 90 days, municipality only (overview cards)
- `getOperatorPerformanceIndicators` – URL dates or last 90 days, + system_id, form_factor (per card)
- `getKpiOverviewOperators` (kpiOverview.ts) – URL dates, + system_id, form_factor (details panel)

---

### 2. `GET /operators`

**Used by:** Operator metadata (name, color, logo)

No query params. Public (no auth required in current impl).

**Response:** `{ operators: [{ system_id, name, color, operator_url }, ...] }`

**Callers:** `getPermitLimitOverviewForMunicipality` (enriches cards), `FilterbarPermits`, `PrestatiesAanbiedersDetailsPanel`, `DashboardPrestatiesAanbiedersDetails`

---

### 3. `GET /public/geometry_operator_modality_limit_history`

**Used by:** Edit limits dialog (history table), permit limits editor

| Param | Required | Description |
|-------|----------|-------------|
| `operator` | ✓ | system_id |
| `geometry_ref` | ✓ | e.g. cbs:GM0599 |
| `form_factor` | ✓ | car, bicycle, scooter |
| `propulsion_type` | ✓ | electric, combustion, etc. |

**Response:** `GeometryOperatorModalityLimit[]` (effective_date, limits, etc.)

**Callers:** `PrestatiesAanbiedersMunicipalityView` (edit dialog), `EditLimitsDialog`, `PermitLimitsTable`

---

### 4. `POST /admin/geometry_operator_modality_limit`

**Used by:** Add new limit record (editor, test tab)

**Body:** `GeometryOperatorModalityLimit` (operator, geometry_ref, form_factor, propulsion_type, effective_date, limits)

**Callers:** `PermitLimitsTable`, `EditLimitsDialog` (test tab)

---

### 5. `PUT /admin/geometry_operator_modality_limit`

**Used by:** Update existing limit record

**Body:** `GeometryOperatorModalityLimit` (incl. geometry_operator_modality_limit_id)

**Callers:** `PermitLimitsTable`, `EditLimitsDialog`

---

### 6. `DELETE /admin/geometry_operator_modality_limit/{id}`

**Used by:** Delete limit record

**Callers:** `PermitLimitsTable`, `EditLimitsDialog`

---

### 7. `GET /public/permit_limit_overview`

**Used by:** Operator view (when viewing by operator instead of municipality)

| Param | Required | Description |
|-------|----------|-------------|
| `system_id` | ✓ | Operator id |

**Callers:** `usePermitData('operator', filterValue)` → `getPermitLimitOverviewForOperator`

---

## File index

| Path | Purpose |
|------|---------|
| `pages/dashboard/DashboardPrestatiesAanbieders.tsx` | Page layout, overview vs split |
| `components/PrestatiesAanbieders/PrestatiesAanbiedersMunicipalityView.tsx` | Overview, card collection, dialogs |
| `components/PrestatiesAanbieders/PermitCardCollection.tsx` | Rows by vehicle type |
| `components/PrestatiesAanbieders/PrestatiesAanbiederCard.tsx` | Single provider card |
| `components/PrestatiesAanbieders/PerformanceIndicator.tsx` | KPI row (blocks or bar) |
| `components/PrestatiesAanbieders/PerformanceIndicatorBlock.tsx` | Single day block |
| `components/PrestatiesAanbieders/PerformanceIndicatorBar.tsx` | Multi-day bar |
| `components/PrestatiesAanbieders/ProviderLabel.tsx` | Provider name + propulsion |
| `components/PrestatiesAanbieders/KpiOverviewTestDialog.tsx` | Hidden KPI/limit test tool (Shift+click on title) |
| `components/Filterbar/FilterbarPermits.tsx` | Filter panel for stats |
| `components/Filterbar/FilterbarStatistiek.tsx` | Statistiek type selector |

---

## KPI overview test dialog

**File:** `src/components/PrestatiesAanbieders/KpiOverviewTestDialog.tsx`

### Purpose

The KPI overview test dialog is a **hidden developer/testing tool** for inspecting and manipulating KPI overview data and geometry operator modality limits. It is used to:

- Inspect the raw response from the `kpi_overview_operators` API
- Compare KPI data values with configured limit values across operator/form_factor/propulsion combinations
- Bulk-create, update, or delete limit records for testing purposes

### How to open

**Shift+click** on the "Prestaties aanbieders" page title (in `PrestatiesAanbiedersMunicipalityView`). There is no visible button or hint; the dialog is intentionally hidden.

### Filters

- **start_date / end_date** – Date range for the KPI overview API call
- **system_id, form_factor, propulsion_type** – Optional filters to narrow the overview

Changing any filter triggers an automatic refetch. The "Verversen" button refreshes data manually.

### Tab: overview

Shows a summary of the `kpi_overview_operators` response combined with limit data from `geometry_operator_modality_limit_history`.

**Top section:** Two summary rows:
- `performance_indicator_description` – number of KPI definitions
- `municipality_modality_operators` – number of operator/form_factor/propulsion_type/kpi_key combinations

**Main table:** One row per combination. Columns:

| Column | Description |
|--------|-------------|
| operator | system_id (e.g. greenwheels) |
| form_factor | Vehicle type (car, bicycle, scooter) |
| propulsion_type | electric, combustion, human, etc. |
| kpi_key | KPI identifier from performance_indicator_description |
| granularity | Time granularity of the KPI |
| num records | Number of value records in the API response |
| num data values | Count of values with `measured` (actual data) |
| num limit values | Count of values with `threshold` or `complies` (limit configured) |
| has limit | ✓ if a limit is defined for this KPI in the active record, — otherwise |
| limit value | The configured limit number, or — |

**Cell coloring (num data values / num limit values):**
- **Green** – has limit and numDataValues === numLimitValues (all data points have limits)
- **Yellow** – has limit but counts differ (partial coverage)
- **Red** – numLimitValues > 0 but hasLimit is false (limits exist without matching data)

**kpi_key filter:** Dropdown (when not on KPI limits tab) to show only one kpi_key. "— alle —" shows all.

---

### Tab: kpi limits

Interactive table to create, update, or delete limit records per operator/geometry_ref/form_factor/propulsion_type combination.

**Rows:** One per unique operator/geometry_ref/form_factor/propulsion_type from the overview response.

**Columns:**
- **operator, geometry_ref, form_factor, propulsion_type** – Context identifiers
- **on/off** – Per-row toggle. "off" (red) = no limits; click to add limits for all KPIs with random values. "on" (green) = limits exist; click to delete all limit records for this combination.
- **kpi1..kpin** – One column per KPI key. Header buttons toggle that KPI on/off for all rows that have limits. Cell values show the limit number, "—" if absent, or a clickable button to toggle.

**Cell actions:**
- Click a cell with a value → remove that KPI from the record (set to absent)
- Click a cell with "—" → add that KPI with a random value

**Info icon (ℹ):** Each KPI cell has an info icon. Hover to see the active limit record (full `GeometryOperatorModalityLimit` JSON) for that row in a tooltip.

**Legend:** Below the table, maps kpi1 = key1, kpi2 = key2, etc.

All new limit records use **effective_date = 2026-01-01**.

---

### Tab: raw

Displays the full JSON response from `GET /kpi_overview_operators` as pretty-printed, indented text. Useful for debugging the API response structure and inspecting nested fields such as `performance_indicator_description` and `municipality_modality_operators`.

---

### Tab: kpi raw

Always fetches **all** `geometry_operator_modality_limit` records for the current municipality, regardless of the dialog’s filters (start_date, system_id, form_factor, propulsion_type). Uses the same raw layout as the raw tab (JSON, pretty-printed).

**Purpose:** Compare the full set of limits in the database with what appears in the scoped overview/kpi limits tabs. Limits that exist in kpi raw but not in the other tabs may be “orphans” (e.g. for operator/form_factor/propulsion combinations not returned by `kpi_overview_operators`).

**Fetch logic:** Tries `GET /public/geometry_operator_modality_limit?geometry_ref=X` first. If that endpoint is not available, falls back to fetching limit history for each (operator, form_factor, propulsion_type) from the permit overview.

### Data flow

1. On open: fetches `kpi_overview_operators` with municipality + date range + optional filters
2. For each operator/form_factor/propulsion in the response: fetches `geometry_operator_modality_limit_history` to build the limit map and KPI limits table
3. Uses `permitLimitsOperations` (`planSetFullRecordAtDate`, `planSetKpiAtDate`, etc.) to compute PUT/POST/DELETE operations before calling the admin API

### API calls

| Action | Endpoint |
|--------|----------|
| Fetch overview | `GET /kpi_overview_operators` |
| Fetch limit history (per combination) | `GET /public/geometry_operator_modality_limit_history` |
| Add limit record | `POST /admin/geometry_operator_modality_limit` |
| Update limit record | `PUT /admin/geometry_operator_modality_limit` |
| Delete limit record | `DELETE /admin/geometry_operator_modality_limit/{id}` |

---

## Test schema: pinpointing propulsion_type and filtering inconsistencies

Use this schema to systematically test whether inconsistencies stem from multiple propulsion types, backend filtering, or frontend matching.

### Prerequisites

- Municipality with known operators (e.g. GM0599)
- KPI overview test dialog (Shift+click on "Prestaties aanbieders")
- Browser dev tools (Network tab) to inspect API requests/responses

---

### Test data matrix

Create or identify the following combinations. Use the KPI overview test dialog **overview** tab to see what the backend returns.

| Scenario | operator | form_factor | propulsion_type | Purpose |
|----------|----------|-------------|-----------------|---------|
| **A** | op1 | bicycle | human | Baseline: single propulsion |
| **B1** | op1 | scooter | electric | Same operator, different form_factor |
| **B2** | op1 | scooter | combustion | Same operator+form_factor, second propulsion |
| **C1** | op2 | car | electric | Second operator |
| **C2** | op2 | car | combustion | Same operator+form_factor as C1, different propulsion |

**Ideal test setup:** One operator (e.g. Felyx, Lime) that has both `scooter+electric` and `scooter+combustion` in the same municipality. If none exists, use any operator with multiple propulsion types for one form_factor.

---

### Test 1: `kpi_overview_operators` – backend filtering

**Goal:** Check if the backend correctly filters by `propulsion_type` when the param is present, and returns all combinations when absent.

| Step | Request params | Expected `municipality_modality_operators` |
|------|----------------|-------------------------------------------|
| 1.1 | municipality, start_date, end_date only | All combinations for municipality (A, B1, B2, C1, C2, …) |
| 1.2 | + system_id=op1 | Only op1 rows (A, B1, B2) |
| 1.3 | + system_id=op1, form_factor=scooter | Only B1, B2 |
| 1.4 | + system_id=op1, form_factor=scooter, propulsion_type=electric | Only B1 |
| 1.5 | + system_id=op1, form_factor=scooter, propulsion_type=combustion | Only B2 |

**How to run:** In KPI overview test dialog, set filters and click Verversen. Inspect **raw** tab or Network response.

**Interpretation:**
- If 1.4 returns B1+B2 or 1.5 returns B1+B2 → backend ignores `propulsion_type` filter
- If 1.1 is missing B2 when B2 exists → backend may merge/aggregate propulsion types incorrectly
- If 1.4 returns B2 instead of B1 → backend may mix up propulsion_type values

---

### Test 2: `kpi_overview_operators` – propulsion_type in response

**Goal:** Verify each row in `municipality_modality_operators` has the correct `propulsion_type` and is not merged with another.

| Step | Check |
|------|-------|
| 2.1 | For op1+scooter, count rows: expect 2 (electric, combustion) |
| 2.2 | Each row has distinct `propulsion_type` matching its kpis |
| 2.3 | No row has `propulsion_type: null` or empty when it should have one |
| 2.4 | `kpis` and values in each row match that propulsion_type only |

**How to run:** Raw tab, inspect `municipality_modality_operators` array.

**Interpretation:**
- Single row for op1+scooter with mixed kpis → backend merges propulsion types
- Wrong propulsion_type on a row → backend attribution bug

---

### Test 3: `geometry_operator_modality_limit_history` – isolation per propulsion

**Goal:** Ensure limit history is isolated per (operator, geometry_ref, form_factor, propulsion_type).

| Step | Request | Expected |
|------|---------|----------|
| 3.1 | operator=op1, geometry_ref=cbs:GM0599, form_factor=scooter, propulsion_type=electric | Only limits for electric |
| 3.2 | Same, propulsion_type=combustion | Only limits for combustion |
| 3.3 | Create limit for B1 (electric), then fetch 3.1 and 3.2 | 3.1 shows new record, 3.2 does not |

**How to run:** KPI overview test dialog → kpi limits tab. Use info icon tooltip to see `geometry_operator_modality_limit_id` and `propulsion_type` of each record. Or call the API directly.

**Interpretation:**
- 3.1 returns combustion limits → backend does not filter by propulsion_type
- 3.3: both 3.1 and 3.2 return the new record → backend stores/returns limits without propulsion_type isolation

---

### Test 4: Overview cards – `getOperatorPerformanceIndicators` and `findOperatorMatch`

**Goal:** Cards call `getOperatorPerformanceIndicators` **without** `propulsion_type` in the API request. The frontend then uses `findOperatorMatch` to pick the right row. Check if that works when multiple propulsion types exist.

| Step | Check |
|------|-------|
| 4.1 | Card for op1+scooter+electric shows KPIs for electric only (not combustion) |
| 4.2 | Card for op1+scooter+combustion shows KPIs for combustion only |
| 4.3 | Network: `getOperatorPerformanceIndicators` request has system_id, form_factor, **no** propulsion_type |
| 4.4 | Response contains 2 rows for op1+scooter (electric, combustion) |

**How to run:** Overview page, inspect per-card KPI values. Network tab for API calls.

**Interpretation:**
- Both cards show same KPIs → `findOperatorMatch` falls back to `matches[0]` or backend returns single merged row
- Card shows wrong propulsion KPIs → `findOperatorMatch` picks wrong row when propulsionType is provided

---

### Test 5: Limit map in KPI overview test dialog

**Goal:** The dialog builds `limitMap` with key `operator|geometry_ref|form_factor|propulsion_type`. Limits are fetched per combination. Check that overview tab `has limit` and `limit value` match the correct propulsion_type.

| Step | Setup | Check |
|------|-------|-------|
| 5.1 | Create limit for op1+scooter+electric only | Overview: row for op1+scooter+electric has limit; row for op1+scooter+combustion has no limit |
| 5.2 | Create limit for op1+scooter+combustion | Both rows show their own limit value |
| 5.3 | Delete limit for electric | Only electric row loses limit; combustion unchanged |

**How to run:** KPI overview test dialog, overview tab. Use kpi limits tab to add/remove limits.

**Interpretation:**
- Both rows show same limit when only one has limits → limitMap key or history fetch mixes propulsion types
- Wrong limit value on a row → mismatch between overview response and limit history

---

### Test 6: Edit limits dialog – correct history per card

**Goal:** Clicking the gear on a card opens the edit dialog. It must load history for that card’s (operator, form_factor, propulsion_type).

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Gear on op1+scooter+electric card | Edit dialog shows history for electric only |
| 6.2 | Gear on op1+scooter+combustion card | Edit dialog shows history for combustion only |
| 6.3 | Create limit via electric card, then open combustion card | Combustion dialog does not show that record |

**How to run:** Overview → gear on card → inspect Edit limits dialog table (effective_date, limits).

**Interpretation:**
- Both dialogs show same history → `getGeometryOperatorModalityLimitHistory` or caller uses wrong propulsion_type
- Edit dialog shows "Geen propulsion_type" for a card that has propulsion → permit record missing propulsion_type

---

### Summary: where to look when tests fail

| Failing test | Likely cause |
|--------------|--------------|
| 1.x | Backend `kpi_overview_operators`: propulsion_type filter wrong or ignored |
| 2.x | Backend `kpi_overview_operators`: merging or wrong attribution of propulsion types |
| 3.x | Backend `geometry_operator_modality_limit_history`: propulsion_type not used in query |
| 4.x | Frontend `findOperatorMatch` or backend returning single merged row for operator+form_factor |
| 5.x | Limit map key or `geometry_operator_modality_limit_history` fetch using wrong propulsion |
| 6.x | Edit dialog: wrong propulsion_type passed to `getGeometryOperatorModalityLimitHistory`, or permit missing propulsion_type |

# Test results for Rotterdam GM0599

## limits set for a single provider
- Greenwheels /car / combustion only returns data for 2 kpi indicators (vehicle cap + percentage parked longer than 24 hours)
- mywheels /car / combustion only returns data for 4 kpi indicators (vehicle cap + percentage parked longer than 3, 7, 24 hours)
- Lime bicycles has two cards (electric assist / human), but only data for electric assist is returned by the api (correct data)
  - both dashboard cards show colored bars and the same detail data
- mywheels cars has two cards (combustion / electric), but only data for electric is returned by the api (correct data)
- other provider / dashboard shows colors / limits in the graph for the other rows

## limits set for two cards
- check/scooter/electric + felix/scooter/electric -> felix correct, check no limit values
- check/bicycle/electric_assist + lime/bicycle/electric_assist -> check correct, check no limit values
- felix/bicycle/electric_assist + lime/bicycle/electric_assist -> lime correct, felix no limit values
- greenwheels/car/electric + mywheels/car/electric -> greenwheels correct, mywheels no limit values
- check/scooter/electric + greenwheels/combustion -> 3 kpis on dashboard while data has 2 kpis?

## other remarks
- add volt icon behind provider for electric_assist bicycles

Conclusion: 
- Defining kpis for two (or more) two different operators with the same combination of [formfactor/propulsion_type] causes problems. (Tested only within a municipality)
- Some other quirks found.

---

# Testresultaten voor Rotterdam GM0599

## Limits ingesteld voor één aanbieder
- Greenwheels /car / combustion geeft alleen data terug voor 2 kpi-indicatoren (voertuigcap + percentage langer dan 24 uur geparkeerd)
- mywheels /car / combustion retourneert alleen data voor 4 kpi-indicatoren (voertuigcap + percentage langer dan 3, 7, 24 uur geparkeerd)
- Lime fietsen heeft twee kaarten (electric assist / human), maar alleen data voor electric assist wordt door de api geretourneerd (correcte data)
  - beide dashboardkaarten tonen gekleurde balken en dezelfde detaildata
- mywheels auto's heeft twee kaarten (combustion / electric), maar alleen data voor electric wordt door de api geretourneerd (correcte data)
- andere aanbieder / dashboard toont kleuren / limits in de grafiek voor de andere rijen

## Limits ingesteld voor twee kaarten
- check/scooter/electric + felix/scooter/electric → felix correct, check geen limit-waarden
- check/bicycle/electric_assist + lime/bicycle/electric_assist → lime correct, check geen limit-waarden
- felix/bicycle/electric_assist + lime/bicycle/electric_assist → lime correct, felix geen limit-waarden
- greenwheels/car/electric + mywheels/car/electric → greenwheels correct, mywheels geen limit-waarden
- check/scooter/electric + greenwheels/combustion → 3 kpi's op dashboard terwijl data 2 kpi's heeft?

## Overige opmerkingen
- volt-icoon toevoegen achter aanbieder voor electric_assist fietsen

Conclusies tot nu toe:
- Het definiëren van kpi's voor twee (of meer) verschillende aanbieders met dezelfde combinatie van [formfactor/propulsion_type] veroorzaakt problemen. (Alleen getest binnen één gemeente)
- Soms niet alle KPIs in de data

