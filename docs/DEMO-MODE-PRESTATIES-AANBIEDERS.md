# DEMO Mode for Prestaties Aanbieders

This document describes the DEMO mode feature for the `/stats/prestaties-aanbieders` page, which allows presenting a demo without showing real operator names, colors, or values.

## Enabling DEMO Mode

Add the following to your `.env` (or `.env.local`):

```
REACT_APP_DEMO_MODE=true
```

Then rebuild the application: `npm run build`.

## What DEMO Mode Does

When DEMO mode is enabled, the following changes apply on the Prestaties aanbieders page:

### 1. Operator Names

- **Replaced with** fake Dutch shared mobility company–style names, e.g.:
  - Deelfiets Noord
  - Stadsfiets Nederland
  - Groene Mobiliteit
  - FietsDeel BV
  - ScootShare
  - Stedelijk Vervoer
  - Mobiliteitshub
  - FietsNet Holland
  - And more…

- **Consistency**: Each real `system_id` is mapped to the same fake name across navigation and page reloads.

### 2. Operator Colors

- **Replaced with** a distinct palette different from real operator branding.

- **Consistency**: Each operator keeps the same demo color across navigation and reloads.

### 3. Chart & Indicator Values

- **Measured values** are multiplied by factors such as `× 1.4`, `÷ 1.4`, `× 1.2`, `÷ 1.2`, etc. This applies to:
  - the detail panel LineCharts, and
  - the daily indicator block tooltips (e.g. the `200` in `200 / 275`), so real numbers are never exposed.
- Each KPI metric has its own factor, kept consistent across sessions.
- **KPI thresholds and compliance** are not changed; the pass/fail logic and the green/red/white block colors stay the same.

## Persistence

Demo mappings (names, colors, value factors) are stored in `localStorage` under the key `demo_prestaties_config_v1`. This keeps the demo experience consistent across:

- Navigation within the app
- Page reloads

## Resetting Demo Mappings

To regenerate mappings (e.g. new colors), clear the stored config in the browser:

```javascript
localStorage.removeItem('demo_prestaties_config_v1');
```

Then reload the page.

## Files Involved

| File | Purpose |
|------|---------|
| `src/config/demo.ts` | Exposes `isDemoMode()` based on `REACT_APP_DEMO_MODE` |
| `src/helpers/demoMode.ts` | Demo helpers for names, colors, value factors, and localStorage persistence |

**Components using DEMO mode:**

- `PrestatiesAanbiedersDetailsPanel` – operator name, color, chart values
- `PrestatiesAanbiederCard` – operator name and color
- `PerformanceIndicatorBlock` – factored measured value in the daily block tooltip
- `FilterbarPermits` – operator names and colors in the aanbieders filter
- `SelectProviderDialog` – operator names
- `PrestatiesAanbiedersMunicipalityView` – provider names in the edit dialog table
- `EditLimitsDialog` – provider name

## Usage

1. Set `REACT_APP_DEMO_MODE=true` in `.env`.
2. Build the app: `npm run build`.
3. Go to `/stats/prestaties-aanbieders`, select a municipality, and you will see anonymized data.
