import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subject } from "@/lib/types";

// Map from UI subject names → DB subject names
const SUBJECT_MAP: Record<string, Subject> = {
  "History":        "History",
  "Geography":      "Geography",
  "Economics":      "Economy",
  "Economy":        "Economy",
  "Environment":    "Environment",
  "Polity":         "Polity",
  "Science & Tech": "Science",
  "Science":        "Science",
  "Current Affairs": "Current Affairs",
};

// Fallback keyword map for topics not yet enriched
const TOPIC_KEYWORDS: Record<string, string[]> = {
  "Art & Architecture": ["temple", "architecture", "painting", "sculpture", "cave", "monument", "stupa", "art", "fresco", "miniature"],
  "Ancient India":      ["vedic", "maurya", "gupta", "harappan", "indus", "sangam", "ashoka", "upanishad", "ancient"],
  "Medieval India":     ["mughal", "delhi sultanate", "vijayanagar", "rajput", "bahmani", "medieval", "sultan", "dynasty"],
  "Modern India":       ["british", "colonial", "act of\", \"reform", "1857", "viceroy", "governor general", "partition", "modern"],
  "Freedom Struggle":   ["gandhi", "congress", "nationalist", "independence", "non-cooperation", "civil disobedience", "quit india", "freedom", "revolt"],
  "Bhakti & Sufi":      ["bhakti", "sufi", "saint", "kabir", "mirabai", "chishti", "dargah", "devotional"],
  "World History":      ["world war", "french revolution", "renaissance", "imperialism", "industrial revolution"],
  "Physical Geography": ["geomorphology", "rock", "plateau", "fold", "erosion", "relief", "landform", "earthquake", "volcano"],
  "Indian Rivers & Water": ["river", "tributary", "dam", "reservoir", "lake", "canal", "basin", "ganga", "brahmaputra"],
  "Climate & Monsoon":  ["monsoon", "rainfall", "climate", "temperature", "cyclone", "humidity", "season"],
  "Agriculture & Soil": ["soil", "crop", "agriculture", "irrigation", "fertilizer", "millet", "wheat", "rice"],
  "World Geography":    ["continent", "country", "strait", "ocean", "sea", "mountain range", "desert", "amazon"],
  "Resources & Energy": ["mineral", "coal", "petroleum", "natural gas", "resource", "energy", "mining"],
  "Maps & Location":    ["located", "lies in", "situated", "border", "latitude", "longitude", "passes through"],
  "Oceanography":       ["ocean current", "tidal", "coral", "reef", "mangrove", "deep sea"],
  "Macro Economics":    ["gdp", "inflation", "deflation", "recession", "growth rate", "national income"],
  "Banking & Monetary": ["rbi", "repo rate", "bank", "credit", "monetary policy", "slr", "crr", "liquidity"],
  "Fiscal Policy & Budget": ["fiscal", "budget", "tax", "gst", "direct tax", "deficit", "revenue", "expenditure"],
  "International Trade": ["export", "import", "trade", "wto", "balance of payment", "forex", "currency"],
  "Agriculture Economy": ["msp", "farmer", "crop insurance", "pm-kisan", "agricultural", "agri"],
  "Schemes & Poverty":  ["scheme", "poverty", "bpl", "welfare", "beneficiary", "mission", "pradhan mantri"],
  "Capital Markets":    ["sebi", "stock", "market", "securities", "bonds", "mutual fund", "nse", "bse"],
  "Infrastructure & Industry": ["infrastructure", "industry", "manufacturing", "fdi", "production", "sector"],
  "Ecology & Ecosystems": ["ecosystem", "ecology", "food chain", "nutrient cycle", "biomass", "trophic"],
  "Biodiversity & Species": ["species", "endemic", "extinction", "biodiversity", "flora", "fauna", "iucn", "red list"],
  "Protected Areas":    ["national park", "wildlife sanctuary", "tiger reserve", "biosphere", "protected area"],
  "Climate Change":     ["climate change", "global warming", "greenhouse", "carbon", "paris agreement", "ipcc"],
  "Environmental Laws": ["environment protection act", "wildlife protection act", "forest act", "pollution act", "tribunal"],
  "Pollution & Waste":  ["pollution", "waste", "plastic", "air quality", "water quality", "noise"],
  "International Conventions": ["convention", "protocol", "ramsar", "cites", "cbd", "unfccc", "montreal"],
  "Schemes & Reports":  ["report", "index", "ranking", "state of environment", "ministry of environment"],
  "Constitutional Articles": ["article", "schedule", "part ", "amendment", "constitution"],
  "Parliament & Legislature": ["parliament", "lok sabha", "rajya sabha", "legislative", "bill", "session", "speaker"],
  "Fundamental Rights & Duties": ["fundamental right", "fundamental duty", "right to", "freedom of", "article 12", "dpsp"],
  "Judiciary & Courts": ["supreme court", "high court", "judicial", "writ", "habeas corpus", "pil", "tribunal"],
  "Constitutional Bodies": ["election commission", "cag", "upsc", "finance commission", "attorney general"],
  "Federalism & States": ["state", "union territory", "federalism", "governor", "chief minister", "state legislature"],
  "Governance & Policy": ["policy", "governance", "rti", "lokpal", "ombudsman", "e-governance"],
  "Elections & Representation": ["election", "voting", "seat", "reservation", "delimitation", "ballot"],
  "Space Technology":   ["isro", "satellite", "launch vehicle", "orbit", "mission", "chandrayaan", "mangalyaan", "space"],
  "Biotechnology":      ["gmo", "genetically", "gene", "vaccine", "dna", "rna", "cloning", "biotechnology"],
  "Defence & Military Tech": ["missile", "defence", "drdo", "navy", "air force", "army", "aircraft", "weapon"],
  "Nuclear & Energy":   ["nuclear", "reactor", "uranium", "thorium", "atomic", "radiation"],
  "IT & Computers":     ["internet", "cyber", "software", "blockchain", "ai", "artificial intelligence", "data"],
  "Health & Diseases":  ["disease", "virus", "bacteria", "vaccine", "health", "cancer", "who", "epidemic"],
  "Chemistry & Physics": ["element", "compound", "reaction", "atom", "molecule", "physics", "thermodynamics"],
  "Nanotechnology & AI": ["nanotech", "nanotechnology", "artificial intelligence", "machine learning", "robot"],
  "International Relations": ["bilateral", "summit", "treaty", "diplomatic", "un", "foreign"],
  "Government Schemes": ["scheme", "mission", "pradhan mantri", "flagship", "initiative", "program"],
  "Awards & Institutions": ["award", "prize", "institution", "organization", "founded"],
  "Sports & Events":    ["olympic", "sporting", "tournament", "cup", "championship", "games"],
  "Social Issues":      ["social", "caste", "reservation", "gender", "minority", "poverty"],
  "UN & Global Bodies": ["united nations", "world bank", "imf", "wto", "g20", "g7", "global"],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject") ?? "";
  const year = Number(searchParams.get("year") ?? "0");
  const topic = searchParams.get("topic") ?? "";

  const dbSubject = SUBJECT_MAP[subject] as Subject | undefined;
  if (!dbSubject) {
    return NextResponse.json({ questions: [], error: "Invalid params" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // Build query — use new `topic` column if set, with fallback to keyword filter
    let query = supabase
      .from("questions")
      .select("id, prompt, options, correct_option_id, year, subject, topic, sub_topic, keywords, question_type, concepts, importance, difficulty_rationale, mnemonic_hint")
      .eq("source", "pyq")
      .eq("subject", dbSubject)
      .order("year", { ascending: false });

    if (year) query = query.eq("year", year);

    const { data: allData, error } = await query;
    if (error || !allData) {
      throw new Error(error?.message ?? "No data");
    }

    // Strategy 1: Use AI-enriched `topic` column (primary — if enrichment is complete)
    let filtered = allData.filter(q =>
      q.topic?.toLowerCase().includes(topic.toLowerCase()) ||
      q.sub_topic?.toLowerCase().includes(topic.toLowerCase())
    );

    // Strategy 2: Use AI-enriched `keywords` array (secondary)
    if (filtered.length < 5 && topic) {
      const topicLower = topic.toLowerCase();
      filtered = allData.filter(q => {
        const kws = (q.keywords ?? []) as string[];
        return kws.some(kw => kw.toLowerCase().includes(topicLower) || topicLower.includes(kw.toLowerCase()));
      });
    }

    // Strategy 3: Fallback to keyword text search
    if (filtered.length < 5 && topic) {
      const fallbackKws = TOPIC_KEYWORDS[topic] ?? [topic.toLowerCase()];
      filtered = allData.filter(q => {
        const text = (q.prompt ?? "").toLowerCase();
        return fallbackKws.some(kw => text.includes(kw.toLowerCase()));
      });
    }

    // If still 0 results, return a sample of all subject questions
    const result = filtered.length > 0 ? filtered : allData.slice(0, 15);

    return NextResponse.json({
      questions: result.slice(0, 40),
      total: result.length,
      totalSubject: allData.length,
      filtered: filtered.length > 0,
      enriched: allData.some(q => q.topic),
    });
  } catch (err: any) {
    return NextResponse.json({ questions: [], error: err.message }, { status: 500 });
  }
}
