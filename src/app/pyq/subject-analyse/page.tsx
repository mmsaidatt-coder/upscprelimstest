"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";


// ─── Constants ─────────────────────────────────────────────────────────────────
const ACCENT = "#a3e635";
const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014];
const BAR_COLORS = [
  "#a3e635","#34d399","#60a5fa","#f472b6","#fb923c",
  "#facc15","#a78bfa","#2dd4bf","#f87171","#818cf8",
  "#4ade80","#38bdf8","#e879f9","#fbbf24",
];

// ─── Topic dataset: UPSC Prelims topic taxonomy per subject ───────────────────
type TopicRow = { topic: string; years: Record<number, number> };

const SUBJECT_TOPICS: Record<string, TopicRow[]> = {
  History: [
    { topic: "Art & Architecture", years: { 2014:4, 2015:3, 2016:4, 2017:3, 2018:4, 2019:3, 2020:2, 2021:4, 2022:3, 2023:5, 2024:2, 2025:2 } },
    { topic: "Ancient India", years:    { 2014:3, 2015:3, 2016:2, 2017:3, 2018:2, 2019:2, 2020:2, 2021:2, 2022:1, 2023:1, 2024:2, 2025:3 } },
    { topic: "Medieval India", years:   { 2014:2, 2015:2, 2016:3, 2017:2, 2018:3, 2019:2, 2020:1, 2021:3, 2022:4, 2023:2, 2024:1, 2025:0 } },
    { topic: "Modern India", years:     { 2014:2, 2015:3, 2016:3, 2017:3, 2018:5, 2019:3, 2020:4, 2021:3, 2022:1, 2023:2, 2024:1, 2025:4 } },
    { topic: "Freedom Struggle", years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:3, 2019:2, 2020:3, 2021:2, 2022:1, 2023:1, 2024:1, 2025:3 } },
    { topic: "Bhakti & Sufi", years:    { 2014:1, 2015:1, 2016:1, 2017:2, 2018:1, 2019:1, 2020:1, 2021:2, 2022:2, 2023:1, 2024:0, 2025:1 } },
    { topic: "Personalities", years:    { 2014:1, 2015:2, 2016:1, 2017:1, 2018:1, 2019:2, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:0 } },
    { topic: "World History", years:    { 2014:0, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:0, 2022:1, 2023:0, 2024:0, 2025:1 } },
  ],
  Geography: [
    { topic: "Physical Geography",  years: { 2014:2, 2015:3, 2016:2, 2017:2, 2018:1, 2019:2, 2020:1, 2021:1, 2022:1, 2023:2, 2024:4, 2025:4 } },
    { topic: "Indian Rivers & Water", years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:2, 2019:2, 2020:2, 2021:1, 2022:1, 2023:2, 2024:1, 2025:1 } },
    { topic: "Climate & Monsoon",   years: { 2014:1, 2015:2, 2016:1, 2017:1, 2018:1, 2019:1, 2020:0, 2021:0, 2022:1, 2023:1, 2024:2, 2025:1 } },
    { topic: "Agriculture & Soil",  years: { 2014:2, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:0 } },
    { topic: "World Geography",     years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:0, 2021:1, 2022:1, 2023:2, 2024:2, 2025:2 } },
    { topic: "Resources & Energy",  years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "Maps & Location",     years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "Oceanography",        years: { 2014:1, 2015:0, 2016:1, 2017:0, 2018:1, 2019:0, 2020:0, 2021:0, 2022:0, 2023:0, 2024:1, 2025:1 } },
  ],
  Economics: [
    { topic: "Macro Economics",     years: { 2014:3, 2015:3, 2016:3, 2017:3, 2018:3, 2019:3, 2020:4, 2021:3, 2022:3, 2023:4, 2024:3, 2025:4 } },
    { topic: "Banking & Monetary",  years: { 2014:2, 2015:3, 2016:3, 2017:2, 2018:2, 2019:3, 2020:3, 2021:2, 2022:3, 2023:3, 2024:2, 2025:3 } },
    { topic: "Fiscal Policy & Budget", years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:2, 2019:2, 2020:3, 2021:2, 2022:2, 2023:2, 2024:2, 2025:3 } },
    { topic: "International Trade", years: { 2014:2, 2015:1, 2016:1, 2017:2, 2018:1, 2019:2, 2020:2, 2021:2, 2022:2, 2023:2, 2024:2, 2025:2 } },
    { topic: "Agriculture Economy", years: { 2014:1, 2015:2, 2016:1, 2017:1, 2018:1, 2019:1, 2020:2, 2021:1, 2022:1, 2023:1, 2024:1, 2025:2 } },
    { topic: "Schemes & Poverty",   years: { 2014:1, 2015:1, 2016:1, 2017:2, 2018:1, 2019:1, 2020:2, 2021:2, 2022:2, 2023:2, 2024:1, 2025:2 } },
    { topic: "Capital Markets",     years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "Infrastructure & Industry", years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:0, 2024:1, 2025:1 } },
  ],
  Environment: [
    { topic: "Ecology & Ecosystems", years: { 2014:5, 2015:4, 2016:4, 2017:4, 2018:4, 2019:4, 2020:4, 2021:4, 2022:4, 2023:4, 2024:3, 2025:4 } },
    { topic: "Biodiversity & Species", years: { 2014:6, 2015:5, 2016:4, 2017:4, 2018:4, 2019:5, 2020:5, 2021:4, 2022:4, 2023:4, 2024:3, 2025:3 } },
    { topic: "Protected Areas",     years: { 2014:4, 2015:3, 2016:3, 2017:3, 2018:2, 2019:3, 2020:3, 2021:3, 2022:3, 2023:2, 2024:2, 2025:2 } },
    { topic: "Climate Change",      years: { 2014:3, 2015:3, 2016:3, 2017:3, 2018:2, 2019:2, 2020:2, 2021:3, 2022:2, 2023:3, 2024:2, 2025:2 } },
    { topic: "Environmental Laws",  years: { 2014:3, 2015:2, 2016:2, 2017:2, 2018:2, 2019:2, 2020:2, 2021:2, 2022:2, 2023:1, 2024:1, 2025:2 } },
    { topic: "Pollution & Waste",   years: { 2014:2, 2015:1, 2016:2, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "International Conventions", years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:2, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "Schemes & Reports",   years: { 2014:2, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:0, 2024:0, 2025:0 } },
  ],
  Polity: [
    { topic: "Constitutional Articles", years: { 2014:3, 2015:3, 2016:3, 2017:4, 2018:4, 2019:3, 2020:3, 2021:4, 2022:2, 2023:3, 2024:4, 2025:3 } },
    { topic: "Parliament & Legislature", years: { 2014:2, 2015:2, 2016:3, 2017:3, 2018:3, 2019:2, 2020:2, 2021:3, 2022:2, 2023:3, 2024:3, 2025:3 } },
    { topic: "Fundamental Rights & Duties", years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:2, 2019:2, 2020:2, 2021:2, 2022:1, 2023:2, 2024:2, 2025:2 } },
    { topic: "Judiciary & Courts",  years: { 2014:1, 2015:2, 2016:2, 2017:2, 2018:2, 2019:1, 2020:1, 2021:2, 2022:2, 2023:2, 2024:2, 2025:2 } },
    { topic: "Constitutional Bodies", years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:2, 2019:2, 2020:2, 2021:2, 2022:2, 2023:2, 2024:2, 2025:1 } },
    { topic: "Federalism & States", years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:2, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:2, 2025:1 } },
    { topic: "Governance & Policy", years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:2, 2021:2, 2022:2, 2023:1, 2024:2, 2025:2 } },
    { topic: "Elections & Representation", years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
  ],
  "Science & Tech": [
    { topic: "Space Technology",    years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:2, 2021:2, 2022:3, 2023:2, 2024:2, 2025:3 } },
    { topic: "Biotechnology",       years: { 2014:2, 2015:1, 2016:2, 2017:2, 2018:1, 2019:2, 2020:2, 2021:2, 2022:2, 2023:2, 2024:2, 2025:2 } },
    { topic: "Defence & Military Tech", years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:2, 2023:1, 2024:1, 2025:2 } },
    { topic: "Nuclear & Energy",    years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "IT & Computers",      years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:2, 2025:2 } },
    { topic: "Health & Diseases",   years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:2, 2019:1, 2020:2, 2021:2, 2022:2, 2023:1, 2024:1, 2025:1 } },
    { topic: "Chemistry & Physics", years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "Nanotechnology & AI", years: { 2014:0, 2015:0, 2016:0, 2017:1, 2018:0, 2019:1, 2020:0, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
  ],
  "Current Affairs": [
    { topic: "International Relations", years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:2, 2019:2, 2020:1, 2021:1, 2022:4, 2023:4, 2024:3, 2025:3 } },
    { topic: "Government Schemes",  years: { 2014:2, 2015:2, 2016:2, 2017:2, 2018:2, 2019:2, 2020:2, 2021:2, 2022:2, 2023:2, 2024:2, 2025:2 } },
    { topic: "Awards & Institutions", years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:2, 2025:1 } },
    { topic: "Sports & Events",     years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "Social Issues",       years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
    { topic: "UN & Global Bodies",  years: { 2014:1, 2015:1, 2016:1, 2017:1, 2018:1, 2019:1, 2020:1, 2021:1, 2022:1, 2023:1, 2024:1, 2025:1 } },
  ],
};

// ─── Keyword map: topic → search terms used to search the prompt text ─────────
const TOPIC_KEYWORDS: Record<string, string[]> = {
  // History
  "Art & Architecture": ["temple", "architecture", "dance", "music", "art", "painting", "sculpture", "cave"],
  "Ancient India": ["ancient", "maurya", "gupta", "vedic", "harappan", "indus", "ashoka", "chandragupta"],
  "Medieval India": ["mughal", "medieval", "sultan", "delhi", "akbar", "aurangzeb", "maratha", "vijayanagara"],
  "Modern India": ["colonial", "british", "reform", "19th century", "socio-religious", "company"],
  "Freedom Struggle": ["freedom", "independence", "congress", "gandhi", "quit india", "non-cooperation", "civil disobedience"],
  "Bhakti & Sufi": ["bhakti", "sufi", "saint", "kabir", "mirabai", "chishti"],
  "Personalities": ["personality", "leader", "reformer", "ruler", "king"],
  "World History": ["world war", "french revolution", "american", "industrial revolution", "napoleon"],
  // Geography
  "Physical Geography": ["mountain", "ocean", "river", "erosion", "tectonic", "rock", "soil", "plateau", "isotherm", "latitude"],
  "Indian Rivers & Water": ["river", "tributary", "dam", "lake", "waterfall", "basin", "flood"],
  "Climate & Monsoon": ["monsoon", "climate", "rainfall", "temperature", "cyclone", "wind"],
  "Agriculture & Soil": ["crop", "soil", "irrigation", "agriculture", "farming"],
  "World Geography": ["continent", "country", "sea", "cape", "strait", "channel", "sumed", "pipeline"],
  "Resources & Energy": ["mineral", "ore", "coal", "iron", "resource", "energy"],
  "Maps & Location": ["located", "border", "state", "district", "pass", "region"],
  "Oceanography": ["ocean", "tide", "coral", "marine", "pacific", "atlantic", "sea"],
  // Economics
  "Macro Economics": ["gdp", "inflation", "recession", "national income", "unemployment", "growth"],
  "Banking & Monetary": ["rbi", "bank", "monetary", "repo", "liquidity", "credit", "currency"],
  "Fiscal Policy & Budget": ["budget", "fiscal", "deficit", "tax", "revenue", "expenditure"],
  "International Trade": ["export", "import", "trade", "wto", "balance of payment", "current account"],
  "Agriculture Economy": ["agriculture", "msp", "food", "farming", "crop insurance"],
  "Schemes & Poverty": ["scheme", "poverty", "welfare", "jan dhan", "mudra", "subsidy"],
  "Capital Markets": ["stock", "share", "sebi", "market", "equity", "mutual fund", "aif", "alternative"],
  "Infrastructure & Industry": ["industry", "manufacturing", "infrastructure", "highway", "railway"],
  // Environment
  "Ecology & Ecosystems": ["ecosystem", "ecology", "food chain", "habitat", "niche"],
  "Biodiversity & Species": ["species", "biodiversity", "endemic", "endangered", "wildlife"],
  "Protected Areas": ["national park", "sanctuary", "biosphere", "reserve", "protected"],
  "Climate Change": ["climate change", "global warming", "carbon", "emission", "greenhouse"],
  "Environmental Laws": ["environment act", "law", "regulation", "pollution control", "ngt"],
  "Pollution & Waste": ["pollution", "plastic", "waste", "effluent", "microplastic"],
  "International Conventions": ["convention", "protocol", "ramsar", "cites", "unfccc", "cop"],
  "Schemes & Reports": ["scheme", "mission", "programme", "report", "index"],
  // Polity
  "Constitutional Articles": ["article", "schedule", "constitution", "amendment"],
  "Parliament & Legislature": ["parliament", "lok sabha", "rajya sabha", "bill", "legislature", "speaker"],
  "Fundamental Rights & Duties": ["fundamental right", "directive principle", "dpsp", "duty"],
  "Judiciary & Courts": ["court", "judiciary", "judge", "supreme court", "high court", "tribunal"],
  "Constitutional Bodies": ["election commission", "cag", "upsc", "finance commission", "constitutional body"],
  "Federalism & States": ["state", "federal", "centre", "concurrent", "union territory", "panchayat"],
  "Governance & Policy": ["governance", "policy", "committee", "lokpal", "rti", "enforcement", "directorate"],
  "Elections & Representation": ["election", "vote", "electoral", "candidate", "representation"],
  // Science & Tech
  "Space Technology": ["isro", "satellite", "rocket", "launch", "space", "orbit", "chandrayaan", "gagan"],
  "Biotechnology": ["dna", "gene", "gmo", "clone", "stem cell", "vaccine", "monoclonal", "antibody"],
  "Defence & Military Tech": ["missile", "defence", "weapon", "kavach", "drone", "uav", "military"],
  "Nuclear & Energy": ["nuclear", "reactor", "fuel cell", "thorium", "atomic"],
  "IT & Computers": ["artificial intelligence", "blockchain", "quantum", "cyber", "computing", "machine learning"],
  "Health & Diseases": ["disease", "virus", "bacteria", "health", "pandemic", "antibiotic"],
  "Chemistry & Physics": ["chemical", "compound", "element", "physics", "optics"],
  "Nanotechnology & AI": ["nano", "ai", "algorithm", "deep learning", "machine learning", "majorana"],
  // Current Affairs
  "International Relations": ["brics", "nato", "bimstec", "bilateral", "relations", "summit", "treaty"],
  "Government Schemes": ["yojana", "mission", "scheme", "government programme", "ministry"],
  "Awards & Institutions": ["award", "prize", "noble", "eminent", "gandhi peace", "kho kho"],
  "Sports & Events": ["sport", "olympiad", "chess", "cricket", "tournament", "cup"],
  "Social Issues": ["social", "poverty", "inequality", "women", "gender"],
  "UN & Global Bodies": ["united nations", "un", "who", "imf", "world bank", "wmo"],
};

// ─── Type for a fetched question ──────────────────────────────────────────────
type Question = {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  correct_option_id: string | null;
  year: number | null;
  subject: string;
  // Enriched metadata
  topic?: string | null;
  sub_topic?: string | null;
  keywords?: string[] | null;
  question_type?: string | null;
  concepts?: string[] | null;
  importance?: string | null;
  difficulty_rationale?: string | null;
  mnemonic_hint?: string | null;
  ncert_class?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getTotal(t: TopicRow) { return Object.values(t.years).reduce((a, b) => a + b, 0); }
function heatColor(v: number, max: number): { bg: string; fg: string } {
  if (max === 0 || v === 0) return { bg: "#111", fg: "#444" };
  const i = v / max;
  const bg = i < 0.25 ? "#1a3a1a" : i < 0.5 ? "#2a5c1a" : i < 0.75 ? "#3d8020" : "#a3e635";
  const fg = i >= 0.75 ? "#000" : "#999";
  return { bg, fg };
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-[var(--background-secondary)] border border-[#262626] p-5 sm:p-6">
      <p className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">{title}</p>
      {subtitle && <p className="text-xs text-[var(--muted)] mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="rounded-xl bg-[var(--background-secondary)] border border-[#262626] p-4 sm:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="text-2xl sm:text-3xl font-display font-bold mt-2 text-[var(--accent)]">{value}</p>
      <p className="text-xs text-[var(--muted)] mt-1">{sub}</p>
    </div>
  );
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length || !payload[0]) return null;
  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-[#333] px-4 py-3 shadow-xl text-sm min-w-[140px]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">{payload[0].name}</p>
      <p className="font-bold text-[var(--accent)]">{payload[0].value} Questions</p>
    </div>
  );
}

// ─── Topic Questions Drawer ────────────────────────────────────────────────────
function TopicDrawer({
  topic,
  year,
  subject,
  barColor,
  onClose,
}: {
  topic: string | null;
  year: number | null;
  subject: string;
  barColor: string;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const fetchTopicQuestions = useCallback(async () => {
    if (!topic) return;
    setLoading(true);
    setExpandedQ(null);

    const params = new URLSearchParams({ subject, topic });
    if (year) params.set("year", String(year));

    try {
      const res = await fetch(`/api/topic-questions?${params.toString()}`);
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions as Question[]);
      }
    } catch {
      setQuestions([]);
    }
    setLoading(false);
  }, [topic, year, subject]);

  useEffect(() => {
    fetchTopicQuestions();
  }, [fetchTopicQuestions]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl flex flex-col bg-[#0d0d0d] border-l border-[#262626] shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#1e1e1e]" style={{ borderLeftColor: barColor, borderLeftWidth: 4 }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">{subject} · PYQ Questions</p>
            <h2 className="text-lg font-display font-bold text-[var(--foreground)] mt-1">
              {topic}{year ? <span className="text-[var(--accent)] ml-2">· {year}</span> : ""}
            </h2>
            {!loading && (
              <p className="text-xs text-[var(--muted)] mt-1">{questions.length} questions found across 2014–2025</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 mt-1 rounded-lg p-2 text-[var(--muted)] hover:text-white hover:bg-[#1e1e1e] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-[var(--muted)] text-sm animate-pulse tracking-widest uppercase">Loading questions…</div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-2xl mb-3">🔍</p>
              <p className="text-sm font-semibold text-[var(--foreground)]">No questions found</p>
              <p className="text-xs text-[var(--muted)] mt-2 max-w-xs">
                Try browsing all questions for this subject in the PYQ Library.
              </p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isExpanded = expandedQ === q.id;
              const opts = Array.isArray(q.options) ? q.options : [];
              const importanceColor = {
                "Very High": "#f87171", "High": "#fb923c",
                "Medium": "#facc15", "Low": "#6b7280",
              }[q.importance ?? ""] ?? "#6b7280";
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-[#1e1e1e] bg-[#111] overflow-hidden transition-all"
                >
                  {/* Question header */}
                  <button
                    className="w-full text-left px-4 py-4 flex items-start gap-3 hover:bg-[#161616] transition-colors"
                    onClick={() => setExpandedQ(isExpanded ? null : q.id)}
                  >
                    <span
                      className="flex-shrink-0 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center mt-0.5"
                      style={{ background: barColor + "22", color: barColor }}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <p className="text-xs text-[var(--muted)]">{q.year ?? "—"} · {q.subject}</p>
                        {q.question_type && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#1e1e1e] text-[#818cf8] border border-[#818cf8]/20">{q.question_type}</span>
                        )}
                        {q.importance && (
                          <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full" style={{ background: importanceColor + "20", color: importanceColor, border: `1px solid ${importanceColor}30` }}>{q.importance}</span>
                        )}
                      </div>
                      {q.sub_topic && (
                        <p className="text-[10px] text-[var(--accent)] font-semibold mb-1 opacity-80">{q.sub_topic}</p>
                      )}
                      <p className="text-sm text-[var(--foreground)] leading-relaxed line-clamp-2">
                        {q.prompt.replace(/^\d+\.\s*/, '')}
                      </p>
                    </div>
                    <svg
                      className={`flex-shrink-0 text-[var(--muted)] mt-1 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      width="14" height="14" viewBox="0 0 14 14" fill="none"
                    >
                      <path d="M2 4.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {/* Expanded view */}
                  {isExpanded && (
                    <div className="border-t border-[#1e1e1e] px-4 pb-4 pt-3 space-y-3">
                      {/* Full question */}
                      <p className="text-xs font-semibold text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">{q.prompt.replace(/^\d+\.\s*/, '')}</p>
                      
                      {/* Options */}
                      <div className="space-y-1.5">
                        {opts.map((opt) => {
                          const isCorrect = q.correct_option_id?.toUpperCase() === opt.id?.toUpperCase();
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-xs transition-all ${
                                isCorrect
                                  ? "bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635]"
                                  : "bg-[#161616] border border-[#222] text-[var(--muted)]"
                              }`}
                            >
                              <span className={`font-bold flex-shrink-0 ${isCorrect ? "text-[#a3e635]" : "text-[#555]"}`}>({opt.id})</span>
                              <span className="leading-relaxed">{opt.text}</span>
                              {isCorrect && <span className="ml-auto flex-shrink-0 text-[#a3e635]">✓</span>}
                            </div>
                          );
                        })}
                        {!q.correct_option_id && (
                          <p className="text-[10px] text-[#555]">Answer key not yet available.</p>
                        )}
                      </div>

                      {/* Keywords */}
                      {q.keywords && q.keywords.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Key Terms</p>
                          <div className="flex flex-wrap gap-1">
                            {q.keywords.slice(0, 7).map((kw) => (
                              <span key={kw} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#1a2a1a] text-[#6ee7b7] border border-[#2a4a2a]">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Concepts */}
                      {q.concepts && q.concepts.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] mb-1.5">Concepts Tested</p>
                          <div className="flex flex-wrap gap-1">
                            {q.concepts.slice(0, 4).map((c) => (
                              <span key={c} className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-[#1a1a2a] text-[#818cf8] border border-[#2a2a4a]">{c}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mnemonic hint */}
                      {q.mnemonic_hint && (
                        <div className="rounded-lg bg-[#1a1500] border border-[#facc15]/20 px-3 py-2.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[#facc15] mb-1">💡 Memory Tip</p>
                          <p className="text-[11px] text-[#fde68a] leading-relaxed">{q.mnemonic_hint}</p>
                        </div>
                      )}

                      {/* NCERT / Difficulty */}
                      <div className="flex items-center gap-3 flex-wrap text-[10px] text-[var(--muted)]">
                        {q.ncert_class && <span>📖 {q.ncert_class}</span>}
                        {q.difficulty_rationale && <span className="italic">{q.difficulty_rationale}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1e1e1e]">
          <Link
            href={`/app/pyq/run?subject=${encodeURIComponent(subject)}&limit=25`}
            className="flex items-center justify-center w-full py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
            style={{ background: barColor + "22", color: barColor, border: `1px solid ${barColor}44` }}
            onClick={onClose}
          >
            Practice {subject} Questions →
          </Link>
        </div>
      </div>
    </>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────────────────
function SubjectAnalyseDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subject = searchParams.get("subject") ?? "History";
  
  const [topics, setTopics] = useState<TopicRow[]>(SUBJECT_TOPICS[subject] ?? SUBJECT_TOPICS["History"] ?? []);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingMatrix(true);
    fetch(`/api/subject-blueprint?subject=${encodeURIComponent(subject)}`)
      .then(res => res.json())
      .then(data => {
        if (active && data.topics?.length > 0) {
          setTopics(data.topics);
        }
        setLoadingMatrix(false);
      })
      .catch(() => { setLoadingMatrix(false); });
    return () => { active = false; };
  }, [subject]);

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedBarColor, setSelectedBarColor] = useState<string>(BAR_COLORS[0] ?? "#a3e635");

  // Derived ──────────────────────────────────────────
  const sortedTopics = [...topics].sort((a, b) => getTotal(b) - getTotal(a));
  const topicBarData = sortedTopics.map(t => ({ topic: t.topic, total: getTotal(t) }));
  const totalQ = topicBarData.reduce((s, t) => s + t.total, 0);
  const topTopic = topicBarData[0]?.topic ?? "—";
  const heatMax = Math.max(...topics.flatMap(t => Object.values(t.years)));

  const yearTrendData = YEARS.map(y => ({
    year: `'${String(y).slice(2)}`,
    questions: topics.reduce((s, t) => s + (t.years[y] ?? 0), 0),
  })).reverse();

  const SUBJECTS = Object.keys(SUBJECT_TOPICS);

  const handleBarClick = (data: unknown, index: number) => {
    const d = data as { topic: string };
    setSelectedBarColor(BAR_COLORS[index % BAR_COLORS.length] ?? "#a3e635");
    setSelectedYear(null);
    setSelectedTopic(d.topic);
  };

  return (
    <div className="bg-blueprint-grid min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="rounded-full border border-[#333] bg-[#0e0e0e] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">
              Subject Analysis
            </span>
            <h1 className="heading text-3xl sm:text-4xl md:text-5xl text-[var(--foreground)] mt-3">
              <span className="text-[var(--accent)] drop-shadow-[0_0_12px_rgba(163,230,53,0.3)]">{subject.toUpperCase()}</span>
              {" "}BLUEPRINT
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1">Topic-level PYQ analysis — 2014 to 2025</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={subject}
                onChange={e => router.push(`/pyq/subject-analyse?subject=${encodeURIComponent(e.target.value)}`)}
                className="appearance-none rounded-lg border border-[#333] bg-[#0e0e0e] pl-4 pr-9 py-2.5 text-sm font-bold text-[var(--foreground)] outline-none focus:border-[var(--accent)] transition-colors cursor-pointer"
              >
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <Link href="/pyq" className="rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--muted)] hover:text-white hover:border-[#555] transition-all">
              ← PYQ
            </Link>
          </div>
        </div>

        {/* ── KPIs ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard label="Total Questions" value={totalQ} sub="PYQs 2014–2025" />
          <KpiCard label="Topics Covered" value={topics.length} sub="Distinct topic areas" />
          <KpiCard label="Top Topic" value={topTopic} sub={`${topicBarData[0]?.total ?? 0} questions`} />
          <KpiCard
            label="Difficulty"
            value={totalQ > 140 ? "Hard" : totalQ > 100 ? "Moderate" : "Easy"}
            sub="Relative to other subjects"
          />
        </div>

        {/* ── Row 1: Topic Weightage + Year Trend ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Topic Weightage Bar — INTERACTIVE */}
          <Section title="Topic Weightage" subtitle="Click a bar to see questions from that topic">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] inline-block animate-pulse" />
              <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">Click any bar to explore questions</p>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topicBarData}
                layout="vertical"
                margin={{ left: 4, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="topic"
                  tick={{ fill: "#bbb", fontSize: 10, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  width={135}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length || !payload[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl bg-[#1a1a1a] border border-[#333] px-4 py-3 shadow-xl text-sm">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] mb-1">{d.topic}</p>
                        <p className="font-bold text-[var(--accent)]">{d.total} Questions (2014–2025)</p>
                        <p className="text-[10px] text-[var(--muted)] mt-1">Click to browse questions →</p>
                      </div>
                    );
                  }}
                  cursor={{ fill: "#ffffff08" }}
                />
                <Bar
                  dataKey="total"
                  name="Questions"
                  radius={[0, 6, 6, 0]}
                  barSize={16}
                  onClick={(data, index) => handleBarClick(data, index)}
                  style={{ cursor: "pointer" }}
                >
                  {topicBarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={BAR_COLORS[i % BAR_COLORS.length]}
                      opacity={selectedTopic && selectedTopic !== entry.topic ? 0.35 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>

          {/* Year Trend */}
          <Section title="Year-wise Trend" subtitle="Total questions in this subject per year">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={yearTrendData} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={true} vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#aaa", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#ffffff08" }} />
                <Bar dataKey="questions" name="Questions" radius={[6, 6, 0, 0]} fill={ACCENT}>
                  {yearTrendData.map((d, i) => (
                    <Cell key={i} fill={d.questions === Math.max(...yearTrendData.map(x => x.questions)) ? ACCENT : "#2a5c1a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        {/* ── Topic × Year Heatmap ─────────────────────────────────────────── */}
        <Section title="Topic × Year Heatmap" subtitle="Question frequency per topic across all years — brighter = more questions">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="text-left text-[var(--muted)] font-bold uppercase pb-2 pr-2 text-[10px]" style={{ width: "140px" }}>Topic</th>
                  {YEARS.map(y => (
                    <th key={y} className="pb-2 font-bold text-center text-[9px] text-[var(--muted)]">
                      {`'${String(y).slice(2)}`}
                    </th>
                  ))}
                  <th className="pb-2 font-bold text-center text-[9px] text-[var(--accent)] px-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedTopics.map(t => {
                  const total = getTotal(t);
                  return (
                    <tr
                      key={t.topic}
                      className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => {
                        const idx = sortedTopics.findIndex(s => s.topic === t.topic);
                        setSelectedBarColor(BAR_COLORS[idx % BAR_COLORS.length] ?? "#a3e635");
                        setSelectedYear(null);
                        setSelectedTopic(t.topic);
                      }}
                    >
                      <td className="pr-2 py-0.5 text-[var(--foreground)] font-semibold text-[9px] whitespace-nowrap hover:text-[var(--accent)] transition-colors">
                        {t.topic}
                      </td>
                      {YEARS.map(y => {
                        const v = t.years[y] ?? 0;
                        const { bg, fg } = heatColor(v, heatMax);
                        return (
                          <td key={y} className="px-0.5 py-0.5">
                            <div
                              style={{ backgroundColor: bg, color: fg }}
                              className={`w-full h-6 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                                v > 0
                                  ? "cursor-pointer hover:ring-2 hover:ring-[var(--accent)]/70 hover:scale-105 active:scale-95"
                                  : "cursor-default"
                              }`}
                              title={v > 0 ? `Click: ${t.topic} ${y} — ${v}Qs` : `${t.topic} ${y}: 0`}
                              onClick={e => {
                                if (v === 0) return;
                                e.stopPropagation();
                                const idx = sortedTopics.findIndex(s => s.topic === t.topic);
                                setSelectedBarColor(BAR_COLORS[idx % BAR_COLORS.length] ?? "#a3e635");
                                setSelectedYear(y);
                                setSelectedTopic(t.topic);
                              }}
                            >
                              {v || ""}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-1 py-0.5 text-center font-bold text-[var(--accent)] text-[9px]">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

      </div>

      {/* Topic Questions Drawer */}
      {selectedTopic && (
        <TopicDrawer
          topic={selectedTopic}
          year={selectedYear}
          subject={subject}
          barColor={selectedBarColor}
          onClose={() => { setSelectedTopic(null); setSelectedYear(null); }}
        />
      )}
    </div>
  );
}

export default function SubjectAnalysePage() {
  return (
    <Suspense fallback={
      <div className="bg-blueprint-grid min-h-screen flex items-center justify-center">
        <div className="text-[var(--muted)] text-sm animate-pulse uppercase tracking-widest">Loading analysis…</div>
      </div>
    }>
      <SubjectAnalyseDashboard />
    </Suspense>
  );
}
