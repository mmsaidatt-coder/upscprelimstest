"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";
import { IndiaMap, type MapMode, type LayerVisibility, type BaseMapStyle } from "@/components/geography/india-map";
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
import { generateFeatureQuizQuestion, MOUNTAINS, MOUNTAIN_RANGES, NATIONAL_PARKS } from "@/data/india-geo-features";

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
      // Only genuinely Himalayan / North-Eastern ranges — exclude Peninsular/Deccan ranges
      const HIMALAYAN_RANGE_NAMES = new Set([
        "Greater Himalayas", "Shivalik Hills", "Karakoram",
        "Pir Panjal", "Ladakh Range", "Zaskar Range", "Patkai Range",
        "Garo Hills", "Khasi Hills", "Jaintia Hills",
      ]);
      const ranges = MOUNTAIN_RANGES.features
        .filter((m: any) => HIMALAYAN_RANGE_NAMES.has(m.properties.name))
        .map((m: any) => ({
          name: m.properties.name,
          detail: "Range",
          kind: "range" as const,
        }));
      const peaks = MOUNTAINS.features
        .filter((m: any) => m.properties.type === "peak")
        .sort((a: any, b: any) => (b.properties.elevation ?? 0) - (a.properties.elevation ?? 0))
        .map((m: any) => ({
          name: m.properties.name,
          detail: `${m.properties.elevation}m`,
          kind: "peak" as const,
        }));
      return [...ranges, ...peaks];
    }
    if (activeFilter === "Passes") {
      return MOUNTAINS.features
        .filter((m: any) => m.properties.type === "pass")
        .sort((a: any, b: any) => (b.properties.elevation ?? 0) - (a.properties.elevation ?? 0))
        .map((m: any) => ({ name: m.properties.name, detail: `${m.properties.elevation}m`, kind: "pass" as const }));
    }
    if (activeFilter === "Protected Areas") {
      return NATIONAL_PARKS.features.map((m: any) => ({ name: m.properties.name, detail: m.properties.category, kind: "park" as const }));
    }
    return [];
  }, [activeFilter, filteredRivers]);

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
  }, [mode, quizQuestion, quizFeedback]);

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

  const setTaxonomyFilter = useCallback((filter: string) => {
    setActiveFilter(filter);
    setSelectedRanges(new Set()); // clear spotlight when switching filter
    setLayers({
      stateBorders: true,
      rivers: filter === "Rivers" || filter === "All",
      mountains: filter === "Himalayas" || filter === "Passes" || filter === "All",
      ranges: filter === "Himalayas" || filter === "All",
      parks: filter === "Protected Areas" || filter === "All",
      stateLabels: filter === "Passes",
    });
  }, []);

  const selectedStateData = selectedState ? STATE_BY_NAME[selectedState] : null;

  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-[#FAF7F2] relative">
      {/* ── Top bar — compact glass strip ─────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between gap-2">
        {/* Left: back + title */}
        <div className="flex items-center gap-1.5 bg-white/85 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.04] border border-white/60 px-2.5 py-2">
          <Link
            href="/app"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#1A1A1A] hover:bg-[#F0EBE4] transition-colors"
            title="Back to dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="w-6 h-6 rounded-md bg-[#C4784A]/10 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-[#C4784A]" />
          </div>
          <span className="text-sm font-bold text-[#1A1A1A] hidden sm:block">Geography Lab</span>
        </div>

        {/* Center: mode switcher (segmented control) */}
        <div className="flex items-center bg-white/85 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.04] border border-white/60 p-1">
          <ModePill active={mode === "explore"} icon={<Eye className="w-3.5 h-3.5" />} label="Explore" onClick={() => setMode("explore")} />
          <ModePill active={mode === "quiz"} icon={<Crosshair className="w-3.5 h-3.5" />} label="Quiz" onClick={() => setMode("quiz")} />
          <ModePill active={mode === "review"} icon={<Brain className="w-3.5 h-3.5" />} label="Review" onClick={() => setMode("review")} />
        </div>

        {/* Right: layer toggle + panel toggle */}
        <div className="flex items-center gap-1 bg-white/85 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.04] border border-white/60 px-1.5 py-1.5">
          <button
            onClick={() => setShowLayers(!showLayers)}
            className={`rounded-lg p-1.5 transition-colors ${
              showLayers ? "bg-[#C4784A]/10 text-[#C4784A]" : "text-[#9CA3AF] hover:text-[#1A1A1A]"
            }`}
            title="Toggle layers"
          >
            <Layers className="w-4 h-4" />
          </button>
          {(mode !== "explore" || selectedState) && (
            <button
              onClick={() => setShowPanel(!showPanel)}
              className="lg:hidden rounded-lg p-1.5 text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Taxonomy Filters — pill strip ── */}
      <div className="absolute top-16 left-3 z-30 flex items-center gap-1 bg-white/80 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.04] border border-white/60 p-1 overflow-x-auto scrollbar-hide pointer-events-auto">
        {[
          { key: "All", label: "All", icon: <Globe className="w-3 h-3" /> },
          { key: "Rivers", label: "Rivers", icon: <Droplets className="w-3 h-3" /> },
          { key: "Himalayas", label: "Himalayas", icon: <Mountain className="w-3 h-3" /> },
          { key: "Passes", label: "Passes", icon: <MapIcon className="w-3 h-3" /> },
          { key: "Protected Areas", label: "Parks", icon: <TreePine className="w-3 h-3" /> },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setTaxonomyFilter(f.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
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

      {activeFilter === "Rivers" && (
        <div className="absolute top-[6.5rem] left-3 z-30 pointer-events-auto">
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

      {/* ── Layer controls — compact floating card ──────────────── */}
      {showLayers && (
        <div className="absolute bottom-4 left-3 z-40 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg shadow-black/[0.06] border border-white/60 p-2.5 animate-in slide-in-from-bottom-4 fade-in duration-200 w-[max-content] max-w-[calc(100vw-1.5rem)]">
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
            onStateClick={handleStateClick}
            onStateHover={handleStateHover}
            onFeatureClick={handleFeatureClick}
          />

          {/* ── Floating map legend ── */}
          {activeFilter === "Protected Areas" && (
            <div className="absolute bottom-14 right-3 z-20 bg-white/90 backdrop-blur-xl rounded-lg shadow-lg shadow-black/[0.04] border border-white/60 px-3 py-2 space-y-1.5 animate-in fade-in duration-200">
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
            <div className="absolute bottom-14 right-3 z-20 bg-white/90 backdrop-blur-xl rounded-lg shadow-lg shadow-black/[0.04] border border-white/60 px-3 py-2 space-y-1.5 animate-in fade-in duration-200">
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

            {mode === "explore" && selectedStateData && (
              <StateInfoPanel state={selectedStateData} onClose={() => { setSelectedState(null); setShowPanel(false); }} />
            )}

            {mode === "explore" && selectedFeature && (
              <FeatureInfoPanel feature={selectedFeature} onClose={() => { setSelectedFeature(null); setShowPanel(false); }} />
            )}

            {mode === "explore" && !selectedStateData && !selectedFeature && !["Rivers", "Himalayas", "Passes", "Protected Areas"].includes(activeFilter) && (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-5 h-5 text-[#D1D5DB]" />
                </div>
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Select a state</h3>
                <p className="text-xs text-[#9CA3AF]">Click on the map to explore details</p>
              </div>
            )}

            {mode === "explore" && !selectedStateData && !selectedFeature && ["Rivers", "Himalayas", "Passes", "Protected Areas"].includes(activeFilter) && (
              <div className="flex flex-col h-[calc(100dvh-8rem)]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A1A]">{activeFilter}</h3>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{displayFeaturesList.length} items</p>
                  </div>
                  {(hiddenRivers.size > 0 || hiddenPeaks.size > 0) && (
                    <button onClick={() => { setHiddenRivers(new Set()); setHiddenPeaks(new Set()); }} className="text-[10px] text-[#C4784A] hover:underline font-semibold">
                      Reset
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto -mx-1">
                  {/* Section header for Ranges */}
                  {activeFilter === "Himalayas" && (
                    <div className="flex items-center justify-between mb-1">
                      <p className="px-2 pt-1 pb-1 text-[9px] font-bold text-[#92400E] uppercase tracking-wider">Mountain Ranges</p>
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
                    .filter(r => !(activeFilter === "Himalayas") || r.kind === "range")
                    .map(r => {
                      const isSpotlit = selectedRanges.has(r.name);
                      const isRange = r.kind === "range";
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
                          ? "bg-amber-50 border border-amber-200 shadow-sm"
                          : isRange
                          ? "border border-transparent hover:bg-[#FFFBEB] cursor-pointer"
                          : "border border-transparent hover:bg-[#FAF7F2]"
                      }`}
                    >
                      {isRange ? (
                        <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
                          <input
                            type="checkbox"
                            checked={isSpotlit}
                            readOnly
                            className="peer appearance-none w-4 h-4 border-2 border-[#92400E] rounded-[3px] bg-white checked:bg-[#92400E] checked:border-[#92400E] transition-all cursor-pointer"
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
                          isSpotlit ? "text-amber-700 font-semibold" :
                          isRange ? "text-[#1A1A1A] group-hover:text-amber-700" :
                          "text-[#1A1A1A] group-hover:text-[#92400E]"
                        }`}>{r.name}</span>
                      </div>
                      <span className={`text-[9px] tabular-nums shrink-0 ${
                        isSpotlit ? "text-amber-600 font-medium" : "text-[#9CA3AF]"
                      }`}>{r.detail}</span>
                      {isRange && isSpotlit && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />}
                    </button>
                  );})}
                  {/* Section header for Peaks */}
                  {activeFilter === "Himalayas" && (
                    <p className="px-2 pt-3 pb-1 text-[9px] font-bold text-[#1E40AF] uppercase tracking-wider">Individual Peaks</p>
                  )}
                  {activeFilter === "Himalayas" && displayFeaturesList
                    .filter(r => r.kind === "peak")
                    .map(r => (
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
                           className="peer appearance-none w-3.5 h-3.5 border border-[#D1D5DB] rounded-sm bg-white checked:bg-[#1E40AF] checked:border-[#1E40AF] transition-all cursor-pointer"
                         />
                         <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-[#1A1A1A] group-hover:text-[#1E40AF] transition-colors truncate block">{r.name}</span>
                      </div>
                      <span className="text-[9px] text-[#9CA3AF] tabular-nums shrink-0">{r.detail}</span>
                    </label>
                  ))}
                  {/* For non-Himalayas filters, render normally */}
                  {activeFilter !== "Himalayas" && displayFeaturesList.length === 0 && (
                    <div className="text-center py-6 text-xs text-[#9CA3AF]">
                      No items match these filters.
                    </div>
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

      {flashState === "incorrect" && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-red-500/15 animate-in fade-in duration-100" />
      )}
      {flashState === "correct" && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-green-500/15 animate-in fade-in duration-100" />
      )}
    </div>
  );
}
