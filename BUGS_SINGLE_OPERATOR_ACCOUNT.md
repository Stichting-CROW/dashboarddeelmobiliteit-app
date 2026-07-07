# Bug report: accounts with single-operator data access

Feedback for the Dashboard Deelmobiliteit developers (Stichting CROW), collected
while testing this fork (`vdveen/dashboarddeelmobiliteit-anne`) with a specific
account type that the platform currently handles poorly.

**Date:** 2026-07-07

## The account profile that triggers these bugs

- A **non-operator organisation** (e.g. `MUNICIPALITY` / `OTHER_GOVERNMENT`),
  **not** an `OPERATOR` organisation and not an admin.
- Its data access comes from a **data-access grant from exactly one operator**
  (in our case: `voi`), so `/dashboard-api/menu/acl` returns **exactly one
  entry** in `operators`.

Both the frontend and the backend contain logic that assumes "exactly one
operator in the ACL" means "this *is* an operator account". For accounts like
the one above that assumption is wrong, and several features break.

---

## 1. OPEN — od-api returns HTTP 500 for this account (backend)

**Symptom:** the HB (herkomst/bestemming) view never loads data. Every od-api
call made on behalf of this account fails with `500 Internal Server Error`
(plain-text body `"Internal Server Error"`, not JSON):

```
GET https://api.dashboarddeelmobiliteit.nl/od-api/accessible/h3?h3_resolution=8   → 500
GET https://api.dashboarddeelmobiliteit.nl/od-api/origins/h3?h3_resolution=8
    &start_date=2026-06-07&end_date=2026-07-07
    &time_periods=6-10,10-14,14-18,18-22,22-2,2-6
    &days_of_week=fr,th,mo,tu,we,sa,su
    &modalities=cargo_bicycle,moped,bicycle,car,scooter,unknown
    &destination_cells=&operators=voi                                             → 500
```

**Why we believe this is an od-api bug and not a frontend bug:**

- The `accessible/h3` request carries nothing but the bearer token and
  `h3_resolution` — there are no frontend-supplied filter parameters that could
  be malformed.
- The service itself is healthy: without a token (or with an invalid one) it
  responds correctly with `403 {"message":"You cannot consume this service"}`.
  A 500 instead of a 4xx therefore points at an **unhandled exception** while
  resolving this account's ACL — most likely the od-api does not handle
  accounts whose access is defined by an operator data-access grant (and/or a
  large multi-municipality area) rather than a plain municipality ACL.
- Other services (dashboard-api `/menu/acl`, vehicle/rental endpoints) work
  fine with the same token, so the token itself is valid.

**Repro for CROW:** take any account matching the profile above and run:

```bash
curl -i "https://api.dashboarddeelmobiliteit.nl/od-api/accessible/h3?h3_resolution=8" \
  -H "Authorization: Bearer <token of the account>"
```

The od-api logs should show a stack trace for this request. Expected behaviour:
either return the accessible cells for the granted operator's area, or a
deliberate `403` — anything but an unhandled 500.

---

## 2. OPEN (upstream) — HB view hidden for non-operator accounts with 1 operator in ACL (frontend)

**Symptom:** the "HB" layer button in the Verhuringen tab is invisible for this
account, even though it is not an operator.

**Root cause:** upstream commit `c36ce5a` (*"fix(rentals): Don't show 'HB
matrix' layer to operator accounts"*) detects an operator account with the
heuristic *"exactly one operator in `/menu/acl`"*
(`isOperatorPrestatiesView` in `src/helpers/prestatiesAanbiedersViewMode.ts`,
plus a similar fallback in `isOperatorAccount` in
`src/helpers/authentication.js`). Any non-operator account whose scope happens
to contain one operator — a single-provider gemeente, or an account with a
single-operator data grant — is misclassified and loses the HB view.

**Knock-on effect:** `canEditHubs()` uses the same `isOperatorAccount`
heuristic, so the same accounts also lose the zone/hub manage buttons
(upstream commit `c98fc86`) even when they hold the `MICROHUB_EDIT` privilege.

**Fixed in this fork:** commit `ed7535a`. The fix treats a known
`organisation_type` from the ACL as authoritative and only falls back to the
single-operator heuristic when the organisation type is missing. Unit tests
included (`src/helpers/authentication.test.js`). This change is small and
self-contained — it should apply cleanly upstream.

**Suggested structural fix:** always expose `organisation_type` in the ACL
responses and never infer account type from the *number* of operators in scope.

---

## 3. OPEN (upstream) — HB layer crashes the map when the od-api request fails (frontend)

**Symptom:** when `GET /od-api/accessible/h3` fails (see bug 1), the console
shows an uncaught exception and the HB layer is left in a broken state:

```
map.hb.h3.ts:52 Uncaught (in promise) TypeError:
    Cannot read properties of undefined (reading 'forEach')
```

**Root cause:** `renderH3Grid` in
`src/components/Map/MapUtils/map.hb.h3.ts` passes the result of
`getHexesForUser()` straight into `createFeatureCollection()`, but
`getHexesForUser()` returns `undefined` when the API call fails. The "wijk"
variant (`renderGeometriesGrid` in `map.hb.geometries.ts`) already guards
against exactly this; the H3 variant does not.

**Fixed in this fork:** commit `b217480` — bail out and clear the grid when
the accessible-hexes request fails, mirroring the existing guard in the wijk
variant. Trivially upstreamable.

---

## 4. NEEDS REVIEW (upstream) — "Prestaties aanbieders" pins these accounts to operator scope (frontend)

The same single-operator heuristic drives the "Prestaties aanbieders" page:

- `resolvePrestatiesViewMode()` pins any account with one ACL operator to the
  **operator** view, and `canToggleViewMode()` prevents switching away.
- `buildScopedKpiOverviewParams()` (and `PrestatiesAanbiedersDetailsPanel`)
  fall back to operator-scoped requests (`system_id` only, no `municipality`)
  when no municipality is resolvable — which, per the code comments introduced
  in upstream commit `c6d1c52`, the backend answers with **403** for
  non-operator accounts.

Upstream commit `c6d1c52` (*"Municipality users couldn't see kpi charts"*)
fixed the main path for municipality accounts, but the view-mode pinning and
the operator-scope fallback still assume "1 operator in ACL = operator
account". An account matching the profile above will be forced into operator
view and may hit 403s on KPI requests. Same structural fix as bug 2: decide by
`organisation_type`, not by counting ACL operators.

---

## Related, already fixed upstream (for context)

These earlier upstream fixes hit the same account profile and illustrate the
same pattern — they are listed so the underlying theme is visible:

| Commit | Fix | Relation to this account profile |
|---|---|---|
| `597051d` | *Operator account cannot see its rentals and aggregated stats* | Requests now append `operators=<acl scope>` for single-operator ACLs; this is where `operators=voi` in the od-api URLs (bug 1) originates. |
| `c6d1c52` | *Municipality users couldn't see kpi charts* | Municipality account with a small operator list was sent operator-scoped KPI requests → 403. Partial fix; see bug 4. |
| `61830ba` | *Operator data could not be added to operator organisation* | Admin UI bug encountered while setting up the operator data-access grant used by this account. |
| `7951529` | *User access to multiple places → show all at once if "Alle plaatsen"* | Accounts with access to many municipalities (e.g. province-wide) hit a backend limit: enumerating >~25 municipalities in `/zones?municipalities=..` queries makes the server reply **502**. Worked around client-side (`MAX_ENUMERABLE_MUNICIPALITIES` in `src/helpers/authentication.js`); the 502 itself is still a backend limitation worth fixing. |

---

## Summary of asks to CROW

1. **od-api:** handle accounts with operator-grant-based data access — return
   data or a deliberate 4xx instead of a 500 on `/od-api/accessible/h3` and
   `/od-api/origins|destinations/*` (bug 1). This is the only item that
   fully blocks the HB view for these accounts.
2. **Frontend (upstream):** replace the "exactly one operator in ACL ⇒
   operator account" heuristic with the ACL's `organisation_type` (bugs 2
   and 4). Fork commit `ed7535a` can serve as a reference implementation.
3. **Frontend (upstream):** guard `renderH3Grid` against a failed
   accessible-hexes response (bug 3, fork commit `b217480`).
4. **dashboard-api:** consider lifting the `/zones` municipality-enumeration
   limit that causes 502s for province-wide accounts (context table,
   `7951529`).
