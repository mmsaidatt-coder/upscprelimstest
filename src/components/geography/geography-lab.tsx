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
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
        active
          ? "bg-[#C4784A] text-white shadow-sm"
          : "text-[#6B7280] hover:text-[#1A1A1A]"
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
      onClick={onToggle}
      className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-all ${
        active
          ? "bg-[#C4784A]/10 text-[#C4784A]"
          : "text-[#9CA3AF] hover:text-[#6B7280] hover:bg-[#F3F4F6]"
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
    <div className="flex items-center gap-1.5 rounded-lg bg-[#FAF7F2] px-2.5 py-1.5 border border-[#E5E0DA]/50">
      <span className="text-[#C4784A]">{icon}</span>
      <div>
        <p className="text-xs font-bold text-[#1A1A1A] leading-none tabular-nums">{value}</p>
        <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider">{label}</p>
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C4784A]">
            {REGION_COLORS[state.region].label}
          </p>
          <h3 className="text-lg font-bold text-[#1A1A1A] mt-0.5 font-serif">{state.name}</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {state.type === "UT" ? "Union Territory" : "State"} · {state.area.toLocaleString()} km²
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F0EBE4] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-[#FAF7F2] px-2.5 py-2 border border-[#E5E0DA]/50">
        <MapPin className="w-3.5 h-3.5 text-[#C4784A] shrink-0" />
        <div>
          <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider">Capital</p>
          <p className="text-xs font-semibold text-[#1A1A1A]">{state.capital}</p>
        </div>
      </div>

      {state.majorRivers.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Droplets className="w-3 h-3 text-[#2563EB]" />
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Rivers</p>
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
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Mountains</p>
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
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">National Parks</p>
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
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Borders</p>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed">{state.neighbors.join(", ")}</p>
        </div>
      )}

      {state.keyFacts.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3 h-3 text-[#D97706]" />
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Key Facts</p>
          </div>
          <ul className="space-y-1.5">
            {state.keyFacts.map((fact, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-[#4B5563] leading-relaxed">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-[#C4784A] shrink-0" />
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

      <div className="rounded-xl bg-[#FAF7F2] border border-[#E5E0DA]/50 p-3">
        <p className="text-[9px] font-bold text-[#C4784A] uppercase tracking-wider mb-1">
          {question.type === "identify" ? "Find on Map" : question.type.charAt(0).toUpperCase() + question.type.slice(1)}
        </p>
        <p className="text-sm font-semibold text-[#1A1A1A] leading-snug">{question.prompt}</p>
        {question.type === "identify" && !feedback && (
          <p className="text-[11px] text-[#9CA3AF] mt-1.5 flex items-center gap-1">
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
              className="w-full text-left rounded-lg bg-white border border-[#E5E0DA]/50 px-3 py-2.5 text-xs font-medium text-[#4B5563] hover:bg-[#FAF7F2] hover:border-[#C4784A]/30 hover:text-[#1A1A1A] transition-all active:scale-[0.98]"
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-xl border p-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
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
          <p className="text-xs text-[#6B7280]">{feedback.message}</p>
          <button
            onClick={onNext}
            className="mt-2 flex items-center gap-1 rounded-lg bg-[#C4784A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#B06838] transition-colors"
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
        <h3 className="text-sm font-bold text-[#1A1A1A]">Memory Map</h3>
        <p className="text-[11px] text-[#6B7280]">Track your geographic mastery</p>
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
        <div className="rounded-lg bg-[#F3F4F6] p-2 text-center">
          <p className="text-lg font-bold text-[#9CA3AF] tabular-nums">{unstudied.length}</p>
          <p className="text-[9px] text-[#9CA3AF] font-semibold">New</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-[#FAF7F2] border border-[#E5E0DA]/50 px-2.5 py-2">
        {[
          { color: "rgba(16,185,129,0.5)", label: "Strong" },
          { color: "rgba(59,130,246,0.5)", label: "Moderate" },
          { color: "rgba(245,158,11,0.5)", label: "Fading" },
          { color: "rgba(239,68,68,0.5)", label: "Forgot" },
          { color: "rgba(100,100,100,0.3)", label: "New" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: item.color }} />
            <span className="text-[10px] text-[#6B7280]">{item.label}</span>
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
                <span className="text-xs text-[#4B5563]">{s.name}</span>
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
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#C4784A]">
            {isRiver ? "River" : isMountain ? (feature.type === "peak" ? "Peak" : "Pass") : "National Park"}
          </p>
          <h3 className="text-lg font-bold text-[#1A1A1A] mt-0.5 font-serif">{feature.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F0EBE4] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {isRiver && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FAF7F2] px-2.5 py-2 border border-[#E5E0DA]/50">
            <Droplets className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
            <div>
              <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider">Basin</p>
              <p className="text-xs font-semibold text-[#1A1A1A]">{feature.basin || "Unknown"}</p>
            </div>
          </div>
        )}
        {isMountain && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FAF7F2] px-2.5 py-2 border border-[#E5E0DA]/50">
            <Mountain className="w-3.5 h-3.5 text-[#92400E] shrink-0" />
            <div>
              <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider">Elevation</p>
              <p className="text-xs font-semibold text-[#1A1A1A]">{feature.elevation} m</p>
            </div>
          </div>
        )}
        {isPark && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FAF7F2] px-2.5 py-2 border border-[#E5E0DA]/50">
            <TreePine className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            <div>
              <p className="text-[9px] text-[#9CA3AF] uppercase tracking-wider">Location</p>
              <p className="text-xs font-semibold text-[#1A1A1A]">{feature.state}{feature.unesco ? " · UNESCO" : ""}</p>
            </div>
          </div>
        )}

        {feature.description && (
          <div className="text-xs text-[#4B5563] leading-relaxed border-t border-[#E5E0DA]/50 pt-2 mt-1">
            {feature.description}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Coordinate lookup for spatial sorting ────────────────────────────────────────

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
  const [memory, setMemory] = useState<Record<string, StateMemory>>({});

  // Layers & base map
  const [baseMap, setBaseMap] = useState<BaseMapStyle>("physical");
  const [layers, setLayers] = useState<LayerVisibility>({
    stateBorders: true,
    rivers: true,
    mountains: false,
    ranges: false,
    parks: false,
    stateLabels: false,
  });
  const [activeFilter, setActiveFilter] = useState<string>("Rivers");
  const [riverLevel, setRiverLevel] = useState<number>(5);
  const [riverBasin, setRiverBasin] = useState<string>("All");
  const [showRiverConfig, setShowRiverConfig] = useState<boolean>(true);
  
  // River specific interactive states
  const [riversData, setRiversData] = useState<any[]>([]);
  const [hiddenRivers, setHiddenRivers] = useState<Set<string>>(new Set());
  const [hiddenPeaks, setHiddenPeaks] = useState<Set<string>>(new Set());
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
  const [showRiverFilterSheet, setShowRiverFilterSheet] = useState(false);

  // Load memory
  useEffect(() => {
    setMemory(loadMemory());
  }, []);

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
           if (p.name && !uniqueRivers.has(p.name)) {
             uniqueRivers.set(p.name, p);
           }
         });
         setRiversData(Array.from(uniqueRivers.values()));
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

  const displayFeaturesList = useMemo(() => {
    if (activeFilter === "Rivers") {
      return filteredRivers.map(r => ({ name: r.name, detail: `L${r.level}`, kind: "river" as const }));
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

  // Spatial sort: compute sorted selected items and their coordinates for the map line
  const spatialSortedItems = useMemo(() => {
    if (!spatialSortDir || spatialSelection.size === 0) return [];
    const selected = displayFeaturesList
      .filter(item => spatialSelection.has(item.name))
      .map(item => {
        const coords = getFeatureCoords(item.name, item.kind);
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

  // Mode changes
  useEffect(() => {
    if (mode === "quiz") {
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
    if (mode === "explore") {
      setQuizDeck(null);
      setQuizQuestion(null);
      setQuizFeedback(null);
      setCorrectState(null);
      setIncorrectState(null);
      setSelectedFeature(null);
    }
  }, [mode]);

  const startQuizForDeck = useCallback((deck: "states" | "rivers" | "mountains" | "parks") => {
    setQuizDeck(deck);
    setQuizScore(0);
    setQuizStreak(0);
    setQuizTotal(0);
    setQuizFeedback(null);
    if (deck === "states") {
      setQuizQuestion(generateQuizQuestion());
    } else {
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
    setSelectedRanges(new Set());
    setSpatialSortDir(null);
    setSpatialSelection(new Set());
    setIntersectMode(false);
    setIntersectResults(null);
    setLayers({
      stateBorders: true,
      rivers: filter === "Rivers" || filter === "All",
      mountains: filter === "Himalayas" || filter === "Peninsular" || filter === "Passes" || filter === "All",
      ranges: filter === "Himalayas" || filter === "Peninsular" || filter === "All",
      parks: filter === "Protected Areas" || filter === "All",
      stateLabels: filter === "Passes",
    });
  }, []);

  const selectedStateData = selectedState ? STATE_BY_NAME[selectedState] : null;

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF7F2] relative">
      {/* ── Top bar — compact glass strip ─────────────────────── */}
      <div className="absolute top-2 sm:top-3 left-2 right-2 sm:left-3 sm:right-3 z-40 flex items-center justify-between gap-2">
        {/* Left: back + title (compact on mobile) */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-white/85 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.04] border border-white/60 px-1.5 sm:px-2.5 py-1.5 sm:py-2 min-w-0">
          <Link
            href="/app"
            className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F0EBE4] transition-colors shrink-0"
            title="Back to dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-6 h-6 rounded-md bg-[#C4784A]/10 flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5 text-[#C4784A]" />
          </div>
          <span className="text-sm font-bold text-[#1A1A1A] hidden md:block">Geography Lab</span>
        </div>

        {/* Center: mode switcher (desktop only — on mobile, it's in the bottom tab bar) */}
        <div className="hidden sm:flex items-center bg-white/85 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.04] border border-white/60 p-1">
          <ModePill active={mode === "explore"} icon={<Eye className="w-3.5 h-3.5" />} label="Explore" onClick={() => setMode("explore")} />
          <ModePill active={mode === "quiz"} icon={<Crosshair className="w-3.5 h-3.5" />} label="Quiz" onClick={() => setMode("quiz")} />
          <ModePill active={mode === "review"} icon={<Brain className="w-3.5 h-3.5" />} label="Review" onClick={() => setMode("review")} />
        </div>

        {/* Right: action icons (layers, intersect, filters, info) */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-white/85 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.04] border border-white/60 px-1 sm:px-1.5 py-1 sm:py-1.5">
          {/* River filter shortcut on mobile */}
          {activeFilter === "Rivers" && (
            <button
              onClick={() => setShowRiverFilterSheet(true)}
              className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center text-[#C4784A] hover:bg-[#C4784A]/10 transition-colors"
              title="River filters"
            >
              <Droplets className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowLayers(!showLayers)}
            className={`w-9 h-9 sm:w-auto sm:h-auto rounded-lg sm:p-1.5 flex items-center justify-center transition-colors ${
              showLayers ? "bg-[#C4784A]/10 text-[#C4784A]" : "text-[#9CA3AF] hover:text-[#1A1A1A]"
            }`}
            title="Toggle layers"
          >
            <Layers className="w-4 h-4" />
          </button>
          {/* Intersect toggle — only visible in explore mode with a feature filter */}
          {mode === "explore" && ["Rivers", "Protected Areas"].includes(activeFilter) && (
            <button
              onClick={() => {
                setIntersectMode((prev) => {
                  if (prev) setIntersectResults(null);
                  return !prev;
                });
              }}
              className={`w-9 h-9 sm:w-auto sm:h-auto rounded-lg sm:p-1.5 flex items-center justify-center transition-colors ${
                intersectMode
                  ? "bg-amber-100 text-amber-600 ring-1 ring-amber-300"
                  : "text-[#9CA3AF] hover:text-[#1A1A1A]"
              }`}
              title="Intersect mode — click a river or park to see what it crosses"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}
          {(mode !== "explore" || selectedState || selectedFeature) && (
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="lg:hidden w-9 h-9 sm:w-auto sm:h-auto rounded-lg sm:p-1.5 flex items-center justify-center text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Taxonomy Filters — pill strip ── */}
      <div className="absolute top-[3.25rem] sm:top-16 left-0 right-0 sm:left-3 sm:right-auto z-30 pointer-events-none">
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl sm:rounded-xl shadow-lg shadow-black/[0.04] border-y sm:border border-white/60 p-1 overflow-x-auto scrollbar-hide pointer-events-auto mx-2 sm:mx-0 rounded-xl">
          {[
            { key: "All", label: "All", icon: <Globe className="w-3 h-3" /> },
            { key: "Rivers", label: "Rivers", icon: <Droplets className="w-3 h-3" /> },
            { key: "Himalayas", label: "Himalayas", icon: <Mountain className="w-3 h-3" /> },
            { key: "Peninsular", label: "Peninsular", icon: <Mountain className="w-3 h-3" /> },
            { key: "Passes", label: "Passes", icon: <MapIcon className="w-3 h-3" /> },
            { key: "Protected Areas", label: "Parks", icon: <TreePine className="w-3 h-3" /> },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setTaxonomyFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                activeFilter === f.key
                  ? "bg-[#C4784A] text-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white/60"
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Rivers filter — inline on desktop, bottom sheet on mobile ── */}
      {activeFilter === "Rivers" && (
        <div className="hidden sm:block absolute top-[6.5rem] left-3 z-30 pointer-events-auto">
          {showRiverConfig ? (
            <div className="flex items-center gap-3 bg-white/85 backdrop-blur-xl p-2.5 pr-3 rounded-xl border border-white/60 shadow-lg shadow-black/[0.04] animate-in slide-in-from-top-2 fade-in duration-200">
              <div className="flex items-center gap-2 min-w-[10rem]">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider shrink-0">Lvl</label>
                <input
                  type="range" min="1" max="5"
                  value={riverLevel} onChange={(e) => setRiverLevel(Number(e.target.value))}
                  className="w-24 accent-[#C4784A]"
                />
                <span className="text-xs font-bold text-[#C4784A] tabular-nums w-4">{riverLevel}</span>
              </div>
              <div className="w-px h-5 bg-[#E5E0DA]" />
              <select
                value={riverBasin}
                onChange={(e) => setRiverBasin(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-[#1A1A1A] focus:outline-none cursor-pointer pr-4"
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
              <button onClick={() => setShowRiverConfig(false)} className="text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRiverConfig(true)}
              className="flex items-center gap-1.5 bg-white/85 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/60 shadow-lg shadow-black/[0.04] text-xs font-semibold text-[#1A1A1A] hover:bg-white/95 transition-colors"
            >
              <Droplets className="w-3.5 h-3.5 text-[#C4784A]" />
              Filters
              <ChevronDown className="w-3 h-3 text-[#9CA3AF]" />
            </button>
          )}
        </div>
      )}

      {/* ── Mobile river filter bottom sheet ── */}
      {activeFilter === "Rivers" && showRiverFilterSheet && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-40 bg-black/20 animate-in fade-in duration-200"
            onClick={() => setShowRiverFilterSheet(false)}
          />
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-4 duration-200 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="w-10 h-1 bg-[#D1D5DB] rounded-full mx-auto mt-3 mb-2" />
            <div className="px-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#C4784A]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">River Filters</h3>
              </div>
              <button
                onClick={() => setShowRiverFilterSheet(false)}
                className="rounded-md p-1.5 text-[#9CA3AF] hover:text-[#1A1A1A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">Detail Level</label>
                  <span className="text-xs font-bold text-[#C4784A] tabular-nums">Level {riverLevel}</span>
                </div>
                <input
                  type="range" min="1" max="5"
                  value={riverLevel}
                  onChange={(e) => setRiverLevel(Number(e.target.value))}
                  className="w-full accent-[#C4784A] h-2"
                />
                <div className="flex justify-between text-[10px] text-[#9CA3AF] mt-1 px-0.5">
                  <span>Major</span>
                  <span>All</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider block mb-2">Basin</label>
                <select
                  value={riverBasin}
                  onChange={(e) => setRiverBasin(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E5E0DA] rounded-lg px-3 py-2.5 text-sm font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#C4784A]"
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
                onClick={() => setShowRiverFilterSheet(false)}
                className="w-full rounded-xl bg-[#C4784A] text-white text-sm font-semibold py-3 hover:bg-[#B06838] active:scale-[0.98] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Layer controls — compact floating card ──────────────── */}
      {showLayers && (
        <div className="absolute bottom-[5rem] sm:bottom-4 left-3 right-3 sm:right-auto z-40 bg-white/95 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.06] border border-white/60 p-2.5 animate-in slide-in-from-bottom-4 fade-in duration-200 sm:w-[max-content] sm:max-w-[calc(100vw-1.5rem)]">
          {/* Base map toggle */}
          <div className="flex items-center gap-1 rounded-lg bg-[#F3F4F6] p-0.5 mb-2">
            <button
              onClick={() => setBaseMap("physical")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                baseMap === "physical" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#9CA3AF]"
              }`}
            >
              <Globe className="w-3 h-3" /> Terrain
            </button>
            <button
              onClick={() => setBaseMap("satellite")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                baseMap === "satellite" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#9CA3AF]"
              }`}
            >
              <Satellite className="w-3 h-3" /> Satellite
            </button>
            <button
              onClick={() => setBaseMap("clean")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                baseMap === "clean" ? "bg-white text-[#1A1A1A] shadow-sm" : "text-[#9CA3AF]"
              }`}
            >
              <Palette className="w-3 h-3" /> Political
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
          <div className="mt-2 pt-2 border-t border-[#E5E0DA]/60">
            <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Reference Tools</p>
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
                  Tropic of Cancer — 23.5°N
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-[#065F46]">
                  <span className="inline-block w-5 border-t-2 border-dashed border-[#059669]" />
                  Indian Standard Meridian — 82.5°E
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
            <div className="absolute inset-0 z-50 bg-gradient-to-b from-black/70 via-black/50 to-black/70 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md animate-in zoom-in-95 fade-in duration-300">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#C4784A]/20 flex items-center justify-center mx-auto mb-3">
                    <Crosshair className="w-6 h-6 text-[#C4784A]" />
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-white mb-1">Choose Your Quiz</h2>
                  <p className="text-sm text-white/50">Test your geography knowledge</p>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "states", title: "States & Capitals", icon: <MapPin className="w-5 h-5" />, desc: "28 States and 8 Union Territories", accent: "text-blue-400" },
                    { id: "rivers", title: "River Networks", icon: <Droplets className="w-5 h-5" />, desc: "Himalayan & Peninsular drainage basins", accent: "text-cyan-400" },
                    { id: "mountains", title: "Peaks & Passes", icon: <Mountain className="w-5 h-5" />, desc: "Mountain peaks and strategic passes", accent: "text-amber-400" },
                    { id: "parks", title: "Protected Areas", icon: <TreePine className="w-5 h-5" />, desc: "National Parks and Biosphere Reserves", accent: "text-emerald-400" },
                  ].map((deck) => (
                    <button
                      key={deck.id}
                      onClick={() => startQuizForDeck(deck.id as any)}
                      className="group w-full flex items-center gap-4 rounded-xl bg-white/10 border border-white/10 px-4 py-3.5 text-left transition-all hover:bg-white/20 hover:border-white/20 active:scale-[0.98]"
                    >
                      <div className={`${deck.accent} shrink-0`}>{deck.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-white">{deck.title}</h3>
                        <p className="text-xs text-white/40 mt-0.5 truncate">{deck.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setMode("explore")}
                  className="w-full mt-4 text-center text-xs text-white/30 hover:text-white/50 transition-colors py-2"
                >
                  Back to Explore
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
            activeFilter={activeFilter}
            riverLevel={riverLevel}
            riverBasin={riverBasin}
            hiddenRivers={Array.from(hiddenRivers)}
            hiddenPeaks={Array.from(hiddenPeaks)}
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
              <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Legend</p>
              {[
                { color: "#16A34A", label: "National Park" },
                { color: "#F59E0B", label: "Tiger Reserve" },
                { color: "#8B5CF6", label: "Biosphere Reserve" },
                { color: "#06B6D4", label: "Wildlife Sanctuary" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white" style={{ background: item.color }} />
                  <span className="text-[11px] text-[#4B5563]">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {(activeFilter === "Himalayas" || activeFilter === "Passes") && (
            <div className="absolute bottom-[5.5rem] sm:bottom-14 left-3 sm:left-auto sm:right-3 z-20 bg-white/90 backdrop-blur-xl rounded-lg shadow-lg shadow-black/[0.04] border border-white/60 px-3 py-2 space-y-1.5 animate-in fade-in duration-200">
              <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider">Legend</p>
              {[
                { color: "#D97706", label: "Mountain Peak" },
                { color: "#3B82F6", label: "Mountain Pass" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white" style={{ background: item.color }} />
                  <span className="text-[11px] text-[#4B5563]">{item.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Side panel / Bottom sheet ── */}
        <div
          className={`
            shrink-0 overflow-y-auto bg-white/95 backdrop-blur-xl
            ${
              showPanel
                ? "fixed bottom-0 left-0 right-0 z-50 h-[60dvh] rounded-t-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.08)] lg:h-auto lg:rounded-none lg:shadow-none lg:relative lg:inset-auto lg:w-80 lg:border-l lg:border-[#E5E0DA]/50 animate-in slide-in-from-bottom-8 lg:slide-in-from-right duration-200"
                : "hidden lg:block lg:w-80 lg:border-l lg:border-[#E5E0DA]/50 lg:relative"
            }
          `}
        >
          {showPanel && (
            <div className="lg:hidden w-10 h-1 bg-[#D1D5DB] rounded-full mx-auto mt-3 mb-1" />
          )}
          <div className="p-4 lg:p-5 lg:pt-16 space-y-5 pb-16">
            {showPanel && (
              <button
                onClick={() => setShowPanel(false)}
                className="lg:hidden absolute top-4 right-4 rounded-lg p-1.5 text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F0EBE4] transition-colors z-10"
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
                      <p className="text-xs font-bold text-[#1A1A1A]">Lat / Lng Lock</p>
                      <p className="text-[10px] text-[#6B7280] font-mono">
                        {lockPoint[1].toFixed(2)}°N, {lockPoint[0].toFixed(2)}°E
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setLockPoint(null); setLockMode(false); }}
                    className="rounded-md p-1 text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F0EBE4] transition-colors"
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
                    <p className="text-[11px] text-[#9CA3AF] italic px-1">No major features at this latitude</p>
                  ) : (
                    <div className="space-y-1">
                      {alignedFeatures.sameLat.slice(0, 12).map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-[#F9F5FF] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] shrink-0">
                              {f.featureType === "city" ? "🏙️" : f.featureType === "park" ? "🌿" : f.featureType === "pass" ? "🏔️" : "⛰️"}
                            </span>
                            <span className="text-[11px] font-medium text-[#1A1A1A] truncate">{f.name}</span>
                          </div>
                          <span className="text-[9px] text-[#9CA3AF] font-mono shrink-0 ml-1">
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
                    <p className="text-[11px] text-[#9CA3AF] italic px-1">No major features at this longitude</p>
                  ) : (
                    <div className="space-y-1">
                      {alignedFeatures.sameLng.slice(0, 12).map((f, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1 hover:bg-[#F5F3FF] transition-colors">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] shrink-0">
                              {f.featureType === "city" ? "🏙️" : f.featureType === "park" ? "🌿" : f.featureType === "pass" ? "🏔️" : "⛰️"}
                            </span>
                            <span className="text-[11px] font-medium text-[#1A1A1A] truncate">{f.name}</span>
                          </div>
                          <span className="text-[9px] text-[#9CA3AF] font-mono shrink-0 ml-1">
                            {f.coords[0].toFixed(1)}°E
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setLockMode(true)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E0DA] px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] hover:bg-[#FAF7F2] hover:text-[#1A1A1A] transition-colors"
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
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-5 h-5 text-[#D1D5DB]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Select a state</h3>
                <p className="text-xs text-[#9CA3AF]">Click on the map to explore details</p>
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
                      <h3 className="text-base font-bold text-[#1A1A1A] font-serif leading-tight">{intersectResults.focusName}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIntersectResults(null); setIntersectMode(false); }}
                    className="rounded-md p-1 text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F0EBE4] transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200/60 px-2.5 py-2">
                  {intersectResults.focusType === "river"
                    ? <Droplets className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    : <TreePine className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  <p className="text-xs text-[#4B5563]">
                    {intersectResults.focusType === "river"
                      ? "Parks & ranges this river passes through"
                      : "Rivers that flow near this park"}
                  </p>
                </div>

                {intersectResults.focusType === "river" && (
                  <>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                        Protected Areas <span className="text-amber-600">({intersectResults.parks.length})</span>
                      </p>
                      {intersectResults.parks.length === 0 ? (
                        <p className="text-xs text-[#9CA3AF] italic px-1">None detected along this river</p>
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
                              <div key={park.name} className="flex items-center gap-2 rounded-lg bg-[#FAFAF9] border border-[#E5E0DA]/60 px-2.5 py-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[#1A1A1A] truncate">{park.name}</p>
                                  <p className="text-[10px] text-[#9CA3AF]">{park.state}</p>
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
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                        Mountain Ranges <span className="text-amber-600">({intersectResults.ranges.length})</span>
                      </p>
                      {intersectResults.ranges.length === 0 ? (
                        <p className="text-xs text-[#9CA3AF] italic px-1">No ranges intersect this river</p>
                      ) : (
                        <div className="space-y-1">
                          {intersectResults.ranges.map((range) => (
                            <div key={range.name} className="flex items-center gap-2 rounded-lg bg-[#FAFAF9] border border-[#E5E0DA]/60 px-2.5 py-2">
                              <Mountain className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <p className="text-xs font-semibold text-[#1A1A1A]">{range.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {intersectResults.focusType === "park" && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-1.5">
                      Nearby Rivers <span className="text-amber-600">({intersectResults.rivers.length})</span>
                    </p>
                    {intersectResults.rivers.length === 0 ? (
                      <p className="text-xs text-[#9CA3AF] italic px-1">No rivers detected near this park</p>
                    ) : (
                      <div className="space-y-1">
                        {intersectResults.rivers.map((river) => (
                          <div key={river} className="flex items-center gap-2 rounded-lg bg-[#FAFAF9] border border-[#E5E0DA]/60 px-2.5 py-2">
                            <Droplets className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <p className="text-xs font-semibold text-[#1A1A1A]">{river}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[10px] text-[#9CA3AF] text-center pt-1">Click another feature to update</p>
              </div>
            )}

            {/* ── Intersect prompt (mode on, no result yet) ── */}
            {mode === "explore" && intersectMode && !intersectResults && !selectedStateData && !selectedFeature && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A] mb-1">Intersect Mode Active</h3>
                  <p className="text-xs text-[#9CA3AF] leading-relaxed max-w-[220px]">
                    Click any <span className="font-semibold text-blue-600">river</span> or{" "}
                    <span className="font-semibold text-emerald-600">park</span> on the map to see
                    what it geographically crosses.
                  </p>
                </div>
                <button
                  onClick={() => setIntersectMode(false)}
                  className="text-xs text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors underline underline-offset-2"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* ── Normal feature list ── */}
            {mode === "explore" && !intersectMode && !selectedStateData && !selectedFeature && ["Rivers", "Himalayas", "Peninsular", "Passes", "Protected Areas"].includes(activeFilter) && (
              <div className="flex flex-col h-[calc(100dvh-8rem)]">
                <div className="shrink-0 mb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1A1A]">{activeFilter === "Peninsular" ? "Peninsular Mountains" : activeFilter}</h3>
                      <p className="text-[10px] text-[#9CA3AF] mt-0.5">{displayFeaturesList.length} items</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(hiddenRivers.size > 0 || hiddenPeaks.size > 0) && (
                        <button onClick={() => { setHiddenRivers(new Set()); setHiddenPeaks(new Set()); }} className="text-[10px] text-[#C4784A] hover:underline font-semibold">
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
                            ? "bg-[#C4784A] text-white shadow-sm"
                            : "text-[#C4784A] bg-[#C4784A]/10 hover:bg-[#C4784A]/20 border border-[#C4784A]/30"
                        }`}
                        title="Spatial Sort — select items and sort by position"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span>Sort</span>
                      </button>
                    </div>
                  </div>

                  {/* Spatial sort direction bar */}
                  {spatialSortDir && (
                    <div className="flex items-center gap-1.5 bg-[#FAF7F2] rounded-lg border border-[#E5E0DA]/80 p-1 animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex items-center rounded-md bg-white shadow-sm border border-[#E5E0DA]/50 p-0.5">
                        <button
                          onClick={() => setSpatialSortDir("ns")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            spatialSortDir === "ns"
                              ? "bg-[#C4784A] text-white"
                              : "text-[#9CA3AF] hover:text-[#1A1A1A]"
                          }`}
                        >
                          <ArrowDown className="w-2.5 h-2.5" /> N→S
                        </button>
                        <button
                          onClick={() => setSpatialSortDir("ew")}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                            spatialSortDir === "ew"
                              ? "bg-[#C4784A] text-white"
                              : "text-[#9CA3AF] hover:text-[#1A1A1A]"
                          }`}
                        >
                          <ArrowRight className="w-2.5 h-2.5" /> E→W
                        </button>
                      </div>
                      <span className="text-[9px] text-[#9CA3AF] flex-1">
                        {spatialSelection.size === 0
                          ? "Check items to sort"
                          : `${spatialSelection.size} selected`}
                      </span>
                      {spatialSelection.size > 0 && (
                        <button
                          onClick={() => setSpatialSelection(new Set())}
                          className="text-[9px] font-semibold text-[#C4784A] hover:text-[#92400E] transition-colors"
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
                        <p className="px-2 pt-1 pb-1.5 text-[9px] font-bold uppercase tracking-wider text-[#C4784A]">
                          {spatialSortDir === "ns" ? "North → South" : "East → West"}
                        </p>
                      )}
                      {(() => {
                        const unselected = displayFeaturesList.filter(r => !spatialSelection.has(r.name));
                        const rows: { name: string; detail: string; kind: string; divider?: boolean }[] = [
                          ...spatialSortedItems,
                          ...(spatialSortedItems.length > 0 && unselected.length > 0
                            ? [{ name: "__divider__", detail: "", kind: "divider", divider: true }]
                            : []),
                          ...unselected,
                        ];
                        return rows.map(r => {
                          if (r.divider) {
                            return <div key="__divider__" className="my-2 mx-2 border-t border-dashed border-[#E5E0DA]" />;
                          }
                          const rank = spatialRankMap.get(r.name);
                          const isChecked = spatialSelection.has(r.name);
                          return (
                            <button
                              key={r.name}
                              onClick={() => {
                                const s = new Set(spatialSelection);
                                if (s.has(r.name)) s.delete(r.name); else s.add(r.name);
                                setSpatialSelection(s);
                              }}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all text-left group ${
                                isChecked
                                  ? "bg-[#C4784A]/[0.06] border border-[#C4784A]/20"
                                  : "border border-transparent hover:bg-[#FAF7F2]"
                              }`}
                            >
                              <div className="relative flex items-center justify-center w-3.5 h-3.5 shrink-0">
                                <input type="checkbox" checked={isChecked} readOnly
                                  className="peer appearance-none w-3.5 h-3.5 border-2 rounded-[3px] bg-white border-[#C4784A] checked:bg-[#C4784A] checked:border-[#C4784A] transition-all cursor-pointer"
                                />
                                <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                              </div>
                              {rank != null && (
                                <span className="w-5 h-5 rounded-full bg-[#C4784A] text-white text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                  {rank}
                                </span>
                              )}
                              <div className="flex-1 min-w-0">
                                <span className={`text-xs font-medium truncate block transition-colors ${
                                  isChecked ? "text-[#C4784A] font-semibold" : "text-[#1A1A1A] group-hover:text-[#C4784A]"
                                }`}>{r.name}</span>
                              </div>
                              <span className="text-[9px] text-[#9CA3AF] tabular-nums shrink-0">{r.detail}</span>
                            </button>
                          );
                        });
                      })()}
                      {displayFeaturesList.length === 0 && (
                        <div className="text-center py-6 text-xs text-[#9CA3AF]">No items to sort.</div>
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
                          className="flex items-center gap-1 text-[9px] font-semibold text-[#C4784A] hover:text-[#92400E] transition-colors mr-1"
                        >
                          <X className="w-2.5 h-2.5" /> Clear
                        </button>
                      )}
                    </div>
                  )}
                  {displayFeaturesList
                    .filter(r => !(activeFilter === "Himalayas" || activeFilter === "Peninsular") || r.kind === "range")
                    .map(r => {
                      const isSpotlit = selectedRanges.has(r.name);
                      const isRange = r.kind === "range";
                      const isPeninsular = activeFilter === "Peninsular";
                      return (
                    <button
                      key={r.name}
                      onClick={() => {
                        if (isRange) {
                          const newSet = new Set(selectedRanges);
                          if (newSet.has(r.name)) newSet.delete(r.name);
                          else newSet.add(r.name);
                          setSelectedRanges(newSet);
                        }
                      }}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg transition-all text-left group ${
                        isSpotlit
                          ? isPeninsular ? "bg-green-50 border border-green-200 shadow-sm" : "bg-amber-50 border border-amber-200 shadow-sm"
                          : isRange
                          ? isPeninsular ? "border border-transparent hover:bg-green-50 cursor-pointer" : "border border-transparent hover:bg-[#FFFBEB] cursor-pointer"
                          : "border border-transparent hover:bg-[#FAF7F2]"
                      }`}
                    >
                      {isRange ? (
                        <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSpotlit}
                            readOnly
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
                            checked={!hiddenRivers.has(r.name)}
                            onChange={(e) => {
                              const newHidden = new Set(hiddenRivers);
                              if (e.target.checked) newHidden.delete(r.name);
                              else newHidden.add(r.name);
                              setHiddenRivers(newHidden);
                            }}
                            className="peer appearance-none w-3.5 h-3.5 border border-[#D1D5DB] rounded-sm bg-white checked:bg-[#92400E] checked:border-[#92400E] transition-all cursor-pointer"
                          />
                          <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium truncate block transition-colors ${
                          isSpotlit
                            ? isPeninsular ? "text-green-700 font-semibold" : "text-amber-700 font-semibold"
                            : isRange
                            ? isPeninsular ? "text-[#1A1A1A] group-hover:text-green-700" : "text-[#1A1A1A] group-hover:text-amber-700"
                            : "text-[#1A1A1A] group-hover:text-[#92400E]"
                        }`}>{r.name}</span>
                      </div>
                      <span className={`text-[9px] tabular-nums shrink-0 ${
                        isSpotlit
                          ? isPeninsular ? "text-green-600 font-medium" : "text-amber-600 font-medium"
                          : "text-[#9CA3AF]"
                      }`}>{r.detail}</span>
                      {isRange && isSpotlit && <div className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${isPeninsular ? "bg-green-400" : "bg-amber-400"}`} />}
                    </button>
                  );})}
                  {/* Section header for Peaks */}
                  {(activeFilter === "Himalayas" || activeFilter === "Peninsular") && displayFeaturesList.some(r => r.kind === "peak") && (
                    <p className={`px-2 pt-3 pb-1 text-[9px] font-bold uppercase tracking-wider ${
                      activeFilter === "Peninsular" ? "text-[#166534]" : "text-[#1E40AF]"
                    }`}>Individual Peaks</p>
                  )}
                  {(activeFilter === "Himalayas" || activeFilter === "Peninsular") && displayFeaturesList
                    .filter(r => r.kind === "peak")
                    .map(r => {
                      const isPeninsular = activeFilter === "Peninsular";
                      return (
                    <label key={r.name} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#FAF7F2] cursor-pointer transition-colors group">
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
                           className={`peer appearance-none w-3.5 h-3.5 border border-[#D1D5DB] rounded-sm bg-white transition-all cursor-pointer ${
                             isPeninsular
                               ? "checked:bg-[#166534] checked:border-[#166534]"
                               : "checked:bg-[#1E40AF] checked:border-[#1E40AF]"
                           }`}
                         />
                         <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-medium transition-colors truncate block ${
                          isPeninsular ? "text-[#1A1A1A] group-hover:text-[#166534]" : "text-[#1A1A1A] group-hover:text-[#1E40AF]"
                        }`}>{r.name}</span>
                      </div>
                      <span className="text-[9px] text-[#9CA3AF] tabular-nums shrink-0">{r.detail}</span>
                    </label>
                  );})}
                  {/* Empty state */}
                  {(activeFilter !== "Himalayas" && activeFilter !== "Peninsular") && displayFeaturesList.length === 0 && (
                    <div className="text-center py-6 text-xs text-[#9CA3AF]">
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#E5E0DA] pb-[env(safe-area-inset-bottom)]">
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
                onClick={() => setMode(tab.key)}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-all active:scale-95 ${
                  active ? "text-[#C4784A]" : "text-[#9CA3AF]"
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
