/**
 * Cross-layer geographic intersection utilities for the Geography Lab.
 *
 * Computes which National Parks / Protected Areas and Mountain Ranges
 * a given river passes through (within a proximity threshold), and vice-versa.
 *
 * Uses simple point-to-polyline Euclidean distance in degree-space — accurate
 * enough for India-level UPSC geography (1° ≈ 111 km at the equator).
 */

// ── Geometry primitives ───────────────────────────────────────────────────────

function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function pointToSegSq(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 === 0) return distSq(px, py, ax, ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len2));
  return distSq(px, py, ax + t * abx, ay + t * aby);
}

/** Minimum Euclidean distance (degrees) from a point to a polyline. */
function minDistToPolyline(
  px: number,
  py: number,
  coords: [number, number][]
): number {
  let minD = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    if (!a || !b) continue;
    const d = Math.sqrt(pointToSegSq(px, py, a[0], a[1], b[0], b[1]));
    if (d < minD) minD = d;
  }
  return minD;
}

/** True if a GeoJSON LineString/MultiLineString feature passes within `threshold` degrees of (px, py). */
function geoFeatureNearPoint(
  feature: { geometry?: { type: string; coordinates: unknown } },
  px: number,
  py: number,
  threshold: number
): boolean {
  const geom = feature.geometry;
  if (!geom) return false;

  if (geom.type === "LineString") {
    const coords = geom.coordinates as [number, number][];
    return minDistToPolyline(px, py, coords) <= threshold;
  }

  if (geom.type === "MultiLineString") {
    const lines = geom.coordinates as [number, number][][];
    return lines.some((line) => minDistToPolyline(px, py, line) <= threshold);
  }

  return false;
}

// ── Public types ──────────────────────────────────────────────────────────────

export type IntersectPark = {
  name: string;
  state: string;
  category: string; // "NP" | "TR" | "BR" | "WLS"
};

export type IntersectRange = {
  name: string;
};

export type IntersectResult = {
  focusName: string;
  focusType: "river" | "park";
  parks: IntersectPark[];
  ranges: IntersectRange[];
  rivers: string[]; // populated when focusType === "park"
};

// ── River → {parks, ranges} ───────────────────────────────────────────────────

/**
 * Given a river name and all features from the highres GeoJSON, find which
 * protected areas and mountain ranges that river passes through.
 *
 * @param riverName        - Name of the selected river
 * @param allRiverFeatures - All GeoJSON features from india-rivers-highres.geojson
 * @param parkFeatures     - NATIONAL_PARKS.features (Point geometries)
 * @param rangeFeatures    - MOUNTAIN_RANGES.features (LineString geometries)
 * @param parkThreshold    - Proximity in degrees for park match (default 0.55 ≈ 61 km)
 * @param rangeThreshold   - Proximity in degrees for range match (default 0.9 ≈ 100 km)
 */
export function computeRiverIntersections(
  riverName: string,
  allRiverFeatures: { geometry?: any; properties?: any }[],
  parkFeatures: { geometry: { type: string; coordinates: unknown }; properties: Record<string, string> }[],
  rangeFeatures: { geometry: { type: string; coordinates: unknown }; properties: Record<string, string> }[],
  parkThreshold = 0.55,
  rangeThreshold = 0.9
): Pick<IntersectResult, "parks" | "ranges"> {
  // Collect all river segments for this river name
  const riverSegs = allRiverFeatures.filter(
    (f) => f.properties?.name === riverName
  );

  if (riverSegs.length === 0) return { parks: [], ranges: [] };

  // --- Parks ---
  const parks: IntersectPark[] = [];
  for (const park of parkFeatures) {
    const coords = park.geometry.coordinates as [number, number];
    const [lon, lat] = coords;
    if (lon === undefined || lat === undefined) continue;
    const near = riverSegs.some((seg) =>
      geoFeatureNearPoint(seg, lon, lat, parkThreshold)
    );
    if (near) {
      parks.push({
        name: park.properties["name"] ?? "",
        state: park.properties["state"] ?? "",
        category: park.properties["category"] ?? "NP",
      });
    }
  }

  // --- Ranges ---
  const ranges: IntersectRange[] = [];
  for (const range of rangeFeatures) {
    const geom = range.geometry;
    if (!geom) continue;

    // Flatten all coordinates of the range polyline
    let coords: [number, number][];
    if (geom.type === "LineString") {
      coords = geom.coordinates as [number, number][];
    } else if (geom.type === "MultiLineString") {
      coords = (geom.coordinates as [number, number][][]).flat();
    } else {
      continue;
    }

    // Sample every 5th coordinate to keep it fast on long ranges
    const sampled = coords.filter((_, i) => i % 5 === 0);
    const near = sampled.some(([cx, cy]) =>
      riverSegs.some((seg) => geoFeatureNearPoint(seg, cx, cy, rangeThreshold))
    );
    if (near) {
      ranges.push({ name: range.properties["name"] ?? "" });
    }
  }

  return { parks, ranges };
}

// ── Park → {rivers} ───────────────────────────────────────────────────────────

/**
 * Given a park's coordinate, find all rivers that pass near it.
 *
 * @param parkCoord        - [lon, lat] of the park centroid
 * @param allRiverFeatures - All GeoJSON features from india-rivers-highres.geojson
 * @param threshold        - Proximity in degrees (default 0.55)
 */
export function computeParkIntersections(
  parkCoord: [number, number],
  allRiverFeatures: { geometry?: any; properties?: any }[],
  threshold = 0.55
): { rivers: string[] } {
  const seen = new Set<string>();

  for (const feature of allRiverFeatures) {
    const name = feature.properties?.name as string | undefined;
    if (!name || seen.has(name)) continue;
    if (geoFeatureNearPoint(feature, parkCoord[0], parkCoord[1], threshold)) {
      seen.add(name);
    }
  }

  return { rivers: Array.from(seen).sort() };
}
