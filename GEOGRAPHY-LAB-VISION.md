# Geography Lab — Complete Vision & Implementation Brief

## What This Is

An interactive Geography Lab for a UPSC Prelims exam prep platform (`upscprelimstest.com`). The target user is a UPSC aspirant who needs to **visually memorize** India's physical and political geography — states, rivers, mountains, national parks, passes, plains, and their spatial relationships. The feature lives at `/app/geography`.

Read `CLAUDE.md` at the project root for full tech stack, design system, and coding conventions.

## Current State

The feature exists and renders, but has two categories of problems:

### Critical Bug: Clicking/Hovering Broken
State click and hover interactions don't work. Full diagnosis and attempted fixes are in `GEOGRAPHY-MAP-HANDOFF.md`. **Fix this first before doing anything else.**

### UI/UX Problems
The current interface feels like a developer prototype, not a polished learning tool. Specific issues:
- The map looks cluttered — too many overlays competing visually
- No clear visual hierarchy between the map and controls
- The side panel feels disconnected from the map
- No visual delight or polish — it doesn't feel like a premium atlas
- Layer controls are utilitarian, not elegant
- No smooth transitions or micro-interactions
- The "Clean" vs "Physical" toggle exists but the overall look doesn't change enough between them
- Mobile experience is basic at best

---

## End Goals — The Complete Feature

### Goal 1: Fix Map Interactions (Blocking)

**State clicking and hovering must work reliably.** See `GEOGRAPHY-MAP-HANDOFF.md` for the full bug analysis. The recommended approach is to bypass `queryRenderedFeatures` and use point-in-polygon testing against the raw GeoJSON stored in `statesGeoRef.current`. This eliminates all dependency on fill opacity, layer ordering, and GPU rendering thresholds.

Verify these work after fixing:
- Explore mode: click state → side panel opens with state info
- Hover: tooltip appears with state name + capital
- Quiz mode: click state → registers as answer for "identify" questions
- Review mode: states colored by memory strength, clicking still works

### Goal 2: Atlas-Quality Map Appearance

The map should look like opening a **premium physical atlas** — the kind you'd find in a well-funded school geography department. Think National Geographic quality.

**Physical map mode** should show:
- Terrain with clear elevation coloring (greens for plains, browns for highlands, whites for peaks)
- Rivers as smooth blue curves with natural width variation (thicker for major, thinner for tributaries)
- Subtle state borders that don't fight the terrain
- Mountain peaks/passes as tasteful markers, not cluttered circles
- National parks as subtle green areas, not dots that obscure the map
- Clear visual distinction between Himalayas, Indo-Gangetic plains, Deccan plateau, coastal areas, Thar desert

**Clean map mode** should show:
- Minimal white/light gray background
- Bold, clear state borders — this is the "political map" mode
- States optionally color-coded by physical region (Himalayan, Indo-Gangetic, Western Desert, Central Highlands, etc.)
- Region colors from `REGION_COLORS` in `india-states.ts` — currently defined but unused on the map
- Perfect for studying political geography without terrain distraction

**Both modes:**
- State labels should be crisp, well-positioned, and not overlap
- Small states (Goa, Delhi, Sikkim, Tripura) need labels that don't get lost
- Zoom should reveal more detail progressively (labels appear/disappear based on zoom)

### Goal 3: Beautiful, Functional UI/UX

Design it like a product from a YC startup — clean, opinionated, delightful. The platform's design system is warm/earthy with terracotta accents (`--accent: #C4784A`), cream backgrounds (`--background: #FAF7F2`), Manrope font, large border-radius.

**Top bar:** Compact, transparent/glass-morphism, doesn't dominate. The map is the star, not the chrome.

**Layer controls:** Floating panel or bottom sheet rather than a full-width bar. Think of how Google Maps does layers — a small FAB or floating card. Should feel like part of the map, not a toolbar.

**Side panel (Explore mode):**
- When a state is selected, the info panel should be rich and visual:
  - State flag or emblem silhouette (optional, if feasible)
  - Capital with a small map marker animation
  - Rivers, mountains, parks shown as interactive chips — clicking a river chip could highlight that river on the map
  - Key UPSC facts with clear hierarchy
  - "Quiz me on this state" shortcut button
- Smooth slide-in animation
- On mobile: bottom sheet that pulls up (not a right-side panel)

**Quiz mode:**
- The question card should feel like a game, not a form
- Visual feedback: correct = green pulse on the state, confetti or check animation. Incorrect = brief red flash + the correct state highlights
- Streak counter with fire animation
- Progress ring or XP bar
- Sound effects optional (but the visual feedback must be strong)
- After each answer, briefly show a "did you know?" fact about the state

**Review mode (Spaced Repetition):**
- The memory heatmap should be immediately readable — strong/weak states obvious at a glance
- "Start review session" button that drills you on your weakest states
- Progress over time visualization (how many states mastered this week)

### Goal 4: Geographic Overlays That Teach

The overlays should help the student *learn* geography, not just decorate the map. Each overlay should be educational.

**Rivers (currently loaded from `public/data/india-rivers.geojson`):**
- Natural curved paths (already using Natural Earth data)
- Major rivers: Ganga, Yamuna, Brahmaputra, Godavari, Krishna, Narmada, Indus, Sutlej, Chenab, Mahanadi
- River labels should follow the curve of the river (MapLibre `symbol-placement: line`)
- Clicking a river should show: name, length, origin, mouth, states it flows through
- Visual distinction: major rivers thicker + darker blue, tributaries thinner + lighter

**Mountains:**
- Peaks shown as small triangle markers (not circles)
- Passes shown as gap/saddle icons
- Range labels (Western Ghats, Eastern Ghats, Aravalli, Vindhya, Satpura, Himalayas) as large rotated text along the range
- Currently defined in `src/data/india-geo-features.ts` as points/lines

**National Parks:**
- Shown as small green leaf/tree icons, not generic dots
- Click reveals: name, state, key wildlife, UNESCO status
- Currently 25 parks defined in `india-geo-features.ts`

**Future overlays to consider (not required now, but design the layer system to support them):**
- Soil types
- Climate zones (tropical, subtropical, arid, alpine)
- Major dams and reservoirs
- Important cities
- Mineral/resource belts

### Goal 5: Mobile-First Experience

The Geography Lab must work beautifully on phones. UPSC students study on their phones while commuting, in bed, during breaks.

- Map takes full screen with floating controls
- Bottom sheet for state info (not side panel)
- Swipe gestures to navigate between states in quiz mode
- Pinch-to-zoom with smooth animation
- Bottom navigation for mode switching (Explore/Quiz/Review)
- Touch targets at least 44px (already enforced in globals.css)
- No horizontal scrolling

### Goal 6: Progressive Learning Features

**Region-based exploration:**
- Let users explore by physical region (click "Himalayan" → highlights all Himalayan states, zooms to that area)
- Region descriptions with UPSC-relevant information

**Comparison mode:**
- Select two states → side-by-side comparison card (area, rivers, capitals, key facts)

**Search:**
- "Where is Narmada?" → highlights the river and zooms to it
- "Show me all states in Western Ghats" → highlights relevant states
- Search box floating on top of the map

**Bookmarks/Notes:**
- Let users pin notes to specific states ("Remember: Panna NP has diamonds")
- Stored in localStorage (same pattern as notebook entries elsewhere in the app)

---

## Key Files

| File | Purpose |
|---|---|
| `src/components/geography/india-map.tsx` | MapLibre map component — rendering, layers, interactions. **Bug lives here.** |
| `src/components/geography/geography-lab.tsx` | Parent orchestrator — mode switching, quiz logic, side panel, layer controls |
| `src/data/india-states.ts` | All 36 states/UTs with UPSC data, quiz generation, spaced repetition memory |
| `src/data/india-geo-features.ts` | Mountains (9 peaks, 11 passes, 5 ranges), parks (25), mountain range polylines. Old straight-line RIVERS export still here but unused — rivers now come from GeoJSON file |
| `public/data/india-states.topojson` | 24KB — 36 state polygons, property `st_nm` for state name |
| `public/data/india-rivers.geojson` | 30KB — Natural Earth river LineStrings (Ganga, Yamuna, Brahmaputra, etc.) |
| `src/app/app/geography/page.tsx` | Server component wrapper |
| `src/app/app/geography/loading.tsx` | Loading skeleton |
| `src/components/site/shell.tsx` | Geography route gets full-screen layout (no sidebar/header/footer) |
| `src/app/globals.css` | MapLibre tooltip and control overrides |
| `GEOGRAPHY-MAP-HANDOFF.md` | Full click-bug diagnosis with 5 root cause hypotheses |

## Tech Constraints

- **MapLibre GL JS v5.23.0** — Free, no API key. WebGL map renderer.
- **No paid tile APIs** — Use OpenTopoMap (terrain) and CARTO (clean) for base tiles. Both free.
- **No paid geocoding/search APIs** — Search should be local, against the bundled data.
- **React 19 / Next.js 16 / TypeScript strict** with `noUncheckedIndexedAccess`
- **Tailwind CSS v4** — Use the platform's design tokens from globals.css
- **Icons: Lucide React** — Don't add another icon library
- **Fonts: Manrope (sans), Fraunces (serif), Teko (display), JetBrains Mono (mono)**
- **No new heavy dependencies** without justification. `@turf/boolean-point-in-polygon` is fine for the click fix.
- Build must pass: `npm run build` and `npm run lint`

## Design System Reference

```
Background:     #FAF7F2 (warm cream)
Secondary BG:   #FFFFFF
Foreground:     #1A1A1A
Muted:          #6B7280
Border:         #E5E0DA
Accent:         #C4784A (terracotta)
Accent hover:   #B06838
Danger:         #EF4444
Success:        #10B981

Cards:          white bg, 1px border, rounded-2xl, subtle shadow
Headings:       Fraunces serif, 700 weight
Body:           Manrope sans, 400/500/600
Transitions:    150ms ease
Touch targets:  44px minimum (mobile)
```

## Priority Order

1. **Fix state clicking/hovering** (see GEOGRAPHY-MAP-HANDOFF.md) — nothing else matters until this works
2. **Clean up the map visuals** — make it look atlas-quality, not cluttered
3. **Redesign the UI chrome** — floating controls, glass-morphism top bar, better side panel
4. **Polish quiz mode** — visual feedback, animations, gamification
5. **Mobile bottom sheet** — proper mobile UX for state info
6. **Region-based exploration** — physical region highlighting and info
7. **Search** — "find Narmada", "show Western Ghats states"
8. **Review mode polish** — better heatmap, review session launcher
9. **Comparison mode** — side-by-side state comparison
10. **Bookmarks/Notes** — pin notes to states

Don't try to do everything at once. Items 1-5 are the core experience. Items 6-10 are enhancements.
