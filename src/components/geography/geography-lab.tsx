"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Map as MapIcon,
  Crosshair,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Trophy,
  Flame,
  X,
  Check,
  MapPin,
  Droplets,
  Mountain,
  TreePine,
  Info,
  Zap,
  Eye,
  Brain,
  Layers,
  Tags,
  Globe,
  Palette,
  Satellite,
  ArrowUpDown,
  ArrowDown,
  ArrowRight,
  Share2,
  Grid3x3,
  LocateFixed,
  ScanLine,
  Search,
} from "lucide-react";
import { IndiaMap, type MapMode, type LayerVisibility, type BaseMapStyle } from "@/components/geography/india-map";
import { computeRiverIntersections, computeParkIntersections, type IntersectResult } from "@/lib/geo-intersections";
import {
  STATE_BY_NAME,
  INDIA_STATES,
  REGION_COLORS,
  generateQuizQuestion,
  loadMemory,
  saveMemory,
  updateMemory,
  getMemoryStrength,
  type StateData,
  type StateMemory,
  type MapQuizQuestion,
} from "@/data/india-states";
import { generateFeatureQuizQuestion, RIVERS, MOUNTAINS, MOUNTAIN_RANGES, NATIONAL_PARKS } from "@/data/india-geo-features";

// ── Mode pill (segmented control) ────────────────────────────────────────────────

function ModePill({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex min-h-10 items-center gap-2 border px-3 font-mono text-[10px] font-bold uppercase tracking-[0.12em] transition-colors ${
        active
          ? "border-[#ef5c49] bg-[#ef5c49] text-[#151a16]"
          : "border-transparent text-[#a6aaa1] hover:border-[#465047] hover:text-[#f0ece3]"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ── Layer toggle ─────────────────────────────────────────────────────────────────

function LayerToggle({
  icon,
  label,
  active,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`flex min-h-9 items-center gap-1.5 border px-2.5 text-[11px] font-semibold transition-colors ${
        active
          ? "border-[#c2382e]/30 bg-[#c2382e]/10 text-[#a92f28]"
          : "border-transparent text-[#71776f] hover:border-[#c8c1b5] hover:text-[#182019]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────────────

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-1 items-center gap-2 border border-[#d2cabd] bg-[#f8f4eb] px-2.5 py-2">
      <span className="text-[#c2382e]">{icon}</span>
      <div>
        <p className="text-xs font-bold leading-none tabular-nums text-[#182019]">{value}</p>
        <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#71776f]">{label}</p>
      </div>
    </div>
  );
}

// ── State info panel ─────────────────────────────────────────────────────────────

function StateInfoPanel({
  state,
  onClose,
}: {
  state: StateData;
  onClose: () => void;
}) {
  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2382e]">
            {REGION_COLORS[state.region].label}
          </p>
          <h3 className="text-lg font-bold text-[#182019] mt-0.5 font-serif">{state.name}</h3>
          <p className="text-xs text-[#646a62] mt-0.5">
            {state.type === "UT" ? "Union Territory" : "State"} · {state.area.toLocaleString()} km²
          </p>
        </div>
        <button
          type="button"
          aria-label={`Close ${state.name} details`}
          onClick={onClose}
          className="rounded-md p-1 text-[#71776f] hover:text-[#182019] hover:bg-[#e8e3d9] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-[#f8f4eb] px-2.5 py-2 border border-[#c8c1b5]/50">
        <MapPin className="w-3.5 h-3.5 text-[#c2382e] shrink-0" />
        <div>
          <p className="text-[9px] text-[#71776f] uppercase tracking-wider">Capital</p>
          <p className="text-xs font-semibold text-[#182019]">{state.capital}</p>
        </div>
      </div>

      {state.majorRivers.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Droplets className="w-3 h-3 text-[#2563EB]" />
            <p className="text-[9px] font-bold text-[#71776f] uppercase tracking-wider">Rivers</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {state.majorRivers.map((r) => (
              <span key={r} className="inline-flex items-center rounded-md bg-[#EFF6FF] px-2 py-0.5 text-[11px] font-medium text-[#1E40AF]">
                {r}
              </span>
            ))}
          </div>
        </div>
      )}

      {state.mountainRanges.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Mountain className="w-3 h-3 text-[#92400E]" />
            <p className="text-[9px] font-bold text-[#71776f] uppercase tracking-wider">Mountains</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {state.mountainRanges.map((m) => (
              <span key={m} className="inline-flex items-center rounded-md bg-[#FFFBEB] px-2 py-0.5 text-[11px] font-medium text-[#92400E]">
                {m}
              </span>
            ))}
          </div>
        </div>
      )}

      {state.nationalParks.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TreePine className="w-3 h-3 text-[#16A34A]" />
            <p className="text-[9px] font-bold text-[#71776f] uppercase tracking-wider">National Parks</p>
          </div>
          <div className="flex flex-wrap gap-1">
            {state.nationalParks.map((p) => (
              <span key={p} className="inline-flex items-center rounded-md bg-[#F0FDF4] px-2 py-0.5 text-[11px] font-medium text-[#15803D]">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {state.neighbors.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapIcon className="w-3 h-3 text-[#D97706]" />
            <p className="text-[9px] font-bold text-[#71776f] uppercase tracking-wider">Borders</p>
          </div>
          <p className="text-xs text-[#646a62] leading-relaxed">{state.neighbors.join(", ")}</p>
        </div>
      )}

      {state.keyFacts.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3 h-3 text-[#D97706]" />
            <p className="text-[9px] font-bold text-[#71776f] uppercase tracking-wider">Key Facts</p>
          </div>
          <ul className="space-y-1.5">
            {state.keyFacts.map((fact, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-[#454c46] leading-relaxed">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-[#c2382e] shrink-0" />
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Quiz panel ───────────────────────────────────────────────────────────────────

function QuizPanel({
  question,
  score,
  streak,
  total,
  feedback,
  onAnswer,
  onNext,
}: {
  question: MapQuizQuestion | null;
  score: number;
  streak: number;
  total: number;
  feedback: { correct: boolean; message: string } | null;
  onAnswer: (answer: string) => void;
  onNext: () => void;
}) {
  if (!question) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <StatPill icon={<Trophy className="w-3.5 h-3.5" />} value={score} label="Score" />
        <StatPill icon={<Flame className="w-3.5 h-3.5" />} value={streak} label="Streak" />
        <StatPill icon={<Crosshair className="w-3.5 h-3.5" />} value={total} label="Total" />
      </div>

      <div className="border border-[#c8c1b5] bg-[#f8f4eb] p-3.5">
        <p className="text-[9px] font-bold text-[#c2382e] uppercase tracking-wider mb-1">
          {question.type === "identify" || question.type === "identify_feature"
            ? "Find on map"
            : question.type.charAt(0).toUpperCase() + question.type.slice(1)}
        </p>
        <p className="text-sm font-semibold text-[#182019] leading-snug">{question.prompt}</p>
        {question.type === "identify" && !feedback && (
          <p className="text-[11px] text-[#71776f] mt-1.5 flex items-center gap-1">
            <Crosshair className="w-3 h-3" />
            Click the correct state on the map
          </p>
        )}
      </div>

      {question.options && !feedback && (
        <div className="space-y-1.5">
          {question.options.map((opt) => (
            <button
              key={opt}
              onClick={() => onAnswer(opt)}
              className="min-h-12 w-full border border-[#c8c1b5] bg-[#fffdf8] px-3 text-left text-sm font-medium text-[#454c46] transition-colors hover:border-[#c2382e] hover:bg-[#f8f4eb] hover:text-[#182019] active:scale-[0.98]"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <div
          className={`border p-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            feedback.correct
              ? "bg-[#F0FDF4] border-[#BBF7D0]"
              : "bg-[#FEF2F2] border-[#FECACA]"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {feedback.correct ? (
              <Check className="w-4 h-4 text-[#16A34A]" />
            ) : (
              <X className="w-4 h-4 text-[#DC2626]" />
            )}
            <p className={`text-xs font-bold ${feedback.correct ? "text-[#16A34A]" : "text-[#DC2626]"}`}>
              {feedback.correct ? "Correct!" : "Incorrect"}
            </p>
          </div>
          <p className="text-xs text-[#646a62]">{feedback.message}</p>
          <button
            onClick={onNext}
            className="mt-3 flex min-h-10 items-center gap-1 bg-[#c2382e] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#a92f28]"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Review panel ─────────────────────────────────────────────────────────────────

function ReviewPanel({ memory }: { memory: Record<string, StateMemory> }) {
  const states = INDIA_STATES.filter((s) => s.type === "State");
  const studied = states.filter((s) => memory[s.name]);
  const strong = studied.filter((s) => getMemoryStrength(memory[s.name]) >= 0.85);
  const moderate = studied.filter((s) => {
    const str = getMemoryStrength(memory[s.name]);
    return str >= 0.3 && str < 0.85;
  });
  const weak = studied.filter((s) => getMemoryStrength(memory[s.name]) < 0.3);
  const unstudied = states.filter((s) => !memory[s.name]);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[#182019]">State memory</h3>
        <p className="text-[11px] text-[#646a62]">Recall strength from state quiz answers</p>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <div className="rounded-lg bg-[#F0FDF4] p-2 text-center">
          <p className="text-lg font-bold text-[#16A34A] tabular-nums">{strong.length}</p>
          <p className="text-[9px] text-[#15803D] font-semibold">Strong</p>
        </div>
        <div className="rounded-lg bg-[#EFF6FF] p-2 text-center">
          <p className="text-lg font-bold text-[#2563EB] tabular-nums">{moderate.length}</p>
          <p className="text-[9px] text-[#1D4ED8] font-semibold">OK</p>
        </div>
        <div className="rounded-lg bg-[#FFFBEB] p-2 text-center">
          <p className="text-lg font-bold text-[#D97706] tabular-nums">{weak.length}</p>
          <p className="text-[9px] text-[#B45309] font-semibold">Fading</p>
        </div>
        <div className="rounded-lg bg-[#e8e3d9] p-2 text-center">
          <p className="text-lg font-bold text-[#71776f] tabular-nums">{unstudied.length}</p>
          <p className="text-[9px] text-[#71776f] font-semibold">New</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-[#f8f4eb] border border-[#c8c1b5]/50 px-2.5 py-2">
        {[
          { color: "rgba(16,185,129,0.5)", label: "Strong" },
          { color: "rgba(59,130,246,0.5)", label: "Moderate" },
          { color: "rgba(245,158,11,0.5)", label: "Fading" },
          { color: "rgba(239,68,68,0.5)", label: "Forgot" },
          { color: "rgba(100,100,100,0.3)", label: "New" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
            <span className="text-[10px] text-[#646a62]">{item.label}</span>
          </div>
        ))}
      </div>

      {weak.length > 0 && (
        <div>
          <p className="text-[9px] font-bold text-[#DC2626] uppercase tracking-wider mb-1.5">
            Needs Revision
          </p>
          <div className="space-y-0.5">
            {weak.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-md bg-[#FEF2F2] px-2.5 py-1.5">
                <span className="text-xs text-[#454c46]">{s.name}</span>
                <span className="text-[10px] text-[#DC2626] font-semibold tabular-nums">
                  {Math.round(getMemoryStrength(memory[s.name]) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Feature info panel ──────────────────────────────────────────────────────────

function FeatureInfoPanel({ feature, onClose }: { feature: any; onClose: () => void }) {
  const isRiver = feature._category === "river";
  const isMountain = feature._category === "mountain";
  const isPark = feature._category === "park";

  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#c2382e]">
            {isRiver ? "River" : isMountain ? (feature.type === "peak" ? "Peak" : "Pass") : "National Park"}
          </p>
          <h3 className="text-lg font-bold text-[#182019] mt-0.5 font-serif">{feature.name}</h3>
        </div>
        <button
          type="button"
          aria-label={`Close ${feature.name} details`}
          onClick={onClose}
          className="rounded-md p-1 text-[#71776f] hover:text-[#182019] hover:bg-[#e8e3d9] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {isRiver && (
          <div className="flex items-center gap-2 rounded-lg bg-[#f8f4eb] px-2.5 py-2 border border-[#c8c1b5]/50">
            <Droplets className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            <div>
              <p className="text-[9px] text-[#71776f] uppercase tracking-wider">Basin</p>
              <p className="text-xs font-semibold text-[#182019]">{feature.basin || "Unknown"}</p>
            </div>
          </div>
        )}
        {isMountain && (
          <div className="flex items-center gap-2 rounded-lg bg-[#f8f4eb] px-2.5 py-2 border border-[#c8c1b5]/50">
            <Mountain className="w-3.5 h-3.5 text-[#92400E] shrink-0" />
            <div>
              <p className="text-[9px] text-[#71776f] uppercase tracking-wider">Elevation</p>
              <p className="text-xs font-semibold text-[#182019]">{feature.elevation} m</p>
            </div>
          </div>
        )}
        {isPark && (
          <div className="flex items-center gap-2 rounded-lg bg-[#f8f4eb] px-2.5 py-2 border border-[#c8c1b5]/50">
            <TreePine className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            <div>
              <p className="text-[9px] text-[#71776f] uppercase tracking-wider">Location</p>
              <p className="text-xs font-semibold text-[#182019]">{feature.state}{feature.unesco ? " · UNESCO" : ""}</p>
            </div>
          </div>
        )}

        {feature.description && (
          <div className="text-xs text-[#454c46] leading-relaxed border-t border-[#c8c1b5]/50 pt-2 mt-1">
            {feature.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coordinate lookup for spatial sorting ────────────────────────────────────────

type AtlasFeatureListItem = {
  name: string;
  detail: string;
  kind: "river" | "range" | "peak" | "pass" | "park";
  coords?: [number, number];
};

/** Picks a stable label/sort point from the longest line in a river geometry. */
function getRiverRepresentativePoint(geometry: any): { coords: [number, number]; weight: number } | null {
  const lines: number[][][] = geometry?.type === "LineString"
    ? [geometry.coordinates]
    : geometry?.type === "MultiLineString"
      ? geometry.coordinates
      : [];
  const longest = lines.reduce<number[][]>(
    (best, line) => (line.length > best.length ? line : best),
    []
  );
  const midpoint = longest[Math.floor(longest.length / 2)];
  if (!midpoint || midpoint.length < 2) return null;
  return { coords: [midpoint[0]!, midpoint[1]!], weight: longest.length };
}

/** Returns [lng, lat] for a feature by name+kind, or null if not found. */
function getFeatureCoords(name: string, kind: string): [number, number] | null {
  if (kind === "peak" || kind === "pass") {
    const f = MOUNTAINS.features.find(m => m.properties.name === name);
    return f ? (f.geometry.coordinates as [number, number]) : null;
  }
  if (kind === "park") {
    const f = NATIONAL_PARKS.features.find(m => m.properties.name === name);
    return f ? (f.geometry.coordinates as [number, number]) : null;
  }
  if (kind === "range") {
    const f = MOUNTAIN_RANGES.features.find(m => m.properties.name === name);
    if (!f) return null;
    const coords = f.geometry.coordinates;
    const mid = coords[Math.floor(coords.length / 2)];
    return mid ? (mid as [number, number]) : null;
  }
  if (kind === "river") {
    const f = (RIVERS as any).features.find((m: any) => m.properties.name === name);
    if (!f) return null;
    const coords = f.geometry.coordinates;
    const mid = coords[Math.floor(coords.length / 2)];
    return mid ? (mid as [number, number]) : null;
  }
  return null;
}

// ── Major Indian cities for Lat/Lng Lock alignment ───────────────────────────────

const MAJOR_CITIES: { name: string; coords: [number, number] }[] = [
  { name: "Delhi", coords: [77.2, 28.6] },
  { name: "Mumbai", coords: [72.8, 19.1] },
  { name: "Chennai", coords: [80.3, 13.1] },
  { name: "Kolkata", coords: [88.4, 22.6] },
  { name: "Bangalore", coords: [77.6, 13.0] },
  { name: "Hyderabad", coords: [78.5, 17.4] },
  { name: "Ahmedabad", coords: [72.6, 23.0] },
  { name: "Pune", coords: [73.9, 18.5] },
  { name: "Jaipur", coords: [75.8, 27.0] },
  { name: "Lucknow", coords: [80.9, 26.8] },
  { name: "Bhopal", coords: [77.4, 23.3] },
  { name: "Patna", coords: [85.1, 25.6] },
  { name: "Bhubaneswar", coords: [85.8, 20.3] },
  { name: "Nagpur", coords: [79.1, 21.1] },
  { name: "Varanasi", coords: [83.0, 25.3] },
  { name: "Agra", coords: [78.0, 27.2] },
  { name: "Surat", coords: [72.8, 21.2] },
  { name: "Amritsar", coords: [74.9, 31.6] },
  { name: "Jodhpur", coords: [73.0, 26.3] },
  { name: "Visakhapatnam", coords: [83.3, 17.7] },
  { name: "Kochi", coords: [76.3, 10.0] },
  { name: "Coimbatore", coords: [77.0, 11.0] },
  { name: "Mysuru", coords: [76.6, 12.3] },
  { name: "Raipur", coords: [81.6, 21.3] },
  { name: "Ranchi", coords: [85.3, 23.4] },
  { name: "Guwahati", coords: [91.7, 26.2] },
  { name: "Chandigarh", coords: [76.8, 30.7] },
  { name: "Dehradun", coords: [78.0, 30.3] },
  { name: "Shimla", coords: [77.2, 31.1] },
  { name: "Srinagar", coords: [74.8, 34.1] },
  { name: "Leh", coords: [77.6, 34.2] },
  { name: "Thiruvananthapuram", coords: [77.0, 8.5] },
  { name: "Port Blair", coords: [92.7, 11.7] },
  { name: "Gangtok", coords: [88.6, 27.3] },
  { name: "Shillong", coords: [91.9, 25.6] },
  { name: "Imphal", coords: [93.9, 24.8] },
  { name: "Dispur (Assam)", coords: [91.8, 26.1] },
  { name: "Itanagar", coords: [93.6, 27.1] },
  { name: "Agartala", coords: [91.3, 23.8] },
  { name: "Aizawl", coords: [92.7, 23.7] },
  { name: "Kohima", coords: [94.1, 25.7] },
  { name: "Allahabad", coords: [81.8, 25.4] },
  { name: "Meerut", coords: [77.7, 28.98] },
];

type AlignedFeature = { name: string; featureType: string; coords: [number, number]; diff: number };

function findAlignedFeatures(lat: number, lng: number, tol = 0.5) {
  const sameLat: AlignedFeature[] = [];
  const sameLng: AlignedFeature[] = [];

  // Cities
  for (const c of MAJOR_CITIES) {
    const dLat = Math.abs(c.coords[1] - lat);
    const dLng = Math.abs(c.coords[0] - lng);
    if (dLat <= tol) sameLat.push({ name: c.name, featureType: "city", coords: c.coords, diff: dLat });
    if (dLng <= tol) sameLng.push({ name: c.name, featureType: "city", coords: c.coords, diff: dLng });
  }

  // National Parks / Reserves
  for (const f of (NATIONAL_PARKS as any).features) {
    const [fLng, fLat] = f.geometry.coordinates as [number, number];
    const dLat = Math.abs(fLat - lat);
    const dLng = Math.abs(fLng - lng);
    if (dLat <= tol) sameLat.push({ name: f.properties.name, featureType: "park", coords: [fLng, fLat], diff: dLat });
    if (dLng <= tol) sameLng.push({ name: f.properties.name, featureType: "park", coords: [fLng, fLat], diff: dLng });
  }

  // Mountain peaks
  for (const f of (MOUNTAINS as any).features) {
    const [fLng, fLat] = f.geometry.coordinates as [number, number];
    const dLat = Math.abs(fLat - lat);
    const dLng = Math.abs(fLng - lng);
    if (dLat <= tol) sameLat.push({ name: f.properties.name, featureType: f.properties.type ?? "peak", coords: [fLng, fLat], diff: dLat });
    if (dLng <= tol) sameLng.push({ name: f.properties.name, featureType: f.properties.type ?? "peak", coords: [fLng, fLat], diff: dLng });
  }

  sameLat.sort((a, b) => a.diff - b.diff);
  sameLng.sort((a, b) => a.diff - b.diff);

  return { sameLat, sameLng };
}

// ── Main component ───────────────────────────────────────────────────────────────

export function GeographyLab() {
  const [mode, setMode] = useState<MapMode>("explore");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [highlightedState, setHighlightedState] = useState<string | null>(null);
  const [correctState, setCorrectState] = useState<string | null>(null);
  const [incorrectState, setIncorrectState] = useState<string | null>(null);
  const [memory, setMemory] = useState<Record<string, StateMemory>>(() => loadMemory());

  // Layers & base map
  const [baseMap, setBaseMap] = useState<BaseMapStyle>("clean");
  const [layers, setLayers] = useState<LayerVisibility>({
    stateBorders: true,
    rivers: false,
    mountains: false,
    ranges: false,
    parks: false,
    stateLabels: true,
  });
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [riverLevel, setRiverLevel] = useState<number>(3);
  const [riverBasin, setRiverBasin] = useState<string>("All");
  const [showRiverConfig, setShowRiverConfig] = useState<boolean>(false);
  
  // River specific interactive states
  const [riversData, setRiversData] = useState<any[]>([]);
  const [hiddenRivers, setHiddenRivers] = useState<Set<string>>(new Set());
  const [hiddenPeaks, setHiddenPeaks] = useState<Set<string>>(new Set());
  const [hiddenParks, setHiddenParks] = useState<Set<string>>(new Set());
  /** Set of range names currently in spotlight mode */
  const [selectedRanges, setSelectedRanges] = useState<Set<string>>(new Set());

  // Intersect mode
  const [intersectMode, setIntersectMode] = useState(false);
  const [intersectResults, setIntersectResults] = useState<IntersectResult | null>(null);

  // Grid Lines + Lock tool
  const [showGridLines, setShowGridLines] = useState(false);
  const [lockMode, setLockMode] = useState(false);
  const [lockPoint, setLockPoint] = useState<[number, number] | null>(null);
  /** All raw GeoJSON features from the highres rivers file (for intersection computation) */
  const riversAllFeaturesRef = useRef<any[]>([]);

  // Spatial sort state
  const [spatialSortDir, setSpatialSortDir] = useState<"ns" | "ew" | null>(null);
  const [spatialSelection, setSpatialSelection] = useState<Set<string>>(new Set());

  // Quiz state
  const [quizDeck, setQuizDeck] = useState<"states" | "rivers" | "mountains" | "parks" | null>(null);
  const [quizQuestion, setQuizQuestion] = useState<MapQuizQuestion | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);
  const [quizFeedback, setQuizFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [flashState, setFlashState] = useState<"correct" | "incorrect" | null>(null);

  // Side panel state for mobile
  const [showPanel, setShowPanel] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showMobileIndex, setShowMobileIndex] = useState(false);
  const [showRiverFilterSheet, setShowRiverFilterSheet] = useState(false);
  const [featureQuery, setFeatureQuery] = useState("");
  const [stateQuery, setStateQuery] = useState("");

  // Fetch rivers data for sidebar checklist
  useEffect(() => {
    if (activeFilter !== "Rivers" || riversData.length > 0) return;
    
    let isMounted = true;
    fetch("/data/india-rivers-highres.geojson")
      .then(res => res.json())
      .then(data => {
         if (!isMounted) return;
         // Store all raw features for intersection computation
         riversAllFeaturesRef.current = data.features;
         const uniqueRivers = new Map<string, any>();
         data.features.forEach((f: any) => {
           const p = f.properties;
           if (!p.name) return;
           const candidate = getRiverRepresentativePoint(f.geometry);
           const existing = uniqueRivers.get(p.name);
           if (!existing) {
             uniqueRivers.set(p.name, {
               ...p,
               _coords: candidate?.coords,
               _coordWeight: candidate?.weight ?? 0,
             });
           } else if (candidate && candidate.weight > existing._coordWeight) {
             existing._coords = candidate.coords;
             existing._coordWeight = candidate.weight;
           }
         });
         setRiversData(Array.from(uniqueRivers.values(), ({ _coordWeight: _unused, ...river }) => river));
      })
      .catch(err => console.error("Could not fetch rivers", err));
      
    return () => { isMounted = false; };
  }, [activeFilter, riversData.length]);

  // Compute currently rendered rivers exactly according to Map filters
  const filteredRivers = useMemo(() => {
    if (activeFilter !== "Rivers") return [];
    return riversData.filter(r => {
      if (r.level > riverLevel) return false;
      if (riverBasin !== "All") {
        if (riverBasin === "Peninsular Rivers") {
           const penBasins = ["Tapi Basin", "Pennar Basin", "Sabarmati Basin", "Mahi Basin", "West Flowing / Coastal Basins", "East Flowing / Coastal Basins", "Subarnarekha Basin", "Brahmani Basin"];
           if (!penBasins.includes(r.basin)) return false;
        } else {
           if (r.basin !== riverBasin) return false;
        }
      }
      return true;
    }).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [activeFilter, riversData, riverLevel, riverBasin]);

  const HIMALAYAN_RANGES = useMemo(() => [
    "Greater Himalayas", "Shivalik Hills", "Karakoram",
    "Pir Panjal", "Ladakh Range", "Zaskar Range", "Patkai Range",
  ], []);

  const displayFeaturesList = useMemo<AtlasFeatureListItem[]>(() => {
    if (activeFilter === "Rivers") {
      return filteredRivers.map(r => ({
        name: r.name,
        detail: `L${r.level}`,
        kind: "river" as const,
        coords: r._coords as [number, number] | undefined,
      }));
    }
    if (activeFilter === "Himalayas") {
      const HIMALAYAN_RANGE_NAMES = new Set([
        "Greater Himalayas", "Shivalik Hills", "Karakoram",
        "Pir Panjal", "Ladakh Range", "Zaskar Range", "Patkai Range",
        "Garo Hills", "Khasi Hills", "Jaintia Hills",
      ]);
      const HIMALAYAN_PEAK_RANGES = new Set([
        "Himalayas", "Great Himalayas", "Greater Himalayas", "Lesser Himalayas",
        "Karakoram", "Pir Panjal", "Ladakh", "Ladakh Range", "Zaskar", "Zaskar Range",
        "Shivalik", "Shivalik Hills", "Patkai",
      ]);
      const ranges = MOUNTAIN_RANGES.features
        .filter((m: any) => HIMALAYAN_RANGE_NAMES.has(m.properties.name))
        .map((m: any) => ({ name: m.properties.name, detail: "Range", kind: "range" as const }));
      const peaks = MOUNTAINS.features
        .filter((m: any) => m.properties.type === "peak" && HIMALAYAN_PEAK_RANGES.has(m.properties.range))
        .sort((a: any, b: any) => (b.properties.elevation ?? 0) - (a.properties.elevation ?? 0))
        .map((m: any) => ({ name: m.properties.name, detail: `${m.properties.elevation}m`, kind: "peak" as const }));
      return [...ranges, ...peaks];
    }
    if (activeFilter === "Peninsular") {
      const PENINSULAR_RANGE_NAMES = new Set([
        "Western Ghats", "Eastern Ghats", "Aravalli", "Vindhya", "Satpura",
      ]);
      const HIMALAYAN_PEAK_RANGES = new Set([
        "Himalayas", "Great Himalayas", "Greater Himalayas", "Lesser Himalayas",
        "Karakoram", "Pir Panjal", "Ladakh", "Ladakh Range", "Zaskar", "Zaskar Range",
        "Shivalik", "Shivalik Hills", "Patkai",
      ]);
      const ranges = MOUNTAIN_RANGES.features
        .filter((m: any) => PENINSULAR_RANGE_NAMES.has(m.properties.name))
        .map((m: any) => ({ name: m.properties.name, detail: "Range", kind: "range" as const }));
      const peaks = MOUNTAINS.features
        .filter((m: any) => m.properties.type === "peak" && !HIMALAYAN_PEAK_RANGES.has(m.properties.range))
        .sort((a: any, b: any) => (b.properties.elevation ?? 0) - (a.properties.elevation ?? 0))
        .map((m: any) => ({ name: m.properties.name, detail: `${m.properties.elevation}m`, kind: "peak" as const }));
      return [...ranges, ...peaks];
    }
    if (activeFilter === "Passes") {
      return MOUNTAINS.features
        .filter((m: any) => m.properties.type === "pass")
        .sort((a: any, b: any) => (b.properties.elevation ?? 0) - (a.properties.elevation ?? 0))
        .map((m: any) => ({ name: m.properties.name, detail: `${m.properties.elevation}m`, kind: "pass" as const }));
    }
    if (activeFilter === "Protected Areas") {
      return NATIONAL_PARKS.features
        .map((m: any) => ({ name: m.properties.name, detail: m.properties.category, kind: "park" as const }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [activeFilter, filteredRivers]);

  const visibleFeaturesList = useMemo(() => {
    const query = featureQuery.trim().toLocaleLowerCase();
    if (!query) return displayFeaturesList;
    return displayFeaturesList.filter((item) =>
      `${item.name} ${item.detail}`.toLocaleLowerCase().includes(query)
    );
  }, [displayFeaturesList, featureQuery]);

  const matchingStates = useMemo(() => {
    const query = stateQuery.trim().toLocaleLowerCase();
    if (!query) return [];
    return INDIA_STATES.filter((state) =>
      `${state.name} ${state.capital} ${state.region}`.toLocaleLowerCase().includes(query)
    ).slice(0, 6);
  }, [stateQuery]);

  const openStateFromSearch = useCallback((name: string) => {
    setActiveFilter("All");
    setSelectedFeature(null);
    setSelectedState(name);
    setShowMobileIndex(false);
    setShowPanel(true);
    setStateQuery("");
  }, []);

  // Spatial sort: compute sorted selected items and their coordinates for the map line
  const spatialSortedItems = useMemo(() => {
    if (!spatialSortDir || spatialSelection.size === 0) return [];
    const selected = displayFeaturesList
      .filter(item => spatialSelection.has(item.name))
      .map(item => {
        const coords = item.coords ?? getFeatureCoords(item.name, item.kind);
        return { ...item, coords };
      })
      .filter((item): item is typeof item & { coords: [number, number] } => item.coords !== null);

    selected.sort((a, b) => {
      if (spatialSortDir === "ns") return b.coords[1] - a.coords[1]; // North (higher lat) first
      return b.coords[0] - a.coords[0]; // East (higher lng) first
    });
    return selected;
  }, [spatialSortDir, spatialSelection, displayFeaturesList]);

  // Coordinate line for the map overlay (only selected items, in sorted order)
  const spatialSortLine = useMemo<[number, number][]>(() => {
    return spatialSortedItems.map(item => item.coords);
  }, [spatialSortedItems]);

  // Rank lookup: item name → 1-based rank in spatial sort
  const spatialRankMap = useMemo(() => {
    const map = new Map<string, number>();
    spatialSortedItems.forEach((item, i) => map.set(item.name, i + 1));
    return map;
  }, [spatialSortedItems]);

  const changeMode = useCallback((nextMode: MapMode) => {
    setMode(nextMode);
    setShowMobileIndex(false);
    setShowLayers(false);

    if (nextMode === "quiz") {
      setShowPanel(false);
      setQuizDeck(null);
      setQuizQuestion(null);
      setQuizScore(0);
      setQuizStreak(0);
      setQuizTotal(0);
      setQuizFeedback(null);
      setSelectedState(null);
      setSelectedFeature(null);
      setCorrectState(null);
      setIncorrectState(null);
    }
    if (nextMode === "explore") {
      setShowPanel(false);
      setQuizDeck(null);
      setQuizQuestion(null);
      setQuizFeedback(null);
      setCorrectState(null);
      setIncorrectState(null);
      setSelectedFeature(null);
    }
    if (nextMode === "review") {
      setShowPanel(true);
      setQuizDeck(null);
      setQuizQuestion(null);
      setQuizFeedback(null);
    }
  }, []);

  const startQuizForDeck = useCallback((deck: "states" | "rivers" | "mountains" | "parks") => {
    setQuizDeck(deck);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizTotal(0);
    setQuizFeedback(null);
    setShowPanel(true);
    if (deck === "states") {
      setActiveFilter("All");
      setLayers({ stateBorders: true, rivers: false, mountains: false, ranges: false, parks: false, stateLabels: false });
      setQuizQuestion(generateQuizQuestion());
    } else {
      if (deck === "rivers") {
        setActiveFilter("Rivers");
        setRiverBasin("All");
        setRiverLevel(3);
        setLayers({ stateBorders: true, rivers: true, mountains: false, ranges: false, parks: false, stateLabels: false });
      } else if (deck === "mountains") {
        setActiveFilter("All");
        setLayers({ stateBorders: true, rivers: false, mountains: true, ranges: false, parks: false, stateLabels: false });
      } else {
        setActiveFilter("Protected Areas");
        setLayers({ stateBorders: true, rivers: false, mountains: false, ranges: false, parks: true, stateLabels: false });
      }
      const singular = deck.replace(/s$/, "") as "river" | "mountain" | "park";
      setQuizQuestion(generateFeatureQuizQuestion(singular));
    }
  }, []);

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const flashResult = useCallback(
    (correct: string, incorrect: string | null, isCorrect: boolean, message: string) => {
      setCorrectState(correct);
      if (incorrect) setIncorrectState(incorrect);
      setHighlightedState(correct);
      setQuizFeedback({ correct: isCorrect, message });
      setFlashState(isCorrect ? "correct" : "incorrect");
      setTimeout(() => setFlashState(null), 400);

      const updated = updateMemory(memory, correct, isCorrect);
      setMemory(updated);
      saveMemory(updated);
    },
    [memory]
  );

  const handleStateClick = useCallback(
    (name: string) => {
      if (mode === "explore") {
        setSelectedFeature(null);
        setSelectedState(name === selectedState ? null : name);
        setShowPanel(true);
        return;
      }

      if (mode === "quiz" && quizQuestion?.type === "identify" && !quizFeedback) {
        setQuizTotal((t) => t + 1);
        const correct = name === quizQuestion.correctState;
        if (correct) {
          setQuizScore((s) => s + 1);
          setQuizStreak((s) => s + 1);
          flashResult(name, null, true, `${name} is correct!`);
        } else {
          setQuizStreak(0);
          flashResult(quizQuestion.correctState!, name, false, `That was ${name}. The correct answer is ${quizQuestion.correctState}.`);
        }
      }
    },
    [mode, selectedState, quizQuestion, quizFeedback, flashResult]
  );

  const handleQuizAnswer = useCallback(
    (answer: string) => {
      if (!quizQuestion || quizFeedback) return;
      setQuizTotal((t) => t + 1);
      const correct = answer === quizQuestion.correctOption;
      if (correct) {
        setQuizScore((s) => s + 1);
        setQuizStreak((s) => s + 1);
        flashResult(quizQuestion.correctState!, null, true, `${answer} is correct!`);
      } else {
        setQuizStreak(0);
        flashResult(quizQuestion.correctState!, null, false, `The correct answer is ${quizQuestion.correctOption}.`);
      }
    },
    [quizQuestion, quizFeedback, flashResult]
  );

  const handleFeatureClick = useCallback((properties: any | any[]) => {
    // Accommodate array clusters for highly accurate touch-responsive logic
    const propsList = Array.isArray(properties) ? properties : [properties];
    const topFeature = propsList[0];

    if (mode === "explore") {
      // ── Intersect mode: compute cross-layer results ──
      if (intersectMode && topFeature) {
        const category: "river" | "park" | undefined =
          topFeature._category === "river" ? "river"
          : topFeature._category === "park" ? "park"
          : undefined;

        if (category === "river" && topFeature.name) {
          const { parks, ranges } = computeRiverIntersections(
            topFeature.name,
            riversAllFeaturesRef.current,
            NATIONAL_PARKS.features as any[],
            MOUNTAIN_RANGES.features as any[]
          );
          setIntersectResults({ focusName: topFeature.name, focusType: "river", parks, ranges, rivers: [] });
          setShowPanel(true);
          return;
        }

        if (category === "park" && topFeature.name) {
          const parkFeature = (NATIONAL_PARKS.features as any[]).find(
            (f: any) => f.properties.name === topFeature.name
          );
          const coord = parkFeature?.geometry?.coordinates as [number, number] | undefined;
          const { rivers } = coord
            ? computeParkIntersections(coord, riversAllFeaturesRef.current)
            : { rivers: [] };
          setIntersectResults({ focusName: topFeature.name, focusType: "park", parks: [], ranges: [], rivers });
          setShowPanel(true);
          return;
        }
      }

      setSelectedState(null);
      setSelectedFeature(topFeature);
      setShowPanel(true);
      return;
    }

    if (mode === "quiz" && quizQuestion?.type === "identify_feature" && !quizFeedback) {
      setQuizTotal((t) => t + 1);
      
      // Graciously grant points if ANY feature within the fat bounding box matched the expected answer
      const isCorrect = propsList.some(p => p.name === quizQuestion.correctFeature?.name);
      
      if (isCorrect) {
        setQuizScore((s) => s + 1);
        setQuizStreak((s) => s + 1);
        setQuizFeedback({ correct: true, message: `${quizQuestion.correctFeature?.name} is correct!` });
        setCorrectState(quizQuestion.correctFeature?.name || null);
        setIncorrectState(null);
      } else {
        setQuizStreak(0);
        setQuizFeedback({ correct: false, message: `That was ${topFeature.name}. The correct answer is ${quizQuestion.correctFeature?.name}.` });
        setCorrectState(quizQuestion.correctFeature?.name || null);
        setIncorrectState(topFeature.name || null);
      }
    }
  }, [mode, quizQuestion, quizFeedback, intersectMode]);

  const handleNextQuestion = useCallback(() => {
    setCorrectState(null);
    setIncorrectState(null);
    setHighlightedState(null);
    setQuizFeedback(null);
    if (quizDeck === "states" || !quizDeck) {
      setQuizQuestion(generateQuizQuestion());
    } else {
      const singular = quizDeck.replace(/s$/, "") as "river" | "mountain" | "park";
      setQuizQuestion(generateFeatureQuizQuestion(singular));
    }
  }, [quizDeck]);

  const handleStateHover = useCallback((_name: string | null) => {}, []);

  const handleLockPoint = useCallback((point: [number, number]) => {
    setLockPoint(point);
    setLockMode(false); // auto-exit lock-mode after placing pin
  }, []);

  const alignedFeatures = useMemo(() => {
    if (!lockPoint) return null;
    return findAlignedFeatures(lockPoint[1], lockPoint[0]);
  }, [lockPoint]);

  const setTaxonomyFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
    setFeatureQuery("");
    setShowMobileIndex(false);
    setShowPanel(false);
    setSelectedState(null);
    setSelectedFeature(null);
    setSelectedRanges(new Set());
    setSpatialSortDir(null);
    setSpatialSelection(new Set());
    setIntersectMode(false);
    setIntersectResults(null);
    setLayers({
      stateBorders: true,
      rivers: filter === "Rivers",
      mountains: filter === "Himalayas" || filter === "Peninsular" || filter === "Passes",
      ranges: filter === "Himalayas" || filter === "Peninsular",
      parks: filter === "Protected Areas",
      stateLabels: filter === "All" || filter === "Passes",
    });
  }, []);

  const selectedStateData = selectedState ? STATE_BY_NAME[selectedState] : null;

  return (
    <div className="geography-workspace relative flex h-dvh flex-col overflow-hidden bg-[#151a16]">
      {/* Atlas header */}
      <div className="absolute left-2 right-2 top-2 z-40 flex items-center justify-between gap-2 sm:left-3 sm:right-3 sm:top-3">
        <div className="geo-chrome flex min-w-0 items-center border border-[#394239] bg-[#171d18]/95 p-1.5 text-[#eee9df] shadow-[0_18px_50px_rgba(7,10,8,0.24)] backdrop-blur-xl">
          <Link
            href="/app"
            aria-label="Back to dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center border-r border-[#394239] text-[#a6aaa1] transition-colors hover:bg-[#222a23] hover:text-[#eee9df]"
            title="Back to dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center bg-[#ef5c49]/10">
            <Globe className="h-4 w-4 text-[#ef5c49]" />
          </div>
          <div className="min-w-0 px-2.5">
            <p className="truncate text-xs font-semibold tracking-[-0.02em] text-[#eee9df] sm:text-sm">India Field Atlas</p>
            <p className="hidden font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#818981] sm:block">UPSC geography</p>
          </div>
        </div>

        <div className="geo-chrome hidden items-center border border-[#394239] bg-[#171d18]/95 p-1 shadow-[0_18px_50px_rgba(7,10,8,0.24)] backdrop-blur-xl sm:flex">
          <ModePill active={mode === "explore"} icon={<Eye className="w-3.5 h-3.5" />} label="Explore" onClick={() => changeMode("explore")} />
          <ModePill active={mode === "quiz"} icon={<Crosshair className="w-3.5 h-3.5" />} label="Quiz" onClick={() => changeMode("quiz")} />
          <ModePill active={mode === "review"} icon={<Brain className="w-3.5 h-3.5" />} label="Review" onClick={() => changeMode("review")} />
        </div>

        <div className="geo-chrome flex items-center border border-[#394239] bg-[#171d18]/95 p-1 shadow-[0_18px_50px_rgba(7,10,8,0.24)] backdrop-blur-xl">
          {mode === "explore" ? (
            <button
              type="button"
              onClick={() => setShowMobileIndex(true)}
              aria-label="Open map index"
              className="flex h-10 w-10 items-center justify-center text-[#a6aaa1] transition-colors hover:bg-[#222a23] hover:text-[#eee9df] sm:hidden"
            >
              <MapIcon className="h-4 w-4" />
            </button>
          ) : null}
          {/* River filter shortcut on mobile */}
          {mode === "explore" && activeFilter === "Rivers" && (
            <button
              type="button"
              onClick={() => setShowRiverFilterSheet(true)}
              aria-label="Open river filters"
              className="flex h-10 w-10 items-center justify-center text-[#ef5c49] transition-colors hover:bg-[#222a23] sm:hidden"
              title="River filters"
            >
              <Droplets className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLayers(!showLayers)}
            aria-label="Map layers and reference tools"
            aria-pressed={showLayers}
            className={`flex h-10 w-10 items-center justify-center transition-colors ${
              showLayers ? "bg-[#ef5c49] text-[#151a16]" : "text-[#a6aaa1] hover:bg-[#222a23] hover:text-[#eee9df]"
            }`}
            title="Toggle layers"
          >
            <Layers className="w-4 h-4" />
          </button>
          {/* Intersect toggle — only visible in explore mode with a feature filter */}
          {mode === "explore" && ["Rivers", "Protected Areas"].includes(activeFilter) && (
            <button
              type="button"
              onClick={() => {
                setIntersectMode((prev) => {
                  if (prev) setIntersectResults(null);
                  return !prev;
                });
              }}
              aria-label="Find geographic intersections"
              aria-pressed={intersectMode}
              className={`flex h-10 w-10 items-center justify-center transition-colors ${
                intersectMode
                  ? "bg-[#ef5c49] text-[#151a16]"
                  : "text-[#a6aaa1] hover:bg-[#222a23] hover:text-[#eee9df]"
              }`}
              title="Find what a river or park crosses"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          {(mode !== "explore" || selectedState || selectedFeature || ["Rivers", "Himalayas", "Peninsular", "Passes", "Protected Areas"].includes(activeFilter)) && (
            <button
              type="button"
              onClick={() => setShowPanel(!showPanel)}
              aria-label={showPanel ? "Close atlas information" : "Open atlas information"}
              aria-expanded={showPanel}
              className="flex h-10 w-10 items-center justify-center text-[#a6aaa1] transition-colors hover:bg-[#222a23] hover:text-[#eee9df] lg:hidden"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Map index */}
      {mode === "explore" && <div className="pointer-events-none absolute left-0 right-0 top-[3.25rem] z-30 hidden sm:left-3 sm:right-auto sm:top-16 sm:block">
        <div className="geo-chrome mx-2 flex items-center overflow-x-auto border border-[#394239] bg-[#171d18]/94 p-1 shadow-[0_18px_50px_rgba(7,10,8,0.22)] backdrop-blur-xl scrollbar-hide pointer-events-auto sm:mx-0">
          {[
            { key: "All", label: "States", icon: <Globe className="w-3 h-3" /> },
            { key: "Rivers", label: "Rivers", icon: <Droplets className="w-3 h-3" /> },
            { key: "Himalayas", label: "Himalayas", icon: <Mountain className="w-3 h-3" /> },
            { key: "Peninsular", label: "Peninsular", icon: <Mountain className="w-3 h-3" /> },
            { key: "Passes", label: "Passes", icon: <MapIcon className="w-3 h-3" /> },
            { key: "Protected Areas", label: "Parks", icon: <TreePine className="w-3 h-3" /> },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setTaxonomyFilter(f.key)}
              aria-pressed={activeFilter === f.key}
              className={`flex min-h-10 shrink-0 items-center gap-1.5 border px-3 font-mono text-[9px] font-bold uppercase tracking-[0.1em] whitespace-nowrap transition-colors ${
                activeFilter === f.key
                  ? "border-[#ef5c49] bg-[#ef5c49] text-[#151a16]"
                  : "border-transparent text-[#a6aaa1] hover:border-[#465047] hover:text-[#eee9df]"
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>}

      {mode === "explore" && showMobileIndex ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/45 sm:hidden" onClick={() => setShowMobileIndex(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="atlas-index-title" className="fixed bottom-0 left-0 right-0 z-50 bg-[#f2ede3] pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-18px_60px_rgba(7,10,8,0.28)] sm:hidden">
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-[#b6aea2]" />
            <div className="flex items-center justify-between px-4 pb-3">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#c2382e]">Study layer</p>
                <h2 id="atlas-index-title" className="mt-1 text-xl font-semibold tracking-[-0.04em] text-[#182019]">Map index</h2>
              </div>
              <button type="button" aria-label="Close map index" onClick={() => setShowMobileIndex(false)} className="flex h-11 w-11 items-center justify-center text-[#71776f] hover:text-[#182019]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-4 pb-3">
              <label className="relative block">
                <span className="sr-only">Find a state or capital</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71776f]" />
                <input type="search" value={stateQuery} onChange={(event) => setStateQuery(event.target.value)} placeholder="Find a state or capital" className="min-h-12 w-full border border-[#c8c1b5] bg-[#f8f4eb] pl-10 pr-3 text-base text-[#182019] placeholder:text-[#8c918a] focus:border-[#c2382e] focus:outline-none" />
              </label>
              {matchingStates.length > 0 ? (
                <div className="border-x border-b border-[#c8c1b5] bg-[#f8f4eb]">
                  {matchingStates.map((state) => (
                    <button key={state.name} type="button" onClick={() => openStateFromSearch(state.name)} className="flex min-h-11 w-full items-center justify-between border-b border-[#d7d1c6] px-3 text-left last:border-b-0 hover:bg-[#e8e3d9]">
                      <span className="text-sm font-semibold text-[#182019]">{state.name}</span>
                      <span className="text-xs text-[#71776f]">{state.capital}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="border-t border-[#c8c1b5] px-4">
              {[
                { key: "All", label: "States", icon: <Globe className="h-4 w-4" /> },
                { key: "Rivers", label: "Rivers", icon: <Droplets className="h-4 w-4" /> },
                { key: "Himalayas", label: "Himalayas", icon: <Mountain className="h-4 w-4" /> },
                { key: "Peninsular", label: "Peninsular systems", icon: <Mountain className="h-4 w-4" /> },
                { key: "Passes", label: "Passes", icon: <MapIcon className="h-4 w-4" /> },
                { key: "Protected Areas", label: "Protected areas", icon: <TreePine className="h-4 w-4" /> },
              ].map((item, index) => (
                <button key={item.key} type="button" aria-pressed={activeFilter === item.key} onClick={() => setTaxonomyFilter(item.key)} className={`flex min-h-12 w-full items-center gap-3 border-b border-[#c8c1b5] text-left ${activeFilter === item.key ? "text-[#c2382e]" : "text-[#182019]"}`}>
                  <span className="w-5 font-mono text-[9px] font-bold text-[#c2382e]">0{index + 1}</span>
                  <span className="text-[#71776f]">{item.icon}</span>
                  <span className="text-sm font-semibold">{item.label}</span>
                  {activeFilter === item.key ? <Check className="ml-auto h-4 w-4" /> : null}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* ── Rivers filter — inline on desktop, bottom sheet on mobile ── */}
      {mode === "explore" && activeFilter === "Rivers" && (
        <div className="hidden sm:block absolute top-[6.5rem] left-3 z-30 pointer-events-auto">
          {showRiverConfig ? (
            <div className="geo-chrome flex items-center gap-3 border border-[#394239] bg-[#171d18]/94 p-2.5 pr-3 text-[#eee9df] shadow-[0_18px_50px_rgba(7,10,8,0.22)] backdrop-blur-xl animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="flex items-center gap-2 min-w-[10rem]">
                <label className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#a6aaa1]">Detail</label>
                <input
                  type="range" min="1" max="5"
                  value={riverLevel} onChange={(e) => setRiverLevel(Number(e.target.value))}
                  className="w-24 accent-[#ef5c49]"
                />
                <span className="w-4 text-xs font-bold tabular-nums text-[#ef5c49]">{riverLevel}</span>
              </div>
              <div className="h-5 w-px bg-[#394239]" />
              <select
                value={riverBasin}
                onChange={(e) => setRiverBasin(e.target.value)}
                aria-label="River basin"
                className="cursor-pointer border-none bg-[#171d18] pr-4 text-xs font-semibold text-[#eee9df] focus:outline-none"
              >
                <option value="All">All Basins</option>
                <option value="Ganga Basin">Ganga</option>
                <option value="Indus Basin">Indus</option>
                <option value="Brahmaputra Basin">Brahmaputra</option>
                <option value="Godavari Basin">Godavari</option>
                <option value="Krishna Basin">Krishna</option>
                <option value="Narmada Basin">Narmada</option>
                <option value="Mahanadi Basin">Mahanadi</option>
                <option value="Kaveri Basin">Kaveri</option>
                <option value="Peninsular Rivers">Peninsular</option>
              </select>
              <button type="button" aria-label="Close river filters" onClick={() => setShowRiverConfig(false)} className="p-1 text-[#a6aaa1] transition-colors hover:text-[#eee9df]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRiverConfig(true)}
              className="geo-chrome flex min-h-10 items-center gap-2 border border-[#394239] bg-[#171d18]/94 px-3 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#eee9df] shadow-[0_18px_50px_rgba(7,10,8,0.22)] backdrop-blur-xl transition-colors hover:border-[#59645a]"
            >
              <Droplets className="h-3.5 w-3.5 text-[#ef5c49]" />
              River filters
              <ChevronDown className="h-3 w-3 text-[#a6aaa1]" />
            </button>
          )}
        </div>
      )}

      {/* ── Mobile river filter bottom sheet ── */}
      {mode === "explore" && activeFilter === "Rivers" && showRiverFilterSheet && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 sm:hidden animate-in fade-in duration-200"
            onClick={() => setShowRiverFilterSheet(false)}
          />
          <div role="dialog" aria-modal="true" aria-labelledby="river-filter-title" className="fixed bottom-0 left-0 right-0 z-50 bg-[#f2ede3] shadow-[0_-18px_60px_rgba(7,10,8,0.28)] sm:hidden animate-in slide-in-from-bottom-4 duration-200 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto mb-2 mt-3 h-1 w-10 rounded-full bg-[#b6aea2]" />
            <div className="px-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-[#c2382e]" />
                <h3 id="river-filter-title" className="text-sm font-bold text-[#182019]">River filters</h3>
              </div>
              <button
                type="button"
                aria-label="Close river filters"
                onClick={() => setShowRiverFilterSheet(false)}
                className="p-2 text-[#71776f] hover:text-[#182019]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#646a62]">Detail level</label>
                  <span className="text-xs font-bold tabular-nums text-[#c2382e]">Level {riverLevel}</span>
                </div>
                <input
                  type="range" min="1" max="5"
                  value={riverLevel}
                  onChange={(e) => setRiverLevel(Number(e.target.value))}
                  className="h-2 w-full accent-[#c2382e]"
                />
                <div className="flex justify-between text-[10px] text-[#71776f] mt-1 px-0.5">
                  <span>Major</span>
                  <span>All</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#646a62]">Basin</label>
                <select
                  value={riverBasin}
                  onChange={(e) => setRiverBasin(e.target.value)}
                  aria-label="River basin"
                  className="w-full border border-[#c8c1b5] bg-[#f8f4eb] px-3 py-2.5 text-sm font-semibold text-[#182019] focus:border-[#c2382e] focus:outline-none"
                >
                  <option value="All">All Basins</option>
                  <option value="Ganga Basin">Ganga</option>
                  <option value="Indus Basin">Indus</option>
                  <option value="Brahmaputra Basin">Brahmaputra</option>
                  <option value="Godavari Basin">Godavari</option>
                  <option value="Krishna Basin">Krishna</option>
                  <option value="Narmada Basin">Narmada</option>
                  <option value="Mahanadi Basin">Mahanadi</option>
                  <option value="Kaveri Basin">Kaveri</option>
                  <option value="Peninsular Rivers">Peninsular</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setShowRiverFilterSheet(false)}
                className="w-full bg-[#c2382e] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#a92f28] active:scale-[0.98]"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Layer controls — compact floating card ──────────────── */}
      {showLayers && (
        <div role="dialog" aria-label="Map settings" className="absolute bottom-[5rem] left-3 right-3 z-40 border border-[#c8c1b5] bg-[#f2ede3]/98 p-3 shadow-[0_18px_60px_rgba(7,10,8,0.24)] backdrop-blur-xl sm:bottom-4 sm:right-auto sm:w-[max-content] sm:max-w-[calc(100vw-1.5rem)] animate-in slide-in-from-bottom-4 fade-in duration-200">
          {/* Base map toggle */}
          <p className="mb-2 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#646a62]">Map style</p>
          <div className="mb-3 flex items-center gap-1 border border-[#d7d1c6] bg-[#e8e3d9] p-1">
            <button
              type="button"
              onClick={() => setBaseMap("physical")}
              aria-pressed={baseMap === "physical"}
              className={`flex min-h-9 items-center gap-1 px-2.5 text-[11px] font-semibold transition-colors ${
                baseMap === "physical" ? "bg-[#182019] text-[#f5f1e8]" : "text-[#71776f] hover:text-[#182019]"
              }`}
            >
              <Globe className="w-3 h-3" /> Terrain
            </button>
            <button
              type="button"
              onClick={() => setBaseMap("satellite")}
              aria-pressed={baseMap === "satellite"}
              className={`flex min-h-9 items-center gap-1 px-2.5 text-[11px] font-semibold transition-colors ${
                baseMap === "satellite" ? "bg-[#182019] text-[#f5f1e8]" : "text-[#71776f] hover:text-[#182019]"
              }`}
            >
              <Satellite className="w-3 h-3" /> Satellite
            </button>
            <button
              type="button"
              onClick={() => setBaseMap("clean")}
              aria-pressed={baseMap === "clean"}
              className={`flex min-h-9 items-center gap-1 px-2.5 text-[11px] font-semibold transition-colors ${
                baseMap === "clean" ? "bg-[#182019] text-[#f5f1e8]" : "text-[#71776f] hover:text-[#182019]"
              }`}
            >
              <Palette className="w-3 h-3" /> Atlas
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <LayerToggle icon={<MapIcon className="w-3 h-3" />} label="Borders" active={layers.stateBorders} onToggle={() => toggleLayer("stateBorders")} />
            <LayerToggle icon={<Droplets className="w-3 h-3" />} label="Rivers" active={layers.rivers} onToggle={() => toggleLayer("rivers")} />
            <LayerToggle icon={<Mountain className="w-3 h-3" />} label="Peaks" active={layers.mountains} onToggle={() => toggleLayer("mountains")} />
            <LayerToggle icon={<Mountain className="w-3 h-3" />} label="Ranges" active={layers.ranges} onToggle={() => toggleLayer("ranges")} />
            <LayerToggle icon={<TreePine className="w-3 h-3" />} label="Parks" active={layers.parks} onToggle={() => toggleLayer("parks")} />
            <LayerToggle icon={<Tags className="w-3 h-3" />} label="Labels" active={layers.stateLabels} onToggle={() => toggleLayer("stateLabels")} />
          </div>

          {/* Grid Lines + Lock tool */}
          <div className="mt-3 border-t border-[#d7d1c6] pt-3">
            <p className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#646a62]">Reference tools</p>
            <div className="flex gap-1">
              <LayerToggle icon={<Grid3x3 className="w-3 h-3" />} label="Grid Lines" active={showGridLines} onToggle={() => setShowGridLines(g => !g)} />
              <LayerToggle
                icon={<LocateFixed className="w-3 h-3" />}
                label={lockMode ? "Click map…" : lockPoint ? "Lock ✓" : "Lat/Lng Lock"}
                active={lockMode || !!lockPoint}
                onToggle={() => {
                  if (lockPoint) { setLockPoint(null); setLockMode(false); }
                  else setLockMode(l => !l);
                }}
              />
            </div>
            {showGridLines && (
              <div className="mt-1.5 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-[#92400E]">
                  <span className="inline-block w-5 border-t-2 border-dashed border-[#D97706]" />
                  Tropic of Cancer, 23.5°N
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#065F46]">
                  <span className="inline-block w-5 border-t-2 border-dashed border-[#059669]" />
                  Indian Standard Meridian, 82.5°E
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main content area ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map area */}
        <div className="flex-1 relative">
          {mode === "quiz" && !quizDeck && (
            <div role="dialog" aria-modal="true" aria-labelledby="quiz-deck-title" className="absolute inset-0 z-50 flex items-center justify-center bg-[#101411]/85 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
                <div className="text-center mb-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#ef5c49]/40 bg-[#ef5c49]/10">
                    <Crosshair className="h-6 w-6 text-[#ef5c49]" />
                  </div>
                  <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#ef5c49]">Map recall</p>
                  <h2 id="quiz-deck-title" className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#eee9df]">Choose a quiz deck</h2>
                  <p className="mt-2 text-sm text-[#a6aaa1]">Recall locations without printed map labels.</p>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "states", title: "State recall", icon: <MapPin className="w-5 h-5" />, desc: "Locations, capitals, neighbours, and key facts", accent: "text-blue-300" },
                    { id: "rivers", title: "River systems", icon: <Droplets className="w-5 h-5" />, desc: "Himalayan and Peninsular drainage basins", accent: "text-cyan-300" },
                    { id: "mountains", title: "Peaks and passes", icon: <Mountain className="w-5 h-5" />, desc: "Mountain peaks and strategic passes", accent: "text-amber-300" },
                    { id: "parks", title: "Protected areas", icon: <TreePine className="w-5 h-5" />, desc: "National parks and biosphere reserves", accent: "text-emerald-300" },
                  ].map((deck) => (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => startQuizForDeck(deck.id as any)}
                      className="group flex min-h-16 w-full items-center gap-4 border border-[#394239] bg-[#171d18]/90 px-4 py-3.5 text-left transition-colors hover:border-[#59645a] hover:bg-[#222a23] active:scale-[0.98]"
                    >
                      <div className={`${deck.accent} shrink-0`}>{deck.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#eee9df]">{deck.title}</h3>
                        <p className="mt-0.5 truncate text-xs text-[#818981]">{deck.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[#59645a] transition-colors group-hover:text-[#ef5c49]" />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => changeMode("explore")}
                  className="mt-4 w-full py-3 text-center font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#818981] transition-colors hover:text-[#eee9df]"
                >
                  Return to explore
                </button>
              </div>
            </div>
          )}
          
          <IndiaMap
            mode={mode}
            baseMap={baseMap}
            selectedState={selectedState}
            highlightedState={highlightedState}
            correctState={correctState}
            incorrectState={incorrectState}
            memory={memory}
            selectedFeatureName={selectedFeature?.name || null}
            disableStateSelection={activeFilter !== "All"}
            prioritizeStateSelection={mode === "quiz" && quizDeck === "states"}
            hideStudyLabels={mode === "quiz" && !quizFeedback}
            activeFilter={activeFilter}
            riverLevel={riverLevel}
            riverBasin={riverBasin}
            hiddenRivers={Array.from(hiddenRivers)}
            hiddenPeaks={Array.from(hiddenPeaks)}
            hiddenParks={Array.from(hiddenParks)}
            layers={layers}
            selectedRanges={Array.from(selectedRanges)}
            spatialSortLine={spatialSortLine}
            intersectMode={intersectMode}
            intersectFocusName={intersectResults?.focusName ?? null}
            intersectFocusType={intersectResults?.focusType}
            intersectingParkNames={intersectResults?.parks.map((p) => p.name) ?? []}
            intersectingRangeNames={intersectResults?.ranges.map((r) => r.name) ?? []}
            showGridLines={showGridLines}
            lockPoint={lockPoint}
            lockMode={lockMode}
            onLockPoint={handleLockPoint}
            onStateClick={handleStateClick}
            onStateHover={handleStateHover}
            onFeatureClick={handleFeatureClick}
          />

          {/* ── Lock mode instruction banner ── */}
          {lockMode && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-[#6366F1] px-4 py-2 shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <ScanLine className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-[11px] font-semibold text-white whitespace-nowrap">Click anywhere to lock the axis</span>
              <button
                onClick={() => setLockMode(false)}
                className="ml-1 rounded-full bg-white/20 p-0.5 hover:bg-white/30 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}

          {/* ── Floating map legend ── */}
          {activeFilter === "Protected Areas" && (
            <div className="absolute bottom-[5.5rem] sm:bottom-14 left-3 sm:left-auto sm:right-3 z-20 bg-white/90 backdrop-blur-xl rounded-lg shadow-lg shadow-black/[0.04] border border-white/60 px-3 py-2 space-y-1.5 animate-in fade-in duration-200">
              <p className="text-[9px] font-bold text-[#71776f] uppercase tracking-wider">Legend</p>
              {[
                { color: "#16A34A", label: "National Park" },
                { color: "#F59E0B", label: "Tiger Reserve" },
                { color: "#8B5CF6", label: "Biosphere Reserve" },
                { color: "#06B6D4", label: "Wildlife Sanctuary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white" style={{ background: item.color }} />
                  <span className="text-[11px] text-[#454c46]">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {(activeFilter === "Himalayas" || activeFilter === "Passes") && (
            <div className="absolute bottom-[5.5rem] sm:bottom-14 left-3 sm:left-auto sm:right-3 z-20 bg-white/90 backdrop-blur-xl rounded-lg shadow-lg shadow-black/[0.04] border border-white/60 px-3 py-2 space-y-1.5 animate-in fade-in duration-200">
              <p className="text-[9px] font-bold text-[#71776f] uppercase tracking-wider">Legend</p>
              {[
                { color: "#D97706", label: "Mountain Peak" },
                { color: "#3B82F6", label: "Mountain Pass" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white" style={{ background: item.color }} />
                  <span className="text-[11px] text-[#454c46]">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Side panel / Bottom sheet ── */}
        <div
          role={showPanel ? "dialog" : "complementary"}
          aria-modal={showPanel ? true : undefined}
          aria-label="Atlas information"
          className={`
            shrink-0 overflow-y-auto border-[#c8c1b5] bg-[#f2ede3]/98 text-[#182019] backdrop-blur-xl
            ${
              showPanel
                ? "fixed bottom-0 left-0 right-0 z-50 h-[72dvh] border-t shadow-[0_-18px_60px_rgba(7,10,8,0.25)] lg:relative lg:inset-auto lg:h-auto lg:w-[22rem] lg:border-l lg:border-t-0 lg:shadow-none animate-in slide-in-from-bottom-8 lg:slide-in-from-right duration-200"
                : "hidden lg:relative lg:block lg:w-[22rem] lg:border-l"
            }
          `}
        >
          {showPanel && (
            <div className="mx-auto mb-1 mt-3 h-1 w-10 rounded-full bg-[#b6aea2] lg:hidden" />
          )}
          <div className="space-y-5 p-4 pb-20 lg:p-6 lg:pb-16 lg:pt-20">
            {showPanel && !(
              mode === "explore" &&
              (selectedStateData || selectedFeature || (intersectMode && intersectResults) || lockPoint)
            ) && (
              <button
                onClick={() => setShowPanel(false)}
                aria-label="Close atlas information"
                className="absolute right-4 top-4 z-10 p-2 text-[#71776f] transition-colors hover:bg-[#e8e3d9] hover:text-[#182019] lg:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* ── Lat/Lng Lock panel ── */}
            {lockPoint && alignedFeatures && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                      <ScanLine className="w-3.5 h-3.5 text-[#6366F1]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#182019]">Lat / Lng Lock</p>
                      <p className="text-[10px] text-[#646a62] font-mono">
                        {lockPoint[1].toFixed(2)}°N, {lockPoint[0].toFixed(2)}°E
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close coordinate study"
                    onClick={() => { setLockPoint(null); setLockMode(false); }}
                    className="rounded-md p-1 text-[#71776f] hover:text-[#182019] hover:bg-[#e8e3d9] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Same Latitude */}
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-block w-4 border-t-2 border-dashed border-[#6366F1]" />
                    <p className="text-[10px] font-bold text-[#6366F1] uppercase tracking-wider">
                      Same Latitude (~{lockPoint[1].toFixed(1)}°N)
                    </p>
                  </div>
                  {alignedFeatures.sameLat.length === 0 ? (
                    <p className="text-[11px] text-[#71776f] italic px-1">No major features at this latitude</p>
                  ) : (
                    <div className="space-y-1">
                      {alignedFeatures.sameLat.slice(0, 12).map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-[#F9F5FF] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] shrink-0">
                              {f.featureType === "city" ? "🏙️" : f.featureType === "park" ? "🌿" : f.featureType === "pass" ? "🏔️" : "⛰️"}
                            </span>
                            <span className="text-[11px] font-medium text-[#182019] truncate">{f.name}</span>
                          </div>
                          <span className="text-[9px] text-[#71776f] font-mono shrink-0 ml-1">
                            {f.coords[1].toFixed(1)}°N
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Same Longitude */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-block w-4 border-l-2 border-dashed border-[#8B5CF6] h-4" />
                    <p className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider">
                      Same Longitude (~{lockPoint[0].toFixed(1)}°E)
                    </p>
                  </div>
                  {alignedFeatures.sameLng.length === 0 ? (
                    <p className="text-[11px] text-[#71776f] italic px-1">No major features at this longitude</p>
                  ) : (
                    <div className="space-y-1">
                      {alignedFeatures.sameLng.slice(0, 12).map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-[#F5F3FF] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] shrink-0">
                              {f.featureType === "city" ? "🏙️" : f.featureType === "park" ? "🌿" : f.featureType === "pass" ? "🏔️" : "⛰️"}
                            </span>
                            <span className="text-[11px] font-medium text-[#182019] truncate">{f.name}</span>
                          </div>
                          <span className="text-[9px] text-[#71776f] font-mono shrink-0 ml-1">
                            {f.coords[0].toFixed(1)}°E
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setLockMode(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#c8c1b5] px-3 py-1.5 text-[11px] font-semibold text-[#646a62] hover:bg-[#f8f4eb] hover:text-[#182019] transition-colors"
                >
                  <LocateFixed className="w-3 h-3" /> Click new location
                </button>
              </div>
            )}

            {mode === "explore" && selectedStateData && (
              <StateInfoPanel state={selectedStateData} onClose={() => { setSelectedState(null); setShowPanel(false); }} />
            )}

            {mode === "explore" && selectedFeature && (
              <FeatureInfoPanel feature={selectedFeature} onClose={() => { setSelectedFeature(null); setShowPanel(false); }} />
            )}

            {mode === "explore" && !selectedStateData && !selectedFeature && !["Rivers", "Himalayas", "Peninsular", "Passes", "Protected Areas"].includes(activeFilter) && (
              <div className="py-2">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#c2382e]">Map study</p>
                <h2 className="mt-4 text-3xl font-semibold leading-[1.05] tracking-[-0.05em] text-[#182019]">Trace systems. Recall locations.</h2>
                <p className="mt-4 text-sm leading-6 text-[#646a62]">Start with a state, follow a physical system, or test what you can place without labels.</p>
                <div className="mt-6">
                  <label className="relative block">
                    <span className="sr-only">Find a state or capital</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#71776f]" />
                    <input type="search" value={stateQuery} onChange={(event) => setStateQuery(event.target.value)} placeholder="Find a state or capital" className="min-h-11 w-full border border-[#c8c1b5] bg-[#f8f4eb] pl-10 pr-3 text-sm text-[#182019] placeholder:text-[#8c918a] focus:border-[#c2382e] focus:outline-none" />
                  </label>
                  {matchingStates.length > 0 ? (
                    <div className="border-x border-b border-[#c8c1b5] bg-[#f8f4eb]">
                      {matchingStates.map((state) => (
                        <button key={state.name} type="button" onClick={() => openStateFromSearch(state.name)} className="flex min-h-10 w-full items-center justify-between border-b border-[#d7d1c6] px-3 text-left last:border-b-0 hover:bg-[#e8e3d9]">
                          <span className="text-sm font-semibold text-[#182019]">{state.name}</span>
                          <span className="text-xs text-[#71776f]">{state.capital}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="mt-7 border-t border-[#c8c1b5]">
                  {[
                    { number: "01", label: "Trace a river system", filter: "Rivers", icon: <Droplets className="h-4 w-4" /> },
                    { number: "02", label: "Compare mountain ranges", filter: "Himalayas", icon: <Mountain className="h-4 w-4" /> },
                    { number: "03", label: "Study protected areas", filter: "Protected Areas", icon: <TreePine className="h-4 w-4" /> },
                  ].map((item) => (
                    <button
                      key={item.number}
                      type="button"
                      onClick={() => setTaxonomyFilter(item.filter)}
                      className="group flex min-h-14 w-full items-center gap-3 border-b border-[#c8c1b5] text-left text-[#182019] transition-colors hover:bg-[#e8e3d9]"
                    >
                      <span className="font-mono text-[9px] font-bold text-[#c2382e]">{item.number}</span>
                      <span className="text-[#71776f] group-hover:text-[#c2382e]">{item.icon}</span>
                      <span className="text-sm font-semibold">{item.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4 text-[#8c918a] group-hover:text-[#c2382e]" />
                    </button>
                  ))}
                </div>
                <p className="mt-6 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#71776f]">
                  <MapPin className="h-3.5 w-3.5 text-[#c2382e]" /> Select any state for its field notes
                </p>
              </div>
            )}

            {/* ── Intersect results panel ──────────────────────────────── */}
            {mode === "explore" && intersectMode && intersectResults && !selectedStateData && !selectedFeature && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Share2 className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-amber-600">Intersect</p>
                      <h3 className="text-base font-bold text-[#182019] font-serif leading-tight">{intersectResults.focusName}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIntersectResults(null); setIntersectMode(false); }}
                    className="rounded-md p-1 text-[#71776f] hover:text-[#182019] hover:bg-[#e8e3d9] transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-2">
                  {intersectResults.focusType === "river"
                    ? <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    : <TreePine className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  <p className="text-xs text-[#454c46]">
                    {intersectResults.focusType === "river"
                      ? "Parks & ranges this river passes through"
                      : "Rivers that flow near this park"}
                  </p>
                </div>

                {intersectResults.focusType === "river" && (
                  <>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#71776f] mb-1.5">
                        Protected Areas <span className="text-amber-600">({intersectResults.parks.length})</span>
                      </p>
                      {intersectResults.parks.length === 0 ? (
                        <p className="text-xs text-[#71776f] italic px-1">None detected along this river</p>
                      ) : (
                        <div className="space-y-1">
                          {intersectResults.parks.map((park) => {
                            const catColor = park.category === "TR"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : park.category === "BR"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : park.category === "WLS"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200";
                            const catLabel = park.category === "TR" ? "Tiger Reserve"
                              : park.category === "BR" ? "Biosphere Reserve"
                              : park.category === "WLS" ? "Wildlife Sanctuary"
                              : "National Park";
                            return (
                              <div key={park.name} className="flex items-center gap-2 rounded-lg bg-[#f8f4eb] border border-[#c8c1b5]/60 px-2.5 py-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[#182019] truncate">{park.name}</p>
                                  <p className="text-[10px] text-[#71776f]">{park.state}</p>
                                </div>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${catColor}`}>
                                  {catLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#71776f] mb-1.5">
                        Mountain Ranges <span className="text-amber-600">({intersectResults.ranges.length})</span>
                      </p>
                      {intersectResults.ranges.length === 0 ? (
                        <p className="text-xs text-[#71776f] italic px-1">No ranges intersect this river</p>
                      ) : (
                        <div className="space-y-1">
                          {intersectResults.ranges.map((range) => (
                            <div key={range.name} className="flex items-center gap-2 rounded-lg bg-[#f8f4eb] border border-[#c8c1b5]/60 px-2.5 py-2">
                              <Mountain className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <p className="text-xs font-semibold text-[#182019]">{range.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {intersectResults.focusType === "park" && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#71776f] mb-1.5">
                      Nearby Rivers <span className="text-amber-600">({intersectResults.rivers.length})</span>
                    </p>
                    {intersectResults.rivers.length === 0 ? (
                      <p className="text-xs text-[#71776f] italic px-1">No rivers detected near this park</p>
                    ) : (
                      <div className="space-y-1">
                        {intersectResults.rivers.map((river) => (
                          <div key={river} className="flex items-center gap-2 rounded-lg bg-[#f8f4eb] border border-[#c8c1b5]/60 px-2.5 py-2">
                            <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <p className="text-xs font-semibold text-[#182019]">{river}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-[#71776f] text-center pt-1">Click another feature to update</p>
              </div>
            )}

            {/* ── Intersect prompt (mode on, no result yet) ── */}
            {mode === "explore" && intersectMode && !intersectResults && !selectedStateData && !selectedFeature && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#182019] mb-1">Intersect Mode Active</h3>
                  <p className="text-xs text-[#71776f] leading-relaxed max-w-[220px]">
                    Click any <span className="font-semibold text-blue-600">river</span> or{" "}
                    <span className="font-semibold text-emerald-600">park</span> on the map to see
                    what it geographically crosses.
                  </p>
                </div>
                <button
                  onClick={() => setIntersectMode(false)}
                  className="text-xs text-[#71776f] hover:text-[#182019] transition-colors underline underline-offset-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ── Normal feature list ── */}
            {mode === "explore" && !intersectMode && !selectedStateData && !selectedFeature && ["Rivers", "Himalayas", "Peninsular", "Passes", "Protected Areas"].includes(activeFilter) && (
              <div className="flex min-h-full flex-col">
                <div className="shrink-0 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#c2382e]">Atlas index</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#182019]">{activeFilter === "Peninsular" ? "Peninsular systems" : activeFilter}</h3>
                      <p className="mt-1 text-[10px] text-[#71776f]">{visibleFeaturesList.length} of {displayFeaturesList.length} shown</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(hiddenRivers.size > 0 || hiddenPeaks.size > 0 || hiddenParks.size > 0) && (
                        <button type="button" onClick={() => { setHiddenRivers(new Set()); setHiddenPeaks(new Set()); setHiddenParks(new Set()); }} className="text-[10px] text-[#c2382e] hover:underline font-semibold">
                          Reset
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (spatialSortDir) {
                            setSpatialSortDir(null);
                            setSpatialSelection(new Set());
                          } else {
                            setSpatialSortDir("ns");
                            setSpatialSelection(new Set());
                          }
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                          spatialSortDir
                            ? "bg-[#c2382e] text-white shadow-sm"
                            : "text-[#c2382e] bg-[#c2382e]/10 hover:bg-[#c2382e]/20 border border-[#c2382e]/30"
                        }`}
                        title="Spatial sort. Select features and compare position."
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Sort</span>
                      </button>
                    </div>
                  </div>

                  <label className="relative block">
                    <span className="sr-only">Search {activeFilter}</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71776f]" />
                    <input
                      type="search"
                      value={featureQuery}
                      onChange={(event) => setFeatureQuery(event.target.value)}
                      placeholder={`Search ${activeFilter.toLocaleLowerCase()}`}
                      className="min-h-11 w-full border border-[#c8c1b5] bg-[#f8f4eb] pl-9 pr-9 text-sm text-[#182019] placeholder:text-[#8c918a] focus:border-[#c2382e] focus:outline-none"
                    />
                    {featureQuery ? (
                      <button type="button" aria-label="Clear search" onClick={() => setFeatureQuery("")} className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#71776f] hover:text-[#182019]">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </label>

                  {/* Spatial sort direction bar */}
                  {spatialSortDir && (
                    <div className="flex items-center gap-1.5 bg-[#f8f4eb] rounded-lg border border-[#c8c1b5]/80 p-1 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex items-center rounded-md bg-white shadow-sm border border-[#c8c1b5]/50 p-0.5">
                        <button
                          onClick={() => setSpatialSortDir("ns")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            spatialSortDir === "ns"
                              ? "bg-[#c2382e] text-white"
                              : "text-[#71776f] hover:text-[#182019]"
                          }`}
                        >
                          <ArrowDown className="w-2.5 h-2.5" /> N→S
                        </button>
                        <button
                          onClick={() => setSpatialSortDir("ew")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            spatialSortDir === "ew"
                              ? "bg-[#c2382e] text-white"
                              : "text-[#71776f] hover:text-[#182019]"
                          }`}
                        >
                          <ArrowRight className="w-2.5 h-2.5" /> E→W
                        </button>
                      </div>
                      <span className="text-[9px] text-[#71776f] flex-1">
                        {spatialSelection.size === 0
                          ? "Check items to sort"
                          : `${spatialSelection.size} selected`}
                      </span>
                      {spatialSelection.size > 0 && (
                        <button
                          onClick={() => setSpatialSelection(new Set())}
                          className="text-[9px] font-semibold text-[#c2382e] hover:text-[#92400E] transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto -mx-1">
                  {spatialSortDir ? (
                    /* ── SPATIAL SORT MODE ── */
                    <>
                      {spatialSortedItems.length > 0 && (
                        <p className="px-2 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-[#c2382e]">
                          {spatialSortDir === "ns" ? "North → South" : "East → West"}
                        </p>
                      )}
                      {(() => {
                        const unselected = visibleFeaturesList.filter(r => !spatialSelection.has(r.name));
                        const rows: { name: string; detail: string; kind: string; divider?: boolean }[] = [
                          ...spatialSortedItems,
                          ...(spatialSortedItems.length > 0 && unselected.length > 0
                            ? [{ name: "__divider__", detail: "", kind: "divider", divider: true }]
                            : []),
                          ...unselected,
                        ];
                        return rows.map(r => {
                          if (r.divider) {
                            return <div key="__divider__" className="my-2 mx-2 border-t border-dashed border-[#c8c1b5]" />;
                          }
                          const rank = spatialRankMap.get(r.name);
                          const isChecked = spatialSelection.has(r.name);
                          return (
                            <label
                              key={r.name}
                              className={`w-full flex cursor-pointer items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left group ${
                                isChecked
                                  ? "bg-[#c2382e]/[0.06] border border-[#c2382e]/20"
                                  : "border border-transparent hover:bg-[#f8f4eb]"
                              }`}
                            >
                              <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                const s = new Set(spatialSelection);
                                if (s.has(r.name)) s.delete(r.name); else s.add(r.name);
                                setSpatialSelection(s);
                              }}
                                  className="peer appearance-none w-3.5 h-3.5 border-2 rounded-[3px] bg-white border-[#c2382e] checked:bg-[#c2382e] checked:border-[#c2382e] transition-all cursor-pointer"
                                />
                                <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                              </div>
                              {rank != null && (
                                <span className="w-5 h-5 rounded-full bg-[#c2382e] text-white text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                  {rank}
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs font-medium truncate block transition-colors ${
                                  isChecked ? "text-[#c2382e] font-semibold" : "text-[#182019] group-hover:text-[#c2382e]"
                                }`}>{r.name}</span>
                              </div>
                              <span className="text-[9px] text-[#71776f] tabular-nums shrink-0">{r.detail}</span>
                            </label>
                          );
                        });
                      })()}
                      {visibleFeaturesList.length === 0 && (
                        <div className="text-center py-6 text-xs text-[#71776f]">No items to sort.</div>
                      )}
                    </>
                  ) : (
                    /* ── NORMAL MODE ── */
                    <>
                  {/* Section header for Ranges */}
                  {(activeFilter === "Himalayas" || activeFilter === "Peninsular") && (
                    <div className="flex items-center justify-between mb-1">
                      <p className={`px-2 pt-1 pb-1 text-[9px] font-bold uppercase tracking-wider ${
                        activeFilter === "Peninsular" ? "text-[#166534]" : "text-[#92400E]"
                      }`}>Mountain Ranges</p>
                      {selectedRanges.size > 0 && (
                        <button
                          onClick={() => setSelectedRanges(new Set())}
                          className="flex items-center gap-1 text-[9px] font-semibold text-[#c2382e] hover:text-[#92400E] transition-colors mr-1"
                        >
                          <X className="w-2.5 h-2.5" /> Clear
                        </button>
                      )}
                    </div>
                  )}
                  {visibleFeaturesList
                    .filter(r => !(activeFilter === "Himalayas" || activeFilter === "Peninsular") || r.kind === "range")
                    .map(r => {
                      const isSpotlit = selectedRanges.has(r.name);
                      const isRange = r.kind === "range";
                      const isPeninsular = activeFilter === "Peninsular";
                      const hiddenSet = r.kind === "river" ? hiddenRivers : r.kind === "park" ? hiddenParks : hiddenPeaks;
                      return (
                    <label
                      key={r.name}
                      className={`w-full flex cursor-pointer items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all text-left group ${
                        isSpotlit
                          ? isPeninsular ? "bg-green-50 border border-green-200 shadow-sm" : "bg-amber-50 border border-amber-200 shadow-sm"
                          : isRange
                          ? isPeninsular ? "border border-transparent hover:bg-green-50 cursor-pointer" : "border border-transparent hover:bg-[#FFFBEB] cursor-pointer"
                          : "border border-transparent hover:bg-[#f8f4eb]"
                      }`}
                    >
                      {isRange ? (
                        <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSpotlit}
                            onChange={() => {
                              const newSet = new Set(selectedRanges);
                              if (newSet.has(r.name)) newSet.delete(r.name);
                              else newSet.add(r.name);
                              setSelectedRanges(newSet);
                            }}
                            className={`peer appearance-none w-4 h-4 border-2 rounded-[3px] bg-white transition-all cursor-pointer ${
                              isPeninsular
                                ? "border-[#166534] checked:bg-[#166534] checked:border-[#166534]"
                                : "border-[#92400E] checked:bg-[#92400E] checked:border-[#92400E]"
                            }`}
                          />
                          <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                      ) : (
                        <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={!hiddenSet.has(r.name)}
                            onChange={(e) => {
                              const newHidden = new Set(hiddenSet);
                              if (e.target.checked) newHidden.delete(r.name);
                              else newHidden.add(r.name);
                              if (r.kind === "river") setHiddenRivers(newHidden);
                              else if (r.kind === "park") setHiddenParks(newHidden);
                              else setHiddenPeaks(newHidden);
                            }}
                            className="peer appearance-none w-3.5 h-3.5 border border-[#b6aea2] rounded-sm bg-white checked:bg-[#92400E] checked:border-[#92400E] transition-all cursor-pointer"
                          />
                          <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium truncate block transition-colors ${
                          isSpotlit
                            ? isPeninsular ? "text-green-700 font-semibold" : "text-amber-700 font-semibold"
                            : isRange
                            ? isPeninsular ? "text-[#182019] group-hover:text-green-700" : "text-[#182019] group-hover:text-amber-700"
                            : "text-[#182019] group-hover:text-[#92400E]"
                        }`}>{r.name}</span>
                      </div>
                      <span className={`text-[9px] tabular-nums shrink-0 ${
                        isSpotlit
                          ? isPeninsular ? "text-green-600 font-medium" : "text-amber-600 font-medium"
                          : "text-[#71776f]"
                      }`}>{r.detail}</span>
                      {isRange && isSpotlit && <div className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${isPeninsular ? "bg-green-400" : "bg-amber-400"}`} />}
                    </label>
                  );})}
                  {/* Section header for Peaks */}
                  {(activeFilter === "Himalayas" || activeFilter === "Peninsular") && visibleFeaturesList.some(r => r.kind === "peak") && (
                    <p className={`px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-wider ${
                      activeFilter === "Peninsular" ? "text-[#166534]" : "text-[#1E40AF]"
                    }`}>Individual Peaks</p>
                  )}
                  {(activeFilter === "Himalayas" || activeFilter === "Peninsular") && visibleFeaturesList
                    .filter(r => r.kind === "peak")
                    .map(r => {
                      const isPeninsular = activeFilter === "Peninsular";
                      return (
                    <label key={r.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#f8f4eb] cursor-pointer transition-colors group">
                      <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                         <input
                           type="checkbox"
                           checked={!hiddenPeaks.has(r.name)}
                           onChange={(e) => {
                             const newHidden = new Set(hiddenPeaks);
                             if (e.target.checked) newHidden.delete(r.name);
                             else newHidden.add(r.name);
                             setHiddenPeaks(newHidden);
                           }}
                           className={`peer appearance-none w-3.5 h-3.5 border border-[#b6aea2] rounded-sm bg-white transition-all cursor-pointer ${
                             isPeninsular
                               ? "checked:bg-[#166534] checked:border-[#166534]"
                               : "checked:bg-[#1E40AF] checked:border-[#1E40AF]"
                           }`}
                         />
                         <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium transition-colors truncate block ${
                          isPeninsular ? "text-[#182019] group-hover:text-[#166534]" : "text-[#182019] group-hover:text-[#1E40AF]"
                        }`}>{r.name}</span>
                      </div>
                      <span className="text-[9px] text-[#71776f] tabular-nums shrink-0">{r.detail}</span>
                    </label>
                  );})}
                  {/* Empty state */}
                  {(activeFilter !== "Himalayas" && activeFilter !== "Peninsular") && visibleFeaturesList.length === 0 && (
                    <div className="text-center py-6 text-xs text-[#71776f]">
                      No items match these filters.
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>
            )}

            {mode === "quiz" && (
              <QuizPanel
                question={quizQuestion}
                score={quizScore}
                streak={quizStreak}
                total={quizTotal}
                feedback={quizFeedback}
                onAnswer={handleQuizAnswer}
                onNext={handleNextQuestion}
              />
            )}

            {mode === "review" && <ReviewPanel memory={memory} />}
          </div>
        </div>
      </div>

      {showPanel && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setShowPanel(false)} />
      )}

      {/* ── Mobile bottom tab bar — mode switcher ─────────────── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#c8c1b5] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 py-1.5">
          {[
            { key: "explore" as const, icon: <Eye className="w-5 h-5" />, label: "Explore" },
            { key: "quiz" as const, icon: <Crosshair className="w-5 h-5" />, label: "Quiz" },
            { key: "review" as const, icon: <Brain className="w-5 h-5" />, label: "Review" },
          ].map((tab) => {
            const active = mode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => changeMode(tab.key)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-all active:scale-95 ${
                  active ? "text-[#c2382e]" : "text-[#71776f]"
                }`}
              >
                <span className={active ? "" : ""}>{tab.icon}</span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {flashState === "incorrect" && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-red-500/15 animate-in fade-in duration-100" />
      )}
      {flashState === "correct" && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-green-500/15 animate-in fade-in duration-100" />
      )}
    </div>
  );
}
