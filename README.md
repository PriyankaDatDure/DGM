# DGM Daily Weather Forecast — Transmission Form

A multi-step data-entry form for the Directorate General of Meteorology (DGM) of the
Central African Republic, built against the **revised** conceptual template
(`Conceptual_template_DGM_daily_weather_forecast_form_CAR_EN_regions_1.xlsx`).

## What this is — and isn't

This is a **front-end prototype** built to spec for handoff. It is:
- A fully working, validated multi-step form matching every field, list, and
  validation rule in the client's spreadsheet.
- Type-safe (TypeScript), builds clean with zero errors (`npm run build` verified).

It is **not**:
- Connected to a database or API. All state lives in React memory (`FormWizard.tsx`)
  and is lost on page refresh.
- Authenticated. There is no login.
- Production-deployed. No CI/CD, no hosting config beyond default Next.js.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

Requires Node 18.18+ (Next.js 16 requirement).

## Project structure

```
app/                     Next.js App Router entry (layout, page, global CSS)
components/
  FormWizard.tsx          Top-level state holder, step navigation, validation trigger
  Field.tsx                Shared label/error/warning wrapper for a single input
  WeatherFields.tsx         Shared 11-field weather block (used by national + region steps)
  steps/                   One component per wizard step
lib/
  types.ts                 All data shapes, matching Data_Dictionary / DB_Schema sheets
  constants.ts              Dropdown lists (regions, prefectures, hazards, etc.)
  validation.ts              Pure function: BulletinData -> { blocking[], warnings[] }
```

`lib/validation.ts` is intentionally separate from the UI — it's pure functions, easy
to unit test, and the same logic the backend should eventually replicate server-side
(never trust client-side validation alone for a real submission endpoint).

## Open items from the client spec — resolve before going live

1. **"Yes/No" reference list is unused.** The Lists sheet defines an 8th table
   (Yes/No) that no field in the Data Dictionary references. Confirm with the client
   whether a field was dropped from this version of the spec before ignoring it.

2. **No backend contract yet.** `FormWizard.submitBulletin()` currently just
   `console.log`s the payload. Suggested next step: a `POST /api/bulletins` endpoint
   accepting the `BulletinData` shape from `lib/types.ts`, which maps directly onto
   the `DB_Schema` sheet (weather_bulletin / national_forecast / region_forecast /
   regional_hazard_risk / meteorological_interpretation tables).

3. **Re-implement validation server-side.** The blocking/warning rules in
   `lib/validation.ts` must also run on the backend before writing to the database —
   a client can always be bypassed.

5. **Timeline:** the client's spec states the form must be ready for DGM testing by
   29 June 2026, with live data transmission starting 1 July 2026. Confirm this is
   still realistic once backend work is scoped.

## Known/accepted dependency risk

`npm audit` reports a moderate-severity issue in a transitive `postcss` version
pulled in by Next.js itself (CSS stringify XSS, GHSA-qx2v-qp2m-jg93). It is not
fixable without downgrading Next.js to an ancient, far less secure version, so it's
left as-is. Worth re-checking when Next.js ships a patch.

## Design notes

- Validation runs on-demand ("Run validation check" / on final submit), not on every
  keystroke, to keep the form usable for a non-technical forecaster typing under
  time pressure.
- Field-level errors (`fieldBlocking`/`fieldWarning` sets in `lib/types.ts`) use a
  `"section:key"` or `"section:region:hazard:key"` string convention — see
  `lib/validation.ts` for the exact keys each step listens for.
- No external UI library or CSS framework — plain CSS in `app/globals.css` — to keep
  the dependency surface minimal for whoever inherits this.
