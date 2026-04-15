"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { feature } from "topojson-client";
import { geoContains } from "d3-geo";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import { RIVERS, MOUNTAINS, NATIONAL_PARKS, MOUNTAIN_RANGES } from "@/data/india-geo-features";
import {
  STATE_BY_NAME,
  REGION_COLORS,
  getMemoryStrength,
  type StateMemory,
} from "@/data/india-states";

// Ranges that belong to the Himalayan system (for filtering)
const HIMALAYAN_RANGES = [
  "Himalayas", "Great Himalayas", "Lesser Himalayas", "Karakoram",
  "Pir Panjal", "Ladakh", "Zaskar", "Shivalik", "Patkai",
  "Ladakh Range", "Zaskar Range",
];

// ── Types ────────────────────────────────────────────────────────────────────────

export type MapMode = "explore" | "quiz" | "review";

export type BaseMapStyle = "physical" | "satellite" | "clean";

export type LayerVisibility = {
  stateBorders: boolean;
  rivers: boolean;
  mountains: boolean;
  ranges: boolean;
  parks: boolean;
  stateLabels: boolean;
};

type IndiaMapProps = {
  mode: MapMode;
  baseMap: BaseMapStyle;
  selectedState: string | null;
  highlightedState: string | null;
  correctState: string | null;
  incorrectState: string | null;
  memory: Record<string, StateMemory>;
  selectedFeatureName?: string | null;
  disableStateSelection?: boolean;
  activeFilter?: string;
  riverLevel?: number;
  riverBasin: string;
  hiddenRivers?: string[];
  hiddenPeaks?: string[];
  layers: LayerVisibility;
  /** Names of the focused mountain ranges (spotlight mode) */
  selectedRanges?: string[];
  onStateClick: (name: string) => void;
  onStateHover: (name: string | null) => void;
  onFeatureClick?: (properties: any) => void;
};

// ── Strength → color for review mode ─────────────────────────────────────────────

function strengthColor(strength: number): string {
  if (strength === 0) return "rgba(100,100,100,0.25)";
  if (strength < 0.3) return "rgba(239,68,68,0.45)";
  if (strength < 0.6) return "rgba(245,158,11,0.40)";
  if (strength < 0.85) return "rgba(59,130,246,0.35)";
  return "rgba(16,185,129,0.35)";
}

// ── State centroids (approximate) for labels ─────────────────────────────────────

const STATE_CENTROIDS: Record<string, [number, number]> = {
  "Jammu and Kashmir": [75.3, 34.2],
  "Ladakh": [77.6, 34.2],
  "Himachal Pradesh": [77.4, 31.8],
  "Punjab": [75.8, 31.0],
  "Uttarakhand": [79.2, 30.1],
  "Haryana": [76.4, 29.2],
  "Delhi": [77.2, 28.6],
  "Rajasthan": [73.8, 26.6],
  "Uttar Pradesh": [80.8, 27.2],
  "Bihar": [85.5, 25.8],
  "Sikkim": [88.5, 27.5],
  "Arunachal Pradesh": [94.5, 28.0],
  "Nagaland": [94.5, 26.1],
  "Manipur": [93.9, 25.0],
  "Mizoram": [92.7, 23.3],
  "Tripura": [91.7, 23.8],
  "Meghalaya": [91.3, 25.5],
  "Assam": [92.9, 26.5],
  "West Bengal": [87.8, 23.5],
  "Jharkhand": [85.6, 23.6],
  "Odisha": [84.3, 20.5],
  "Chhattisgarh": [82.0, 21.6],
  "Madhya Pradesh": [78.5, 23.8],
  "Gujarat": [71.7, 22.5],
  "Maharashtra": [76.0, 19.4],
  "Telangana": [79.0, 17.8],
  "Andhra Pradesh": [79.7, 15.9],
  "Karnataka": [76.0, 14.5],
  "Goa": [74.0, 15.4],
  "Kerala": [76.3, 10.5],
  "Tamil Nadu": [78.5, 11.0],
  "Chandigarh": [76.8, 30.7],
  "Puducherry": [79.8, 11.9],
  "Andaman and Nicobar Islands": [92.7, 11.7],
  "Lakshadweep": [72.6, 10.6],
  "Dadra and Nagar Haveli and Daman and Diu": [73.0, 20.3],
};

// ── Component ────────────────────────────────────────────────────────────────────

// Approximate bounding boxes for each named range for cinematic fly-to
const RANGE_BOUNDS: Record<string, [[number, number], [number, number]]> = {
  "Greater Himalayas":  [[73.0, 27.5], [97.0, 36.0]],
  "Shivalik Hills":     [[73.5, 26.5], [89.0, 33.0]],
  "Karakoram":          [[73.5, 34.5], [79.5, 37.5]],
  "Pir Panjal":         [[73.0, 32.5], [77.5, 34.5]],
  "Ladakh Range":       [[75.5, 33.0], [79.5, 35.5]],
  "Zaskar Range":       [[75.5, 32.5], [79.0, 35.0]],
  "Patkai Range":       [[93.5, 25.5], [97.5, 29.0]],
  "Garo Hills":         [[89.5, 25.0], [91.0, 26.0]],
  "Khasi Hills":        [[90.5, 25.0], [92.0, 26.0]],
  "Jaintia Hills":      [[91.5, 24.8], [93.0, 26.0]],
  "Western Ghats":      [[72.5, 8.0],  [77.5, 21.5]],
  "Eastern Ghats":      [[78.0, 11.0], [86.5, 22.0]],
  "Aravalli":           [[72.0, 23.5], [77.5, 29.0]],
  "Vindhya":            [[75.5, 23.0], [82.5, 24.5]],
  "Satpura":            [[76.0, 21.0], [82.0, 23.5]],
};

export function IndiaMap({
  mode,
  baseMap,
  selectedState,
  highlightedState,
  correctState,
  incorrectState,
  memory,
  layers,
  selectedFeatureName,
  disableStateSelection = false,
  activeFilter = "All",
  riverLevel,
  riverBasin,
  hiddenRivers = [],
  hiddenPeaks = [],
  selectedRanges = [],
  onStateClick,
  onStateHover,
  onFeatureClick,
}: IndiaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const statesGeoRef = useRef<FeatureCollection | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const onStateClickRef = useRef(onStateClick);
  const onStateHoverRef = useRef(onStateHover);
  const onFeatureClickRef = useRef(onFeatureClick);
  const disableStateSelectionRef = useRef(disableStateSelection);
  const modeRef = useRef(mode);

  useEffect(() => {
    onStateClickRef.current = onStateClick;
    onStateHoverRef.current = onStateHover;
    onFeatureClickRef.current = onFeatureClick;
    disableStateSelectionRef.current = disableStateSelection;
    modeRef.current = mode;
  }, [onStateClick, onStateHover, onFeatureClick, disableStateSelection, mode]);

  // ── Initialize map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
        sources: {
          // High-resolution satellite imagery — shows real greenery (forests),
          // deserts, water, and terrain with photographic fidelity (maxzoom 19)
          "satellite-tiles": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution:
              "Imagery &copy; Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN",
            maxzoom: 19,
          },
          // Crisp hillshade overlay — punches up 3D topography (Himalayas,
          // Ghats, plateau escarpments) when blended over imagery
          "hillshade-tiles": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: "Hillshade &copy; Esri",
            maxzoom: 16,
          },
          // Atlas-style base for political/clean mode (no labels, light palette)
          "clean-tiles": {
            type: "raster",
            tiles: [
              "https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
              "https://b.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
              "https://c.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}@2x.png",
            ],
            tileSize: 256,
            attribution: "&copy; CARTO",
            maxzoom: 19,
          },
        },
        layers: [
          // Satellite imagery (shown in "terrain" + "satellite" modes)
          {
            id: "topo-base",
            type: "raster",
            source: "satellite-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
          // Shaded relief overlay (only shown in "terrain" mode — blended on
          // top of satellite to amplify topographic shadows)
          {
            id: "hillshade-base",
            type: "raster",
            source: "hillshade-tiles",
            minzoom: 0,
            maxzoom: 19,
            paint: { "raster-opacity": 0.4 },
          },
          // Political atlas base (shown in "clean" mode)
          {
            id: "clean-base",
            type: "raster",
            source: "clean-tiles",
            minzoom: 0,
            maxzoom: 19,
            layout: { visibility: "none" },
          },
        ],
      },
      center: [82, 22],
      zoom: 4.3,
      minZoom: 3.5,
      maxZoom: 10,
      maxBounds: [
        [60, 5],
        [100, 40],
      ],
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "geo-tooltip",
      offset: 12,
    });

    map.on("load", async () => {
      try {
        // Fetch and add state boundaries
        const topoResp = await fetch("/data/india-states.topojson");
        const topo = await topoResp.json() as Topology;
        {
          type SP = { st_nm: string; st_code?: string };
          const obj = topo.objects.states as GeometryCollection<SP>;
          const geo = feature(topo, obj) as FeatureCollection<Geometry, SP>;
          statesGeoRef.current = geo;

          // ── State boundaries source ──
          map.addSource("states", { type: "geojson", data: geo, generateId: true });

          // State fill — visible enough to guarantee GPU renders it for queryRenderedFeatures
          map.addLayer({
            id: "state-fill",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": "#FAF7F2",
              "fill-opacity": 0.08,
            },
          });

          // State borders — thin solid lines like a political atlas
          map.addLayer({
            id: "state-borders",
            type: "line",
            source: "states",
            paint: {
              "line-color": "#6B7280",
              "line-width": [
                "interpolate", ["linear"], ["zoom"],
                3.5, 0.5,
                6, 1,
                8, 1.5,
              ],
              "line-opacity": 0.4,
            },
          });

          // Hover highlight fill
          map.addLayer({
            id: "state-hover",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": "#C4784A",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                0.25,
                0,
              ],
            },
          });

          // Selected state highlight
          map.addLayer({
            id: "state-selected",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": "#C4784A",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                0.4,
                0,
              ],
            },
          });

          // Correct state highlight
          map.addLayer({
            id: "state-correct",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": "#10B981",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "correct"], false],
                0.5,
                0,
              ],
            },
          });

          // Incorrect state highlight
          map.addLayer({
            id: "state-incorrect",
            type: "fill",
            source: "states",
            paint: {
              "fill-color": "#EF4444",
              "fill-opacity": [
                "case",
                ["boolean", ["feature-state", "incorrect"], false],
                0.5,
                0,
              ],
            },
          });

          // ── Rivers (High-Resolution Organic Vectors) ──
          const riversResp = await fetch("/data/india-rivers-highres.geojson");
          const riversGeo = await riversResp.json();
          map.addSource("rivers", { type: "geojson", data: riversGeo });

          // Soft waterway halo — subtle glow like an atlas
          map.addLayer({
            id: "rivers-glow",
            type: "line",
            source: "rivers",
            paint: {
              "line-color": "#60A5FA",
              "line-width": ["case", ["==", ["get", "type"], "major"], 6, 3.5],
              "line-opacity": 0.35,
              "line-blur": 2,
            },
            layout: {
              "line-cap": "round",
              "line-join": "round",
              visibility: "visible",
            },
          });

          // Fat invisible hit-box for easy cursor pinpointing
          map.addLayer({
            id: "rivers-hitbox",
            type: "line",
            source: "rivers",
            paint: {
              "line-color": "#000000",
              "line-width": 16,
              "line-opacity": 0.001,
            },
            layout: {
              "line-cap": "round",
              "line-join": "round",
              visibility: "visible",
            },
          });

          // River core line — atlas blue with natural width variation
          map.addLayer({
            id: "rivers-line",
            type: "line",
            source: "rivers",
            paint: {
              "line-color": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                "#C4784A",
                [
                  "interpolate", ["linear"], ["get", "level"],
                  1, "#1E40AF",
                  2, "#1D4ED8",
                  3, "#2563EB",
                  4, "#3B82F6",
                  5, "#60A5FA"
                ]
              ],
              "line-width": [
                "case",
                ["boolean", ["feature-state", "selected"], false],
                3.5,
                [
                  "interpolate", ["linear"], ["get", "level"],
                  1, 2.2,
                  2, 1.6,
                  3, 1.1,
                  4, 0.8,
                  5, 0.6
                ]
              ],
              "line-opacity": [
                "interpolate", ["linear"], ["get", "level"],
                1, 1.0,
                3, 0.9,
                5, 0.75
              ],
            },
            layout: {
              "line-cap": "round",
              "line-join": "round",
              visibility: "visible",
            },
          });

          // Curved river labels — subtle italic feel
          map.addLayer({
            id: "rivers-labels",
            type: "symbol",
            source: "rivers",
            filter: ["<=", ["get", "level"], 3],
            layout: {
              "symbol-placement": "line",
              "text-field": ["get", "name"],
              "text-font": ["Open Sans Regular"],
              "text-size": [
                "interpolate", ["linear"], ["get", "level"],
                1, 12,
                2, 10.5,
                3, 9
              ],
              "text-letter-spacing": 0.08,
              "text-allow-overlap": false,
              "symbol-spacing": 300,
              visibility: "visible",
            },
            paint: {
              "text-color": "#1E40AF",
              "text-halo-color": "rgba(255,255,255,0.9)",
              "text-halo-width": 1.5,
              "text-halo-blur": 0.5,
            }
          });

          // Highlight layer for selected river
          map.addLayer({
            id: "rivers-highlight",
            type: "line",
            source: "rivers",
            filter: ["==", ["get", "name"], ""],
            paint: {
              "line-color": "#C4784A",
              "line-width": 3.5,
              "line-opacity": 0.9,
              "line-blur": 0.5,
            },
            layout: {
              "line-cap": "round",
              "line-join": "round",
            },
          });

          // ── Mountain ranges ──
          map.addSource("mountain-ranges", { type: "geojson", data: MOUNTAIN_RANGES as unknown as GeoJSON.FeatureCollection });

          // Canvas mountain-wedge icons (reliable — no font-glyph dependency)
          const makeMtRangeIcon = (fillColor: string, w: number, h: number): ImageData => {
            const c = document.createElement("canvas");
            c.width = w; c.height = h;
            const ctx = c.getContext("2d")!;
            ctx.clearRect(0, 0, w, h);
            ctx.beginPath();
            ctx.moveTo(w / 2, 0);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            return ctx.getImageData(0, 0, w, h);
          };
          if (!map.hasImage("range-tri"))    map.addImage("range-tri",    makeMtRangeIcon("#7C4A1E", 12, 8));
          if (!map.hasImage("range-tri-hi")) map.addImage("range-tri-hi", makeMtRangeIcon("#451a03", 14, 9));

          // Wide ambient glow behind the range band
          map.addLayer({
            id: "mountain-range-band",
            type: "line",
            source: "mountain-ranges",
            layout: { visibility: "visible" },
            paint: {
              "line-color": "#92400E",
              "line-width": 10,
              "line-opacity": 0.07,
              "line-blur": 5,
            },
          });

          // Dashed axis line — always visible at low opacity
          map.addLayer({
            id: "mountain-range-line",
            type: "line",
            source: "mountain-ranges",
            layout: { visibility: "visible" },
            paint: {
              "line-color": "#92400E",
              "line-width": 1.5,
              "line-opacity": 0.45,
              "line-dasharray": [5, 4],
            },
          });

          // Mountain-wedge symbols along the range axis
          map.addLayer({
            id: "mountain-range-symbols",
            type: "symbol",
            source: "mountain-ranges",
            layout: {
              "icon-image": "range-tri",
              "symbol-placement": "line",
              "symbol-spacing": 18,
              "icon-allow-overlap": true,
              "icon-anchor": "bottom",
              "icon-size": 1,
              "icon-rotation-alignment": "viewport",
              visibility: "visible",
            },
            paint: { "icon-opacity": 0.5 },
          });

          // ── Spotlight: focused range ──
          map.addSource("focused-range", {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
          });

          // Outer ambient glow
          map.addLayer({
            id: "focused-range-glow",
            type: "line",
            source: "focused-range",
            paint: {
              "line-color": "#D97706",
              "line-width": 22,
              "line-opacity": 0.15,
              "line-blur": 8,
            },
          });

          // Inner warm band
          map.addLayer({
            id: "focused-range-band",
            type: "line",
            source: "focused-range",
            paint: {
              "line-color": "#D97706",
              "line-width": 7,
              "line-opacity": 0.22,
              "line-blur": 2,
            },
          });

          // Crisp bold centre line
          map.addLayer({
            id: "focused-range-core",
            type: "line",
            source: "focused-range",
            paint: {
              "line-color": "#7C2D12",
              "line-width": 2.5,
              "line-opacity": 1,
            },
          });

          // Dense mountain-wedge symbols along selected range
          map.addLayer({
            id: "focused-range-symbols",
            type: "symbol",
            source: "focused-range",
            layout: {
              "icon-image": "range-tri-hi",
              "symbol-placement": "line",
              "symbol-spacing": 14,
              "icon-allow-overlap": true,
              "icon-anchor": "bottom",
              "icon-size": 1.2,
              "icon-rotation-alignment": "viewport",
            },
            paint: { "icon-opacity": 1 },
          });

          // Name label for focused range
          map.addLayer({
            id: "focused-range-label",
            type: "symbol",
            source: "focused-range",
            layout: {
              "text-field": ["upcase", ["get", "name"]],
              "text-size": 15,
              "text-font": ["Open Sans Regular"],
              "text-letter-spacing": 0.25,
              "symbol-placement": "line",
              "symbol-spacing": 500,
              "text-max-angle": 25,
            },
            paint: {
              "text-color": "#FEF3C7",
              "text-halo-color": "rgba(20,10,0,0.85)",
              "text-halo-width": 3,
              "text-halo-blur": 1,
              "text-opacity": 1,
            },
          });

          // ── Mountain peaks & passes ──
          map.addSource("mountains", { type: "geojson", data: MOUNTAINS as unknown as GeoJSON.FeatureCollection });

          // Canvas-based icons for peaks (brown triangle) and passes (blue circle)
          const makeMtIcon = (color: string, size: number, isTriangle: boolean): ImageData => {
            const c = document.createElement("canvas");
            c.width = size; c.height = size;
            const ctx = c.getContext("2d")!;
            ctx.clearRect(0, 0, size, size);
            if (isTriangle) {
              const pad = 1.5;
              ctx.beginPath();
              ctx.moveTo(size / 2, pad);
              ctx.lineTo(size - pad, size - pad);
              ctx.lineTo(pad, size - pad);
              ctx.closePath();
            } else {
              ctx.beginPath();
              ctx.arc(size / 2, size / 2, size / 2 - 1.5, 0, Math.PI * 2);
            }
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,0.92)";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            return ctx.getImageData(0, 0, size, size);
          };
          if (!map.hasImage("peak-icon")) map.addImage("peak-icon", makeMtIcon("#7C3A15", 18, true));
          if (!map.hasImage("pass-icon")) map.addImage("pass-icon", makeMtIcon("#2563EB", 11, false));

          // Mountain markers — compact, compact
          map.addLayer({
            id: "mountain-highlight",
            type: "circle",
            source: "mountains",
            filter: ["in", ["get", "name"], ["literal", []]],
            paint: {
              "circle-radius": 12,
              "circle-color": "#C4784A",
              "circle-opacity": 0.25,
              "circle-blur": 0.4,
            },
          });

          // Mountain symbol — brown triangle for peaks, blue dot for passes
          map.addLayer({
            id: "mountain-peaks",
            type: "symbol",
            source: "mountains",
            filter: ["in", ["get", "type"], ["literal", ["peak", "pass"]]],
            layout: {
              "icon-image": ["case", ["==", ["get", "type"], "peak"], "peak-icon", "pass-icon"],
              "icon-size": 1,
              "icon-allow-overlap": true,
              "icon-anchor": "center",
              visibility: "visible",
            },
            paint: {
              "icon-opacity": 1,
            },
          });

          // Name + elevation label below the icon
          map.addLayer({
            id: "mountain-labels",
            type: "symbol",
            source: "mountains",
            filter: ["in", ["get", "type"], ["literal", ["peak", "pass"]]],
            layout: {
              "text-field": [
                "concat",
                ["get", "name"],
                "  ",
                ["to-string", ["get", "elevation"]],
                "m",
              ],
              "text-size": 10,
              "text-font": ["Open Sans Regular"],
              "text-offset": [0, 1.4],
              "text-anchor": "top",
              "text-allow-overlap": false,
              "symbol-sort-key": ["*", -1, ["get", "elevation"]],
              visibility: "visible",
            },
            paint: {
              "text-color": ["case", ["==", ["get", "type"], "pass"], "#1E40AF", "#92400E"],
              "text-halo-color": "rgba(255,255,255,0.92)",
              "text-halo-width": 1.5,
            },
          });

          // Range labels — text along the mountain range polylines
          map.addLayer({
            id: "range-labels",
            type: "symbol",
            source: "mountain-ranges",
            layout: {
              "text-field": ["upcase", ["get", "name"]],
              "text-size": 12,
              "text-font": ["Open Sans Regular"],
              "text-letter-spacing": 0.2,
              "symbol-placement": "line",
              "symbol-spacing": 400,
              "text-max-angle": 30,
              visibility: "visible",
            },
            paint: {
              "text-color": "#451A03",
              "text-halo-color": "rgba(255,255,255,1)",
              "text-halo-width": 3,
              "text-halo-blur": 1,
              "text-opacity": 0.95,
            },
          });

          // ── National Parks ──
          map.addSource("parks", { type: "geojson", data: NATIONAL_PARKS as unknown as GeoJSON.FeatureCollection });
          
          map.addLayer({
            id: "park-highlight",
            type: "circle",
            source: "parks",
            filter: ["in", ["get", "name"], ["literal", []]],
            paint: {
              "circle-radius": 8,
              "circle-color": "#C4784A",
              "circle-opacity": 0.9,
              "circle-blur": 0.2,
            },
          });

          // Outer ring — category-coded color
          map.addLayer({
            id: "park-glow",
            type: "circle",
            source: "parks",
            paint: {
              "circle-radius": 8,
              "circle-color": [
                "case",
                ["==", ["get", "category"], "TR"], "#F59E0B",
                ["==", ["get", "category"], "BR"], "#8B5CF6",
                ["==", ["get", "category"], "WLS"], "#06B6D4",
                "#16A34A"
              ],
              "circle-opacity": 0.15,
              "circle-blur": 0.5,
            },
          });

          // Solid dot — category-coded
          map.addLayer({
            id: "park-dots",
            type: "circle",
            source: "parks",
            paint: {
              "circle-radius": 4.5,
              "circle-color": [
                "case",
                ["==", ["get", "category"], "TR"], "#F59E0B",
                ["==", ["get", "category"], "BR"], "#8B5CF6",
                ["==", ["get", "category"], "WLS"], "#06B6D4",
                "#16A34A"
              ],
              "circle-stroke-color": "#FFFFFF",
              "circle-stroke-width": 1.5,
            },
          });

          // Park name label below icon
          map.addLayer({
            id: "park-labels",
            type: "symbol",
            source: "parks",
            layout: {
              "text-field": ["get", "name"],
              "text-size": 10,
              "text-font": ["Open Sans Regular"],
              "text-offset": [0, 1.6],
              "text-anchor": "top",
              "text-allow-overlap": false,
              visibility: "visible",
            },
            paint: {
              "text-color": [
                "case",
                ["==", ["get", "category"], "TR"], "#B45309",
                ["==", ["get", "category"], "BR"], "#6D28D9",
                ["==", ["get", "category"], "WLS"], "#0E7490",
                "#15803D"
              ],
              "text-halo-color": "rgba(255,255,255,0.92)",
              "text-halo-width": 1.5,
            },
          });

          // ── State labels ──
          const labelFeatures = Object.entries(STATE_CENTROIDS).map(
            ([name, coords]) => ({
              type: "Feature" as const,
              properties: { name },
              geometry: { type: "Point" as const, coordinates: coords },
            })
          );
          map.addSource("state-labels", {
            type: "geojson",
            data: { type: "FeatureCollection", features: labelFeatures },
          });
          map.addLayer({
            id: "state-label-text",
            type: "symbol",
            source: "state-labels",
            layout: {
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-font": ["Open Sans Regular"],
              "text-transform": "uppercase",
              "text-letter-spacing": 0.05,
              visibility: "none", // off by default
            },
            paint: {
              "text-color": "#1A1A1A",
              "text-halo-color": "rgba(255,255,255,0.85)",
              "text-halo-width": 2,
            },
          });

          setMapReady(true);
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
      }
    });

    // ── Helper: query state features by raw GeoJSON for reliability ──
    const queryState = (lngLat: maplibregl.LngLat) => {
      if (!statesGeoRef.current) return null;
      for (let i = 0; i < statesGeoRef.current.features.length; i++) {
        const f = statesGeoRef.current.features[i];
        if (f && f.geometry) {
          // Explicitly cast to any since geoContains typing can be strict
          if (geoContains(f as any, [lngLat.lng, lngLat.lat])) {
            return { id: i, properties: f.properties };
          }
        }
      }
      return null;
    };

    // ── Hover interaction ──
    let hoveredId: number | null = null;

    map.on("mousemove", (e) => {
      // If quiz is active, hover popups must be aggressively silenced to prevent cheating!
      if (modeRef.current === "quiz") {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
        return;
      }
      
      let f = null;
      if (!disableStateSelectionRef.current) {
        f = queryState(e.lngLat);
      }
      
      if (f) {
        map.getCanvas().style.cursor = "pointer";
        const name = f.properties?.st_nm as string;

        if (hoveredId !== null && hoveredId !== (f.id as number)) {
          map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
        }
        hoveredId = f.id as number;
        map.setFeatureState({ source: "states", id: hoveredId }, { hover: true });
        onStateHoverRef.current(name);

        const stateData = STATE_BY_NAME[name];
        const tooltipHtml = stateData
          ? `<strong>${name}</strong><br/><span style="color:#6B7280;font-size:11px">${stateData.capital} &middot; ${stateData.type}</span>`
          : `<strong>${name}</strong>`;
        popupRef.current?.setLngLat(e.lngLat).setHTML(tooltipHtml).addTo(map);
      } else if (!disableStateSelectionRef.current && hoveredId !== null) {
        // Clear state hover if not hovering state
        map.setFeatureState({ source: "states", id: hoveredId }, { hover: false });
        hoveredId = null;
        onStateHoverRef.current(null);
      }

      // Check parks/mountains/rivers/ranges for their tooltips
      const parkHits = map.getLayer("park-dots")
        ? map.queryRenderedFeatures(e.point, { layers: ["park-dots"] })
        : [];
      const mtHits = map.getLayer("mountain-peaks")
        ? map.queryRenderedFeatures(e.point, { layers: ["mountain-peaks"] })
        : [];
      const riverHits = map.getLayer("rivers-hitbox")
        ? map.queryRenderedFeatures(e.point, { layers: ["rivers-hitbox"] })
        : [];
      const rangeHits = map.getLayer("mountain-range-line")
        ? map.queryRenderedFeatures(e.point, { layers: ["mountain-range-line"] })
        : [];

      if (parkHits.length > 0 && parkHits[0]?.properties) {
        map.getCanvas().style.cursor = "pointer";
        const p = parkHits[0].properties;
        const categoryIcon = p.category === "TR" ? "🐅" : p.category === "BR" ? "🦅" : p.category === "WLS" ? "🦌" : "🌿";
        const html = `<strong style="color:#16A34A">${categoryIcon} ${p.name}</strong><br/><span style="color:#6B7280;font-size:11px">${p.state}${p.unesco ? " · UNESCO" : ""}</span>`;
        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
      } else if (mtHits.length > 0 && mtHits[0]?.properties) {
        map.getCanvas().style.cursor = "pointer";
        const p = mtHits[0].properties;
        const icon = p.type === "peak" ? "⛰️" : "🏔️";
        const html = `<strong style="color:#92400E">${icon} ${p.name}</strong><br/><span style="color:#6B7280;font-size:11px">${p.elevation || '? '}m · ${p.range || ''}</span>`;
        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
      } else if (riverHits.length > 0 && riverHits[0]?.properties) {
        map.getCanvas().style.cursor = "pointer";
        const p = riverHits[0].properties;
        const nameText = p.name ? p.name : "Unknown Stream";
        const levelLabel = p.level === 1 ? "Major" : p.level === 2 ? "Major" : p.level === 3 ? "Tributary" : "Minor";
        const html = `<strong style="color:#1E40AF">${nameText}</strong><br/><span style="color:#6B7280;font-size:11px">${levelLabel} · ${p.basin || "Unknown Basin"}</span>`;
        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
      } else if (rangeHits.length > 0 && rangeHits[0]?.properties) {
        map.getCanvas().style.cursor = "pointer";
        const p = rangeHits[0].properties;
        const html = `<strong style="color:#8B5A2B">🗺️ ${p.name}</strong><br/><span style="color:#6B7280;font-size:11px">${p.type === "ghats" ? "Ghats / Escarpment" : "Mountain Range"}</span>`;
        popupRef.current?.setLngLat(e.lngLat).setHTML(html).addTo(map);
      } else if (!f) {
        // Nothing hovered at all
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      }
    });

    // ── Click ──
    map.on("click", (e) => {
      // Create a 20px bounding box for ultra touch-friendly hit detection
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 20, e.point.y - 20],
        [e.point.x + 20, e.point.y + 20]
      ];
      
      // 1. Intercept physical feature clicks first
      // Include labels as hit targets so clicking text works!
      const featureHits = map.queryRenderedFeatures(bbox, {
        layers: [
          "park-dots", "park-labels", 
          "mountain-peaks", "mountain-labels", "range-labels",
          "rivers-hitbox", "rivers-line", "rivers-labels",
          "mountain-range-line"
        ]
      });

      if (featureHits.length > 0 && onFeatureClickRef.current) {
        // Bundle all uniquely hit features collectively so the game engine can evaluate tap accuracy gracefully
        const uniqueHits = new Map<string, any>();
        featureHits.forEach(hit => {
           let props = hit.properties;
           if (!props || !props.name) return;
           const layerId = hit.layer.id;
           
           if (layerId.startsWith("park")) props = { ...props, _category: "park" };
           else if (layerId.startsWith("mountain-peak") || layerId === "mountain-labels") props = { ...props, _category: "mountain" };
           else if (layerId.startsWith("river")) props = { ...props, _category: "river" };
           else if (layerId === "mountain-range-line" || layerId === "range-labels") props = { ...props, _category: "range" };
           
           if (!uniqueHits.has(props.name)) uniqueHits.set(props.name, props);
        });

        const hitPropertiesArray = Array.from(uniqueHits.values());
        if (hitPropertiesArray.length > 0) {
           onFeatureClickRef.current(hitPropertiesArray);
           
           // Extract the most prominent physical marker to target the cinematic pan
           const primaryHit = hitPropertiesArray[0];
           
           // ── Apple-Grade Cinematic Camera Pan ──
           map.flyTo({
             center: e.lngLat,
             zoom: Math.max(map.getZoom(), 5.5),
             speed: 0.8,
             curve: 1.2,
             easing(t) { return t * (2 - t); }
           });
           
           return; // Prevent state click fallback
        }
      }

      // 2. Fallback to state polygon
      if (!disableStateSelectionRef.current) {
        const f = queryState(e.lngLat);
        if (f?.properties?.st_nm) {
          // ── Apple-Grade Cinematic Camera Pan ──
          map.flyTo({
            center: e.lngLat,
            speed: 0.8,
            curve: 1.2,
            easing(t) { return t * (2 - t); }
          });
          
          onStateClickRef.current(f.properties.st_nm as string);
        }
      }
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync selected/correct/incorrect states ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !statesGeoRef.current) return;

    const geo = statesGeoRef.current;
    geo.features.forEach((f, i) => {
      const name = (f.properties as { st_nm: string }).st_nm;
      map.setFeatureState(
        { source: "states", id: i },
        {
          selected: selectedState === name,
          correct: correctState === name,
          incorrect: incorrectState === name,
          highlighted: highlightedState === name,
        }
      );
    });
  }, [selectedState, correctState, incorrectState, highlightedState, mapReady]);

  // ── Review mode: paint memory heatmap ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (mode === "review") {
      // Build color expression from memory data
      const geo = statesGeoRef.current;
      if (!geo) return;

      const colorStops: (string | number)[] = [];
      geo.features.forEach((f, i) => {
        const name = (f.properties as { st_nm: string }).st_nm;
        const mem = memory[name];
        const color = strengthColor(getMemoryStrength(mem));
        colorStops.push(i, color);
      });

      // Use match expression on feature ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const colorExpr = ["match", ["id"], ...colorStops, "rgba(100,100,100,0.25)"] as any;

      map.setPaintProperty("state-fill", "fill-color", colorExpr);
      map.setPaintProperty("state-fill", "fill-opacity", 1);
    } else if (baseMap === "clean") {
      const geo = statesGeoRef.current;
      if (!geo) return;
      const colorStops: (string | string)[] = [];
      geo.features.forEach((f) => {
        const name = (f.properties as { st_nm: string }).st_nm;
        const r = STATE_BY_NAME[name]?.region;
        const color = r ? REGION_COLORS[r].fill : "#FAF7F2";
        colorStops.push(name, color);
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const colorExpr = ["match", ["get", "st_nm"], ...colorStops, "#FAF7F2"] as any;
      map.setPaintProperty("state-fill", "fill-color", colorExpr);
      map.setPaintProperty("state-fill", "fill-opacity", 0.5);
    } else {
      map.setPaintProperty("state-fill", "fill-color", "#FAF7F2");
      map.setPaintProperty("state-fill", "fill-opacity", 0.08);
    }
  }, [mode, memory, baseMap, mapReady]);

  // ── Base map switching ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const setVis = (id: string, visible: boolean) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
      }
    };

    // "physical" = satellite imagery + hillshade blend (HD terrain + greenery)
    // "satellite" = pure satellite imagery, no relief blend
    // "clean"     = CARTO political atlas
    if (baseMap === "physical") {
      setVis("topo-base", true);
      setVis("hillshade-base", true);
      setVis("clean-base", false);
    } else if (baseMap === "satellite") {
      setVis("topo-base", true);
      setVis("hillshade-base", false);
      setVis("clean-base", false);
    } else {
      setVis("topo-base", false);
      setVis("hillshade-base", false);
      setVis("clean-base", true);
    }
  }, [baseMap, mapReady]);

  // ── Layer visibility ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const setVis = (layerIds: string[], visible: boolean) => {
      layerIds.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
        }
      });
    };

    setVis(["state-borders", "state-hover", "state-selected", "state-correct", "state-incorrect"], layers.stateBorders);
    setVis(["rivers-line", "rivers-labels", "rivers-glow", "rivers-hitbox"], layers.rivers);
    setVis(["mountain-peaks", "mountain-labels"], layers.mountains);
    setVis(["mountain-range-band", "mountain-range-line", "mountain-range-symbols", "range-labels"], layers.ranges);
    setVis(["park-dots", "park-labels", "park-glow"], layers.parks);
    setVis(["state-label-text"], layers.stateLabels);
  }, [layers, mapReady]);

  // ── Filter mountains/ranges by taxonomy ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const himalayanRangeNames = [
      "Greater Himalayas", "Shivalik Hills", "Karakoram",
      "Pir Panjal", "Ladakh Range", "Zaskar Range", "Patkai Range",
    ];

    const peakLayers = ["mountain-peaks", "mountain-labels"];
    const rangeLayers = ["mountain-range-band", "mountain-range-line", "mountain-range-symbols", "range-labels"];

    // Exclusion clause for per-peak checkbox toggles
    const peakExclusion: any[] = hiddenPeaks.length > 0
      ? [["!", ["in", ["get", "name"], ["literal", hiddenPeaks]]]]
      : [];

    if (activeFilter === "Himalayas") {
      peakLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, [
            "all",
            ["==", ["get", "type"], "peak"],
            ["in", ["get", "range"], ["literal", HIMALAYAN_RANGES]],
            ...peakExclusion,
          ] as any);
        }
      });
      rangeLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, ["in", ["get", "name"], ["literal", himalayanRangeNames]] as any);
        }
      });
    } else if (activeFilter === "Peninsular") {
      const peninsularRangeNames = [
        "Western Ghats", "Eastern Ghats", "Aravalli", "Vindhya", "Satpura",
      ];
      // Show peaks that are NOT in Himalayan ranges
      peakLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, [
            "all",
            ["==", ["get", "type"], "peak"],
            ["!", ["in", ["get", "range"], ["literal", HIMALAYAN_RANGES]]],
            ...peakExclusion,
          ] as any);
        }
      });
      rangeLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, ["in", ["get", "name"], ["literal", peninsularRangeNames]] as any);
        }
      });
    } else if (activeFilter === "Passes") {
      // Show only passes (all ranges), hide range polylines
      peakLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, ["all", ["==", ["get", "type"], "pass"], ...peakExclusion] as any);
        }
      });
      rangeLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, ["==", ["get", "name"], ""] as any); // hide all
        }
      });
    } else {
      // "All", "Rivers", "Protected Areas" — show everything
      peakLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, [
            "all",
            ["in", ["get", "type"], ["literal", ["peak", "pass"]]],
            ...peakExclusion,
          ] as any);
        }
      });
      rangeLayers.forEach((id) => {
        if (map.getLayer(id)) {
          map.setFilter(id, null);
        }
      });
    }
  }, [activeFilter, hiddenPeaks, mapReady]);

  // Sync selected feature name to river/mountain/park highlight filter
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    
    // Aggregate targeted feature names into array
    const highlightNames: string[] = [];
    if (selectedFeatureName) highlightNames.push(selectedFeatureName);
    if (correctState) highlightNames.push(correctState);
    if (incorrectState) highlightNames.push(incorrectState);

    // Default style parameters
    let colorExpr: any = "#C4784A";
    let lineWidthExpr: any = 3.5;
    let circleRadiusExpr: any = 8.0;

    // Evaluate Quiz styling (Bright Green for correct, Bright Red for wrong)
    if (mode === "quiz" && (correctState || incorrectState)) {
      colorExpr = [
        "case",
        ["==", ["get", "name"], correctState], "#10B981", // Success Green
        ["==", ["get", "name"], incorrectState], "#EF4444", // Danger Red
        "#C4784A"
      ];
      lineWidthExpr = 5.0; // Thicker line for rivers
      circleRadiusExpr = 10.0; // Fatter dot for mountains/parks
    }

    // Safely update MapLibre properties dynamically across all 3 structural feature layers
    const layerConfigs = [
      { id: "rivers-highlight", isLine: true },
      { id: "mountain-highlight", isLine: false },
      { id: "park-highlight", isLine: false },
    ];

    layerConfigs.forEach(({ id, isLine }) => {
      if (map.getLayer(id)) {
        if (highlightNames.length > 0) {
          map.setFilter(id, ["in", ["get", "name"], ["literal", highlightNames]]);
        } else {
          map.setFilter(id, ["==", ["get", "name"], ""]);
        }

        if (isLine) {
          map.setPaintProperty(id, "line-color", colorExpr);
          map.setPaintProperty(id, "line-width", lineWidthExpr);
        } else {
          map.setPaintProperty(id, "circle-color", colorExpr);
          map.setPaintProperty(id, "circle-radius", circleRadiusExpr);
        }
      }
    });

  }, [selectedFeatureName, correctState, incorrectState, mode, mapReady]);

  // ── Spotlight: react to selectedRanges ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (selectedRanges && selectedRanges.length > 0) {
      // Filter focused-range source to just these ranges
      const focusedFeatures = MOUNTAIN_RANGES.features.filter(
        (f: any) => selectedRanges.includes(f.properties.name)
      );
      (map.getSource("focused-range") as maplibregl.GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: focusedFeatures as GeoJSON.Feature[],
      });

      // Fade the regular range layers to near invisible so focused range stands out
      map.setPaintProperty("mountain-range-line", "line-opacity", 0.08);
      map.setPaintProperty("mountain-range-band", "line-opacity", 0.03);
      map.setPaintProperty("mountain-range-symbols", "icon-opacity", 0.12);
      map.setPaintProperty("range-labels", "text-opacity", 0);

      // Fly to the bounding box if exactly one range is selected (prevents chaotic jumps on multi-select)
      if (selectedRanges.length === 1) {
        const bounds = RANGE_BOUNDS[selectedRanges[0]!];
        if (bounds) {
          map.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 80, right: 340 },
            duration: 1400,
            essential: true,
          });
        }
      }
    } else {
      // Clear spotlight
      (map.getSource("focused-range") as maplibregl.GeoJSONSource)?.setData({
        type: "FeatureCollection",
        features: [],
      });
      map.setPaintProperty("mountain-range-line", "line-opacity", 0.45);
      map.setPaintProperty("mountain-range-band", "line-opacity", 0.07);
      map.setPaintProperty("mountain-range-symbols", "icon-opacity", 0.5);
      map.setPaintProperty("range-labels", "text-opacity", 0.95);
    }
  }, [selectedRanges, mapReady]);

  // Sync River Basin and Level filters
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    
    // Base level condition
    const filterArray: any[] = ["all", ["<=", ["get", "level"], riverLevel]];
    
    // Add Basin condition
    if (riverBasin !== "All") {
      if (riverBasin === "Peninsular Rivers") {
        filterArray.push([
          "in", ["get", "basin"], 
          ["literal", ["Tapi Basin", "Pennar Basin", "Sabarmati Basin", "Mahi Basin", "West Flowing / Coastal Basins", "East Flowing / Coastal Basins", "Subarnarekha Basin", "Brahmani Basin"]]
        ]);
      } else {
        filterArray.push(["==", ["get", "basin"], riverBasin]);
      }
    }

    if (hiddenRivers.length > 0) {
      filterArray.push(["!", ["in", ["get", "name"], ["literal", hiddenRivers]]]);
    }

    if (map.getLayer("rivers-line")) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setFilter("rivers-line", filterArray as any);
      map.setFilter("rivers-glow", filterArray as any);
      map.setFilter("rivers-hitbox", filterArray as any);
      map.setFilter("rivers-labels", ["all", ...filterArray.slice(1), ["<=", ["get", "level"], 3]] as any);
    }
  }, [riverLevel, riverBasin, hiddenRivers, mapReady]);

  // Camera pan on taxonomy filter change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;

    const filterBounds: Record<string, [[number, number], [number, number]]> = {
      "Himalayas": [[72.0, 27.0], [98.0, 37.0]],
      "Passes": [[68.0, 6.0], [97.0, 37.0]],
      "Protected Areas": [[68.0, 6.0], [97.0, 36.0]],
      "All": [[68.0, 6.0], [97.0, 36.0]],
    };

    const bounds = filterBounds[activeFilter];
    if (bounds) {
      map.fitBounds(bounds, {
        padding: 40,
        duration: 1200,
        essential: true,
      });
    }
  }, [activeFilter, mapReady]);

  // Cinematic Camera Pan on Basin Change
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    
    // Geographic Bounding Boxes for Major Indian Basins
    const basinBounds: Record<string, [[number, number], [number, number]]> = {
      "Ganga Basin": [[73.0, 21.0], [89.0, 31.0]],
      "Indus Basin": [[70.0, 29.0], [80.0, 36.0]],
      "Godavari Basin": [[73.0, 16.0], [83.0, 23.0]],
      "Krishna Basin": [[73.0, 13.0], [81.0, 19.0]],
      "Brahmaputra Basin": [[88.0, 24.0], [97.0, 30.0]],
      "Mahanadi Basin": [[80.0, 19.0], [87.0, 23.0]],
      "Narmada Basin": [[72.0, 21.0], [82.0, 24.0]],
      "Kaveri Basin": [[75.0, 10.0], [80.0, 14.0]],
      "Peninsular Rivers": [[72.0, 8.0], [86.0, 22.0]],
      "All": [[68.0, 6.0], [97.0, 36.0]] // India Default Bounds
    };

    const targetBounds = basinBounds[riverBasin];
    if (targetBounds) {
      map.fitBounds(targetBounds, { 
        padding: 50,
        duration: 1800, // Smooth Apple-like cinematic pan
        essential: true 
      });
    }
  }, [riverBasin, mapReady]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px]" />
  );
}
