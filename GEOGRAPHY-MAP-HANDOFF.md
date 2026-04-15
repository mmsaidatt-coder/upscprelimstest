# Geography Lab — Map Interaction Bug Handoff

## The Problem

State clicking and hovering **does not work** on the interactive India map in the Geography Lab feature (`/app/geography`). When a user clicks on any state polygon, nothing happens — no state info panel opens, no highlight appears, no tooltip on hover.

## Goal

Make clicking on any state on the MapLibre map reliably:
1. **Explore mode**: Show the state info panel in the sidebar with capital, rivers, mountains, parks, key facts
2. **Quiz mode**: Register the clicked state as the user's answer for "identify" type questions
3. **Hover**: Show a tooltip with state name + capital when the mouse moves over a state polygon

## Tech Stack

- **MapLibre GL JS v5.23.0** — WebGL map renderer
- **React 19 / Next.js 16 / TypeScript** (strict, `noUncheckedIndexedAccess`)
- State polygons come from a TopoJSON file: `public/data/india-states.topojson`
  - Object key: `states`, properties: `{ st_nm: string; st_code?: string }`
  - 36 features (all Indian states and UTs including Ladakh, full J&K)

## Key Files

| File | Role |
|---|---|
| `src/components/geography/india-map.tsx` | MapLibre map component — **this is where the bug lives** |
| `src/components/geography/geography-lab.tsx` | Parent orchestrator — passes `onStateClick`, `onStateHover` callbacks |
| `src/data/india-states.ts` | State metadata (capitals, rivers, etc.), quiz question generation, memory/spaced-repetition |
| `src/data/india-geo-features.ts` | Mountains, parks, mountain ranges as GeoJSON (rivers now loaded from file) |
| `public/data/india-states.topojson` | 24KB TopoJSON with 36 state polygons |
| `public/data/india-rivers.geojson` | 30KB Natural Earth river LineStrings |

## What Has Been Tried (and Failed)

### Attempt 1: Layer-specific click events with zero-opacity fill
```js
map.addLayer({ id: "state-fill", type: "fill", source: "states",
  paint: { "fill-color": "rgba(0,0,0,0)", "fill-opacity": 0 }
});
map.on("click", "state-fill", (e) => { /* handler */ });
```
**Why it failed**: `fill-opacity: 0` means MapLibre doesn't render the fill at all. `queryRenderedFeatures` (used internally by layer-specific events) finds nothing because no pixels exist.

### Attempt 2: fill-opacity 0.01 with solid color
```js
paint: { "fill-color": "#000000", "fill-opacity": 0.01 }
```
**Why it failed**: 0.01 is below the GPU fragment discard threshold. WebGL discards near-zero alpha fragments, so `queryRenderedFeatures` still returns empty.

### Attempt 3: General click events with bbox query + fill-opacity 0.08
```js
paint: { "fill-color": "#FAF7F2", "fill-opacity": 0.08 }
map.on("click", (e) => {
  const f = queryState(e.point); // queries state-fill, state-hover, state-borders layers
  if (f?.properties?.st_nm) onStateClickRef.current(f.properties.st_nm);
});
```
**Current state** — still not working. The `queryState` helper tries point-exact, then 5px bbox expansion. It queries `["state-fill", "state-hover", "state-borders"]`. Uses callback refs to avoid stale closures. **This is the code currently in the file.**

## Root Cause Analysis

The likely remaining issues (investigate these):

1. **`queryRenderedFeatures` may still not find the fill at 0.08 opacity** — try increasing to 0.2 or higher, or use a completely different approach (point-in-polygon on the raw GeoJSON, bypassing `queryRenderedFeatures` entirely).

2. **The `state-fill` layer may not be visible because `state-borders` toggling hides related layers** — look at `layers.stateBorders` toggling in the layer visibility `useEffect` (line ~657): it controls `["state-borders", "state-hover", "state-selected", "state-correct", "state-incorrect"]` but NOT `state-fill`. If `state-fill` is hidden by some other mechanism, queries won't find it.

3. **Layer order issue** — Rivers, mountains, parks, labels are all painted ON TOP of state-fill. Even though the general `mousemove`/`click` handlers query specific layers, the `state-fill` layer is at the very bottom. MapLibre might not return features from deeply buried layers. Test by adding states LAST (on top of everything).

4. **The event handlers are registered BEFORE `map.on("load")` fires** — The `queryState` helper calls `map.getLayer("state-fill")` which returns undefined if layers haven't been added yet. The events fire but `activeLayers` is empty. The handlers ARE inside the same `useEffect` but OUTSIDE the `map.on("load", async () => { ... })` block (see lines 490-568). They should be INSIDE the load callback, after layers are added, or the check `map.getLayer(id)` should handle this gracefully.

5. **Possible approach: skip queryRenderedFeatures entirely** — Use `turf/boolean-point-in-polygon` or manually ray-cast against the raw GeoJSON stored in `statesGeoRef.current`. Convert the click `lngLat` and test against each polygon. This is the most reliable approach since it doesn't depend on rendering at all.

## Architecture Context

### How the callback flows

```
geography-lab.tsx                          india-map.tsx
─────────────────                          ─────────────
handleStateClick(name) ← onStateClick ← onStateClickRef.current(name)
  │                                           ↑
  ├─ explore mode:                     map.on("click", (e) => {
  │   setSelectedState(name)             const f = queryState(e.point)
  │   setShowPanel(true)                 f?.properties?.st_nm → ref.current()
  │                                    })
  ├─ quiz mode (identify):
  │   check answer
  │   flashResult()
  │
  └─ review mode: (clicking doesn't do anything special)
```

### The `generateId: true` on the GeoJSON source

This is critical for `feature-state` API (hover highlights, selected border, correct/incorrect fills). With `generateId: true`, MapLibre assigns sequential integer IDs (0, 1, 2...) to features. These IDs are used in:
- `map.setFeatureState({ source: "states", id: i }, { hover: true })`
- The review mode `["match", ["id"], ...]` color expression

### Base map toggle

Two raster tile sources: OpenTopoMap (terrain) and CARTO light_nolabels (clean). Toggled via `baseMap` prop. The `clean-base` layer starts with `visibility: "none"`.

## Suggested Fix Strategy

The most bulletproof approach:

1. **Don't rely on `queryRenderedFeatures` for state polygons.** Instead, on click/mousemove, convert the screen point to lng/lat, then iterate through `statesGeoRef.current.features` and do point-in-polygon testing. Use `@turf/boolean-point-in-polygon` or a simple ray-casting function. This completely sidesteps all rendering/opacity/layer-order issues.

2. If you prefer to stay with `queryRenderedFeatures`, try:
   - Move the `state-fill` layer to be the LAST layer added (on top of everything)
   - Set `fill-opacity` to at least 0.15-0.2
   - Make sure the event handlers are registered INSIDE the `map.on("load")` callback
   - Add `console.log` to debug whether `queryState` is being called and what it returns

3. Verify the fix works for all three modes (explore, quiz, review) and that hover tooltips appear.

## How to Test

```bash
npm run dev
# Open http://localhost:3000/app/geography
```

1. **Explore mode** (default): Click any state — side panel should open showing state details
2. **Hover**: Move mouse over states — tooltip should appear with state name and capital
3. **Quiz mode**: Click "Quiz" button, get an "identify" question, click the correct state on the map
4. **Review mode**: Click "Review" — states should be colored by memory strength
5. **Layer toggle**: Click the layers icon, toggle Borders off/on — clicking should still work
6. **Base map toggle**: Switch between Physical/Clean — clicking should still work on both

## Build & Lint

```bash
npm run build   # Must pass with no errors
npm run lint    # Must pass
```

TypeScript is strict with `noUncheckedIndexedAccess` — array indexing returns `T | undefined`.
