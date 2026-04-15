// ── India States & UTs — UPSC-relevant geographic data ─────────────────────────
// Region colors designed for dark map background (saturated pastels)

export type PhysicalRegion =
  | "himalayan"
  | "indo-gangetic"
  | "western-desert"
  | "central"
  | "western-coast"
  | "eastern-coast"
  | "southern-plateau"
  | "northeast"
  | "island";

export type StateData = {
  /** Must match st_nm in TopoJSON */
  name: string;
  code: string;
  type: "State" | "UT";
  capital: string;
  capitalCoords: [number, number]; // [lng, lat]
  region: PhysicalRegion;
  area: number; // sq km
  neighbors: string[];
  majorRivers: string[];
  mountainRanges: string[];
  nationalParks: string[];
  keyFacts: string[];
};

export const REGION_COLORS: Record<PhysicalRegion, { fill: string; hover: string; label: string }> = {
  himalayan:        { fill: "#818CF8", hover: "#A5B4FC", label: "Himalayan" },
  "indo-gangetic":  { fill: "#34D399", hover: "#6EE7B7", label: "Indo-Gangetic Plains" },
  "western-desert": { fill: "#FBBF24", hover: "#FDE68A", label: "Western Desert" },
  central:          { fill: "#F97316", hover: "#FDBA74", label: "Central Highlands" },
  "western-coast":  { fill: "#2DD4BF", hover: "#5EEAD4", label: "Western Coast" },
  "eastern-coast":  { fill: "#60A5FA", hover: "#93C5FD", label: "Eastern Coast" },
  "southern-plateau":{ fill: "#F472B6", hover: "#F9A8D4", label: "Southern Plateau" },
  northeast:        { fill: "#A3E635", hover: "#BEF264", label: "Northeast" },
  island:           { fill: "#C084FC", hover: "#D8B4FE", label: "Island" },
};

export const INDIA_STATES: StateData[] = [
  {
    name: "Andaman and Nicobar Islands",
    code: "AN",
    type: "UT",
    capital: "Port Blair",
    capitalCoords: [92.7265, 11.6234],
    region: "island",
    area: 8249,
    neighbors: [],
    majorRivers: [],
    mountainRanges: ["Saddle Peak"],
    nationalParks: ["Campbell Bay NP", "Mahatma Gandhi Marine NP", "Mount Harriet NP", "Rani Jhansi Marine NP", "Saddle Peak NP"],
    keyFacts: [
      "Only active volcano in India — Barren Island",
      "Indira Point — southernmost point of India",
      "Home to Jarawa and Sentinelese tribes",
      "Separated by Ten Degree Channel",
    ],
  },
  {
    name: "Andhra Pradesh",
    code: "AP",
    type: "State",
    capital: "Amaravati",
    capitalCoords: [80.515, 16.5062],
    region: "eastern-coast",
    area: 162968,
    neighbors: ["Telangana", "Karnataka", "Tamil Nadu", "Odisha", "Chhattisgarh"],
    majorRivers: ["Godavari", "Krishna", "Penner", "Tungabhadra"],
    mountainRanges: ["Eastern Ghats", "Nallamala Hills"],
    nationalParks: ["Sri Venkateswara NP", "Rajiv Gandhi NP (Rishi Valley)"],
    keyFacts: [
      "Longest coastline among all states (974 km)",
      "Tirupati — richest temple in the world",
      "Kuchipudi classical dance originated here",
      "Major rice producing state (Rice Bowl of India — shared with Tamil Nadu)",
    ],
  },
  {
    name: "Arunachal Pradesh",
    code: "AR",
    type: "State",
    capital: "Itanagar",
    capitalCoords: [93.6166, 27.0844],
    region: "northeast",
    area: 83743,
    neighbors: ["Assam", "Nagaland"],
    majorRivers: ["Brahmaputra (Siang)", "Kameng", "Subansiri", "Lohit", "Dibang"],
    mountainRanges: ["Eastern Himalayas", "Mishmi Hills", "Patkai Range"],
    nationalParks: ["Namdapha NP", "Mouling NP"],
    keyFacts: [
      "Easternmost state — first to see sunrise in India",
      "Largest state in Northeast India",
      "Home to 26 major tribes and over 100 sub-tribes",
      "Tawang Monastery — largest in India, 2nd largest Buddhist monastery in world",
    ],
  },
  {
    name: "Assam",
    code: "AS",
    type: "State",
    capital: "Dispur",
    capitalCoords: [91.7898, 26.1445],
    region: "northeast",
    area: 78438,
    neighbors: ["Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura", "Meghalaya", "West Bengal"],
    majorRivers: ["Brahmaputra", "Barak", "Manas", "Subansiri"],
    mountainRanges: ["Karbi Anglong Hills", "North Cachar Hills"],
    nationalParks: ["Kaziranga NP", "Manas NP", "Dibru-Saikhowa NP", "Nameri NP", "Orang NP"],
    keyFacts: [
      "Kaziranga — one-horned rhinoceros (UNESCO World Heritage)",
      "Majuli — largest river island in the world",
      "Largest tea-producing state in India",
      "Gateway to Northeast India",
    ],
  },
  {
    name: "Bihar",
    code: "BR",
    type: "State",
    capital: "Patna",
    capitalCoords: [85.1376, 25.5941],
    region: "indo-gangetic",
    area: 94163,
    neighbors: ["Uttar Pradesh", "Jharkhand", "West Bengal"],
    majorRivers: ["Ganga", "Gandak", "Kosi", "Son", "Bagmati"],
    mountainRanges: [],
    nationalParks: ["Valmiki NP"],
    keyFacts: [
      "Nalanda — oldest university in the world",
      "Bodh Gaya — where Buddha attained enlightenment (UNESCO)",
      "Birthplace of Jainism (Mahavira) and Buddhism (near Bodh Gaya)",
      "Chhath Puja — unique sun worship festival",
    ],
  },
  {
    name: "Chandigarh",
    code: "CH",
    type: "UT",
    capital: "Chandigarh",
    capitalCoords: [76.7794, 30.7333],
    region: "indo-gangetic",
    area: 114,
    neighbors: ["Punjab", "Haryana"],
    majorRivers: [],
    mountainRanges: ["Shivalik foothills"],
    nationalParks: [],
    keyFacts: [
      "Planned city designed by Le Corbusier",
      "Joint capital of Punjab and Haryana",
      "Capitol Complex — UNESCO World Heritage Site",
    ],
  },
  {
    name: "Chhattisgarh",
    code: "CG",
    type: "State",
    capital: "Raipur",
    capitalCoords: [81.6296, 21.2514],
    region: "central",
    area: 135192,
    neighbors: ["Madhya Pradesh", "Maharashtra", "Telangana", "Andhra Pradesh", "Odisha", "Jharkhand", "Uttar Pradesh"],
    majorRivers: ["Mahanadi", "Indravati", "Godavari", "Son"],
    mountainRanges: ["Maikal Range", "Satpura Range"],
    nationalParks: ["Indravati NP", "Kanger Valley NP", "Guru Ghasidas NP"],
    keyFacts: [
      "Rich in mineral resources — iron ore, coal, bauxite",
      "Chitrakote Falls — widest waterfall in India (Niagara of India)",
      "Dense Sal forests and tribal population",
      "Carved out of Madhya Pradesh in 2000",
    ],
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    code: "DN",
    type: "UT",
    capital: "Daman",
    capitalCoords: [72.8397, 20.397],
    region: "western-coast",
    area: 603,
    neighbors: ["Gujarat", "Maharashtra"],
    majorRivers: ["Daman Ganga"],
    mountainRanges: ["Western Ghats foothills"],
    nationalParks: [],
    keyFacts: [
      "Merged into single UT in 2020 (formerly two separate UTs)",
      "Former Portuguese colony until 1961",
      "Diu is an island; Daman and Silvassa on the mainland",
      "Major tribal population — Warli, Kokna, Dhodia",
    ],
  },
  {
    name: "Delhi",
    code: "DL",
    type: "UT",
    capital: "New Delhi",
    capitalCoords: [77.209, 28.6139],
    region: "indo-gangetic",
    area: 1484,
    neighbors: ["Haryana", "Uttar Pradesh"],
    majorRivers: ["Yamuna"],
    mountainRanges: ["Delhi Ridge (Aravalli extension)"],
    nationalParks: [],
    keyFacts: [
      "National capital — seat of all three branches of government",
      "Red Fort, Qutub Minar, Humayun's Tomb — UNESCO sites",
      "Delhi Ridge — northernmost extension of the Aravalli Range",
      "Most densely populated UT",
    ],
  },
  {
    name: "Goa",
    code: "GA",
    type: "State",
    capital: "Panaji",
    capitalCoords: [73.8278, 15.4909],
    region: "western-coast",
    area: 3702,
    neighbors: ["Maharashtra", "Karnataka"],
    majorRivers: ["Mandovi", "Zuari"],
    mountainRanges: ["Western Ghats"],
    nationalParks: ["Mollem NP (Bhagwan Mahaveer)"],
    keyFacts: [
      "Smallest state by area",
      "Highest per-capita income among Indian states",
      "Former Portuguese colony (liberated 1961)",
      "Old Goa churches — UNESCO World Heritage",
    ],
  },
  {
    name: "Gujarat",
    code: "GJ",
    type: "State",
    capital: "Gandhinagar",
    capitalCoords: [72.6369, 23.2156],
    region: "western-desert",
    area: 196024,
    neighbors: ["Rajasthan", "Madhya Pradesh", "Maharashtra", "Dadra and Nagar Haveli and Daman and Diu"],
    majorRivers: ["Narmada", "Tapi", "Sabarmati", "Mahi"],
    mountainRanges: ["Girnar Hills", "Aravalli extension", "Satpura extension"],
    nationalParks: ["Gir NP", "Velavadar NP", "Marine NP (Gulf of Kutch)", "Vansda NP"],
    keyFacts: [
      "Only home of Asiatic Lion (Gir)",
      "Longest coastline in India (1,600 km)",
      "Rann of Kutch — largest salt desert in the world",
      "Statue of Unity — tallest statue in the world (182m)",
    ],
  },
  {
    name: "Haryana",
    code: "HR",
    type: "State",
    capital: "Chandigarh",
    capitalCoords: [76.7794, 30.7333],
    region: "indo-gangetic",
    area: 44212,
    neighbors: ["Punjab", "Himachal Pradesh", "Uttar Pradesh", "Rajasthan", "Delhi"],
    majorRivers: ["Yamuna", "Ghaggar", "Markanda"],
    mountainRanges: ["Shivalik Hills", "Aravalli (southern tip)"],
    nationalParks: ["Sultanpur NP", "Kalesar NP"],
    keyFacts: [
      "Surrounds Delhi on three sides",
      "Kurukshetra — Mahabharata battlefield",
      "Major contributor to Green Revolution",
      "Shares capital Chandigarh with Punjab",
    ],
  },
  {
    name: "Himachal Pradesh",
    code: "HP",
    type: "State",
    capital: "Shimla",
    capitalCoords: [77.1734, 31.1048],
    region: "himalayan",
    area: 55673,
    neighbors: ["Jammu and Kashmir", "Punjab", "Haryana", "Uttarakhand", "Uttar Pradesh"],
    majorRivers: ["Beas", "Sutlej", "Ravi", "Chenab", "Yamuna"],
    mountainRanges: ["Great Himalayas", "Pir Panjal", "Dhauladhar", "Shivalik"],
    nationalParks: ["Great Himalayan NP (UNESCO)", "Pin Valley NP", "Khirganga NP"],
    keyFacts: [
      "Great Himalayan NP — UNESCO World Heritage Site",
      "All 5 rivers of Punjab originate from or flow through HP",
      "Rohtang Pass connects Kullu to Lahaul-Spiti",
      "Apple state of India (largest producer)",
    ],
  },
  {
    name: "Jammu and Kashmir",
    code: "JK",
    type: "UT",
    capital: "Srinagar / Jammu",
    capitalCoords: [74.7973, 34.0837],
    region: "himalayan",
    area: 163040,
    neighbors: ["Ladakh", "Himachal Pradesh", "Punjab"],
    majorRivers: ["Jhelum", "Chenab", "Indus", "Ravi", "Tawi"],
    mountainRanges: ["Great Himalayas", "Pir Panjal", "Karakoram", "Zaskar"],
    nationalParks: ["Dachigam NP", "Hemis NP", "Kishtwar NP", "Salim Ali NP"],
    keyFacts: [
      "Reorganized as UT in 2019 (Ladakh separated)",
      "Dal Lake — iconic houseboat tourism",
      "Pashmina wool — finest cashmere in the world",
      "Pir Panjal Range separates Jammu from Kashmir Valley",
    ],
  },
  {
    name: "Ladakh",
    code: "LA",
    type: "UT",
    capital: "Leh",
    capitalCoords: [77.577, 34.1526],
    region: "himalayan",
    area: 59146,
    neighbors: ["Jammu and Kashmir", "Himachal Pradesh"],
    majorRivers: ["Indus", "Zanskar", "Shyok", "Nubra"],
    mountainRanges: ["Karakoram", "Ladakh Range", "Zaskar Range", "Great Himalayas"],
    nationalParks: ["Hemis NP"],
    keyFacts: [
      "Created as UT in 2019 (carved from J&K)",
      "Highest motorable pass — Umlingla (19,024 ft)",
      "Pangong Tso Lake — extends into China",
      "Siachen Glacier — highest battlefield in the world",
    ],
  },
  {
    name: "Lakshadweep",
    code: "LD",
    type: "UT",
    capital: "Kavaratti",
    capitalCoords: [72.6358, 10.5593],
    region: "island",
    area: 32,
    neighbors: [],
    majorRivers: [],
    mountainRanges: [],
    nationalParks: [],
    keyFacts: [
      "Smallest UT by area (32 sq km)",
      "All islands are coral atolls",
      "Only coral islands of India",
      "100% Muslim majority UT",
    ],
  },
  {
    name: "Jharkhand",
    code: "JH",
    type: "State",
    capital: "Ranchi",
    capitalCoords: [85.3096, 23.3441],
    region: "central",
    area: 79716,
    neighbors: ["Bihar", "West Bengal", "Odisha", "Chhattisgarh", "Uttar Pradesh"],
    majorRivers: ["Damodar", "Subarnarekha", "Barakar", "South Koel"],
    mountainRanges: ["Chota Nagpur Plateau", "Rajmahal Hills", "Parasnath Hills"],
    nationalParks: ["Betla NP"],
    keyFacts: [
      "Carved from Bihar in 2000 — mineral rich",
      "Chota Nagpur Plateau — rich in coal, iron, mica",
      "Parasnath Hill — highest in Jharkhand, Jain pilgrimage",
      "40% of India's mineral reserves",
    ],
  },
  {
    name: "Karnataka",
    code: "KA",
    type: "State",
    capital: "Bengaluru",
    capitalCoords: [77.5946, 12.9716],
    region: "southern-plateau",
    area: 191791,
    neighbors: ["Maharashtra", "Goa", "Kerala", "Tamil Nadu", "Andhra Pradesh"],
    majorRivers: ["Kaveri", "Krishna", "Tungabhadra", "Sharavathi"],
    mountainRanges: ["Western Ghats", "Baba Budan Hills"],
    nationalParks: ["Bandipur NP", "Nagarahole NP", "Bannerghatta NP", "Kudremukh NP", "Anshi NP"],
    keyFacts: [
      "IT capital of India (Bengaluru)",
      "Hampi — ruins of Vijayanagara Empire (UNESCO)",
      "Jog Falls — second-highest plunge waterfall in India",
      "Largest producer of coffee and silk in India",
    ],
  },
  {
    name: "Kerala",
    code: "KL",
    type: "State",
    capital: "Thiruvananthapuram",
    capitalCoords: [76.9366, 8.5241],
    region: "western-coast",
    area: 38863,
    neighbors: ["Karnataka", "Tamil Nadu"],
    majorRivers: ["Periyar", "Bharathapuzha", "Pamba", "Chaliyar"],
    mountainRanges: ["Western Ghats", "Cardamom Hills", "Anamalai Hills"],
    nationalParks: ["Periyar NP", "Silent Valley NP", "Eravikulam NP", "Anamudi Shola NP", "Mathikettan Shola NP"],
    keyFacts: [
      "First state to achieve 100% literacy (1991)",
      "Backwaters — extensive inland waterway network",
      "Spice Garden of India",
      "Highest HDI among Indian states",
    ],
  },
  {
    name: "Madhya Pradesh",
    code: "MP",
    type: "State",
    capital: "Bhopal",
    capitalCoords: [77.4126, 23.2599],
    region: "central",
    area: 308252,
    neighbors: ["Uttar Pradesh", "Chhattisgarh", "Maharashtra", "Gujarat", "Rajasthan"],
    majorRivers: ["Narmada", "Tapi", "Chambal", "Betwa", "Son", "Ken"],
    mountainRanges: ["Vindhya Range", "Satpura Range", "Maikal Hills"],
    nationalParks: ["Kanha NP", "Bandhavgarh NP", "Pench NP", "Satpura NP", "Panna NP", "Sanjay NP"],
    keyFacts: [
      "Largest state by area (after Rajasthan — 2nd)",
      "Tiger State of India — most tigers",
      "Narmada flows westward (exception to peninsular rivers)",
      "Khajuraho temples, Sanchi Stupa, Bhimbetka caves — UNESCO sites",
    ],
  },
  {
    name: "Maharashtra",
    code: "MH",
    type: "State",
    capital: "Mumbai",
    capitalCoords: [72.8777, 19.076],
    region: "western-coast",
    area: 307713,
    neighbors: ["Gujarat", "Madhya Pradesh", "Chhattisgarh", "Andhra Pradesh", "Karnataka", "Goa"],
    majorRivers: ["Godavari", "Krishna", "Tapi", "Bhima", "Wardha"],
    mountainRanges: ["Western Ghats (Sahyadri)", "Satpura Range"],
    nationalParks: ["Sanjay Gandhi NP", "Tadoba NP", "Navegaon NP", "Chandoli NP"],
    keyFacts: [
      "Financial capital of India (Mumbai)",
      "Ajanta & Ellora Caves — UNESCO World Heritage",
      "Largest economy among Indian states",
      "Western Ghats called Sahyadri in Maharashtra",
    ],
  },
  {
    name: "Manipur",
    code: "MN",
    type: "State",
    capital: "Imphal",
    capitalCoords: [93.9368, 24.817],
    region: "northeast",
    area: 22327,
    neighbors: ["Nagaland", "Assam", "Mizoram"],
    majorRivers: ["Barak", "Manipur"],
    mountainRanges: ["Patkai Range", "Naga Hills"],
    nationalParks: ["Keibul Lamjao NP", "Sirohi NP"],
    keyFacts: [
      "Keibul Lamjao — only floating national park in the world",
      "Loktak Lake — largest freshwater lake in NE India",
      "Sangai deer (dancing deer) — found only here",
      "Polo originated in Manipur",
    ],
  },
  {
    name: "Meghalaya",
    code: "ML",
    type: "State",
    capital: "Shillong",
    capitalCoords: [91.8933, 25.5788],
    region: "northeast",
    area: 22429,
    neighbors: ["Assam"],
    majorRivers: ["Umngot", "Myntdu", "Simsang"],
    mountainRanges: ["Khasi Hills", "Garo Hills", "Jaintia Hills"],
    nationalParks: ["Balpakram NP", "Nokrek NP"],
    keyFacts: [
      "Wettest place on Earth — Mawsynram & Cherrapunji",
      "Abode of Clouds (Meghalaya means 'abode of clouds')",
      "Living root bridges — bioengineering marvel",
      "Matrilineal society (Khasi and Garo tribes)",
    ],
  },
  {
    name: "Mizoram",
    code: "MZ",
    type: "State",
    capital: "Aizawl",
    capitalCoords: [92.7176, 23.7271],
    region: "northeast",
    area: 21081,
    neighbors: ["Manipur", "Assam", "Tripura"],
    majorRivers: ["Tlawng", "Tiau", "Chhimtuipui"],
    mountainRanges: ["Mizo Hills (Lushai Hills)", "Patkai Range"],
    nationalParks: ["Murlen NP", "Phawngpui NP"],
    keyFacts: [
      "Second most literate state (after Kerala)",
      "International border with Myanmar and Bangladesh",
      "Bamboo flowering triggers rat floods (Mautam cycle)",
      "Blue Mountain (Phawngpui) — highest peak",
    ],
  },
  {
    name: "Nagaland",
    code: "NL",
    type: "State",
    capital: "Kohima",
    capitalCoords: [94.1086, 25.6751],
    region: "northeast",
    area: 16579,
    neighbors: ["Assam", "Arunachal Pradesh", "Manipur"],
    majorRivers: ["Doyang", "Dhansiri"],
    mountainRanges: ["Naga Hills", "Patkai Range"],
    nationalParks: ["Intanki NP"],
    keyFacts: [
      "Hornbill Festival — 'Festival of Festivals'",
      "Home to 16 major Naga tribes",
      "Dzukou Valley — Valley of Flowers of the Northeast",
      "Kohima — site of pivotal WWII battle (Battle of Kohima)",
    ],
  },
  {
    name: "Odisha",
    code: "OD",
    type: "State",
    capital: "Bhubaneswar",
    capitalCoords: [85.8245, 20.2961],
    region: "eastern-coast",
    area: 155707,
    neighbors: ["West Bengal", "Jharkhand", "Chhattisgarh", "Andhra Pradesh"],
    majorRivers: ["Mahanadi", "Brahmani", "Baitarani", "Rushikulya", "Subarnarekha"],
    mountainRanges: ["Eastern Ghats"],
    nationalParks: ["Bhitarkanika NP", "Simlipal NP"],
    keyFacts: [
      "Konark Sun Temple — UNESCO World Heritage",
      "Chilika Lake — largest brackish water lagoon in India",
      "Olive Ridley turtle nesting at Gahirmatha",
      "Jagannath Temple, Puri — one of Char Dham",
    ],
  },
  {
    name: "Puducherry",
    code: "PY",
    type: "UT",
    capital: "Puducherry",
    capitalCoords: [79.8083, 11.9416],
    region: "eastern-coast",
    area: 479,
    neighbors: ["Tamil Nadu", "Kerala", "Andhra Pradesh"],
    majorRivers: [],
    mountainRanges: [],
    nationalParks: [],
    keyFacts: [
      "Former French colony (until 1954)",
      "4 non-contiguous districts across 3 states",
      "Auroville — international township for human unity",
      "Karaikal, Mahe, Yanam are its other regions",
    ],
  },
  {
    name: "Punjab",
    code: "PB",
    type: "State",
    capital: "Chandigarh",
    capitalCoords: [76.7794, 30.7333],
    region: "indo-gangetic",
    area: 50362,
    neighbors: ["Jammu and Kashmir", "Himachal Pradesh", "Haryana", "Rajasthan"],
    majorRivers: ["Sutlej", "Beas", "Ravi", "Ghaggar"],
    mountainRanges: ["Shivalik foothills"],
    nationalParks: [],
    keyFacts: [
      "Land of Five Rivers (Punj = five, Ab = water)",
      "Granary of India — largest wheat producer",
      "Golden Temple, Amritsar — holiest Sikh shrine",
      "Jallianwala Bagh — site of 1919 massacre",
    ],
  },
  {
    name: "Rajasthan",
    code: "RJ",
    type: "State",
    capital: "Jaipur",
    capitalCoords: [75.7873, 26.9124],
    region: "western-desert",
    area: 342239,
    neighbors: ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Gujarat"],
    majorRivers: ["Chambal", "Luni", "Banas", "Mahi"],
    mountainRanges: ["Aravalli Range"],
    nationalParks: ["Ranthambore NP", "Sariska NP", "Desert NP", "Keoladeo Ghana NP (UNESCO)", "Mukundra Hills NP"],
    keyFacts: [
      "Largest state by area (342,239 sq km)",
      "Thar Desert — largest desert in India",
      "Aravalli Range — oldest fold mountains in the world",
      "Keoladeo NP (Bharatpur) — UNESCO World Heritage, major bird sanctuary",
    ],
  },
  {
    name: "Sikkim",
    code: "SK",
    type: "State",
    capital: "Gangtok",
    capitalCoords: [88.6138, 27.3389],
    region: "himalayan",
    area: 7096,
    neighbors: ["West Bengal"],
    majorRivers: ["Teesta", "Rangit"],
    mountainRanges: ["Eastern Himalayas"],
    nationalParks: ["Khangchendzonga NP (UNESCO)"],
    keyFacts: [
      "Khangchendzonga — 3rd highest peak in the world (8,586m)",
      "First fully organic state in India",
      "Merged with India in 1975 (was a monarchy)",
      "Least populous state in India",
    ],
  },
  {
    name: "Tamil Nadu",
    code: "TN",
    type: "State",
    capital: "Chennai",
    capitalCoords: [80.2707, 13.0827],
    region: "southern-plateau",
    area: 130058,
    neighbors: ["Kerala", "Karnataka", "Andhra Pradesh", "Puducherry"],
    majorRivers: ["Kaveri", "Vaigai", "Palar", "Tamiraparani"],
    mountainRanges: ["Western Ghats (Nilgiris)", "Eastern Ghats", "Cardamom Hills", "Palani Hills"],
    nationalParks: ["Mudumalai NP", "Guindy NP", "Gulf of Mannar NP", "Indira Gandhi NP", "Mukurthi NP"],
    keyFacts: [
      "Oldest living classical language — Tamil",
      "Group of Monuments at Mahabalipuram — UNESCO",
      "Great Living Chola Temples — UNESCO",
      "Nilgiri Mountain Railway — UNESCO (part of Mountain Railways of India)",
    ],
  },
  {
    name: "Telangana",
    code: "TG",
    type: "State",
    capital: "Hyderabad",
    capitalCoords: [78.4867, 17.385],
    region: "southern-plateau",
    area: 112077,
    neighbors: ["Maharashtra", "Chhattisgarh", "Andhra Pradesh", "Karnataka"],
    majorRivers: ["Godavari", "Krishna", "Musi", "Manjira"],
    mountainRanges: ["Deccan Plateau"],
    nationalParks: ["Kasu Brahmananda Reddy NP", "Mrugavani NP", "Mahavir Harina Vanasthali NP"],
    keyFacts: [
      "Newest state — formed in 2014 (carved from Andhra Pradesh)",
      "Hyderabad is joint capital with AP (until 2024)",
      "IT hub — Cyberabad (HITEC City)",
      "Charminar, Golconda Fort — historic landmarks",
    ],
  },
  {
    name: "Tripura",
    code: "TR",
    type: "State",
    capital: "Agartala",
    capitalCoords: [91.2868, 23.8315],
    region: "northeast",
    area: 10486,
    neighbors: ["Assam", "Mizoram"],
    majorRivers: ["Gomti", "Manu", "Khowai", "Haora"],
    mountainRanges: ["Jampui Hills"],
    nationalParks: ["Clouded Leopard NP", "Rajbari NP"],
    keyFacts: [
      "Bordered by Bangladesh on three sides",
      "Ujjayanta Palace — former royal palace",
      "Second smallest state in NE India",
      "Natural gas reserves — significant producer",
    ],
  },
  {
    name: "Uttar Pradesh",
    code: "UP",
    type: "State",
    capital: "Lucknow",
    capitalCoords: [80.9462, 26.8467],
    region: "indo-gangetic",
    area: 240928,
    neighbors: ["Uttarakhand", "Himachal Pradesh", "Haryana", "Rajasthan", "Madhya Pradesh", "Chhattisgarh", "Bihar", "Jharkhand"],
    majorRivers: ["Ganga", "Yamuna", "Gomti", "Ghaghra", "Chambal", "Betwa", "Ken"],
    mountainRanges: [],
    nationalParks: ["Dudhwa NP"],
    keyFacts: [
      "Most populous state in India (200M+)",
      "Taj Mahal (Agra), Fatehpur Sikri — UNESCO sites",
      "Prayagraj — confluence (Sangam) of Ganga, Yamuna, Saraswati",
      "Maximum Lok Sabha seats (80)",
    ],
  },
  {
    name: "Uttarakhand",
    code: "UK",
    type: "State",
    capital: "Dehradun",
    capitalCoords: [78.0322, 30.3165],
    region: "himalayan",
    area: 53483,
    neighbors: ["Himachal Pradesh", "Uttar Pradesh"],
    majorRivers: ["Ganga", "Yamuna", "Bhagirathi", "Alaknanda", "Mandakini"],
    mountainRanges: ["Great Himalayas", "Shivalik", "Lesser Himalayas"],
    nationalParks: ["Jim Corbett NP", "Nanda Devi NP (UNESCO)", "Valley of Flowers NP (UNESCO)", "Rajaji NP", "Gangotri NP", "Govind NP"],
    keyFacts: [
      "Dev Bhoomi — Land of Gods",
      "Jim Corbett — first national park of India (1936)",
      "Valley of Flowers & Nanda Devi — UNESCO World Heritage",
      "Char Dham: Badrinath, Kedarnath, Gangotri, Yamunotri",
    ],
  },
  {
    name: "West Bengal",
    code: "WB",
    type: "State",
    capital: "Kolkata",
    capitalCoords: [88.3639, 22.5726],
    region: "eastern-coast",
    area: 88752,
    neighbors: ["Bihar", "Jharkhand", "Odisha", "Sikkim", "Assam"],
    majorRivers: ["Ganga (Hooghly)", "Teesta", "Damodar", "Ajay", "Mahananda"],
    mountainRanges: ["Darjeeling Himalayas"],
    nationalParks: ["Sundarbans NP (UNESCO)", "Neora Valley NP", "Singalila NP", "Buxa NP", "Gorumara NP", "Jaldapara NP"],
    keyFacts: [
      "Sundarbans — largest mangrove forest in the world (UNESCO)",
      "Darjeeling Himalayan Railway — UNESCO World Heritage",
      "Cultural capital of India — Kolkata",
      "Kolkata (Calcutta) was capital of British India until 1911",
    ],
  },
];

/** Quick lookup map: NAME_1 → StateData */
export const STATE_BY_NAME: Record<string, StateData> = {};
for (const s of INDIA_STATES) {
  STATE_BY_NAME[s.name] = s;
}

/** Get region for a state name (fallback for states not in our list) */
export function getStateRegion(name: string): PhysicalRegion {
  return STATE_BY_NAME[name]?.region ?? "central";
}

// ── Quiz question types ─────────────────────────────────────────────────────────

export type QuizQuestionType = "identify" | "identify_feature" | "capital" | "river" | "neighbor" | "fact";

export type MapQuizQuestion = {
  type: QuizQuestionType;
  prompt: string;
  /** For "identify" — the correct state name to click */
  correctState?: string;
  /** For "identify_feature" — the correct feature properties to match */
  correctFeature?: any;
  options?: string[];
  correctOption?: string;
};

/** Generate a random quiz question from the state data */
export function generateQuizQuestion(exclude?: string[]): MapQuizQuestion {
  const available = INDIA_STATES.filter(
    (s) => s.type === "State" && !(exclude ?? []).includes(s.name)
  );
  if (available.length === 0) return generateQuizQuestion(); // reset

  const types: QuizQuestionType[] = ["identify", "capital", "river", "neighbor", "fact"];
  const type = types[Math.floor(Math.random() * types.length)]!;
  const state = available[Math.floor(Math.random() * available.length)]!;

  switch (type) {
    case "identify":
      return {
        type: "identify",
        prompt: `Click on ${state.name}`,
        correctState: state.name,
      };

    case "identify_feature": {
      // Not implemented randomly in the general pool yet because we will feed this from a specialized generator
      return {
        type: "identify",
        prompt: `Click on ${state.name}`,
        correctState: state.name,
      };
    }

    case "capital": {
      const wrong = available
        .filter((s) => s.name !== state.name && s.capital !== state.capital)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((s) => s.capital);
      const options = [...wrong, state.capital].sort(() => Math.random() - 0.5);
      return {
        type: "capital",
        prompt: `What is the capital of ${state.name}?`,
        options,
        correctOption: state.capital,
        correctState: state.name,
      };
    }

    case "river": {
      if (state.majorRivers.length === 0) {
        return generateQuizQuestion(exclude);
      }
      const river = state.majorRivers[Math.floor(Math.random() * state.majorRivers.length)]!;
      const wrongStates = available
        .filter((s) => s.name !== state.name && !s.majorRivers.includes(river))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((s) => s.name);
      const options = [...wrongStates, state.name].sort(() => Math.random() - 0.5);
      return {
        type: "river",
        prompt: `Which state does the ${river} flow through?`,
        options,
        correctOption: state.name,
        correctState: state.name,
      };
    }

    case "neighbor": {
      if (state.neighbors.length === 0) {
        return generateQuizQuestion(exclude);
      }
      const neighbor = state.neighbors[Math.floor(Math.random() * state.neighbors.length)]!;
      const wrongNeighbors = available
        .filter((s) => s.name !== state.name && !state.neighbors.includes(s.name))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((s) => s.name);
      const options = [...wrongNeighbors, neighbor].sort(() => Math.random() - 0.5);
      return {
        type: "neighbor",
        prompt: `Which of these borders ${state.name}?`,
        options,
        correctOption: neighbor,
        correctState: state.name,
      };
    }

    case "fact": {
      if (state.keyFacts.length === 0) {
        return generateQuizQuestion(exclude);
      }
      const fact = state.keyFacts[Math.floor(Math.random() * state.keyFacts.length)]!;
      const wrongStates = available
        .filter((s) => s.name !== state.name)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((s) => s.name);
      const options = [...wrongStates, state.name].sort(() => Math.random() - 0.5);
      return {
        type: "fact",
        prompt: `Which state: "${fact}"?`,
        options,
        correctOption: state.name,
        correctState: state.name,
      };
    }
  }
}

// ── Spaced repetition helpers (simplified FSRS) ─────────────────────────────────

export type StateMemory = {
  state: string;
  correct: number;
  incorrect: number;
  lastReviewed: number; // timestamp
  interval: number; // days until next review
  ease: number; // 1.3 – 3.0
};

const STORAGE_KEY = "geography-memory";

export function loadMemory(): Record<string, StateMemory> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StateMemory>) : {};
  } catch {
    return {};
  }
}

export function saveMemory(memory: Record<string, StateMemory>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function updateMemory(
  memory: Record<string, StateMemory>,
  stateName: string,
  wasCorrect: boolean
): Record<string, StateMemory> {
  const existing = memory[stateName] ?? {
    state: stateName,
    correct: 0,
    incorrect: 0,
    lastReviewed: Date.now(),
    interval: 1,
    ease: 2.5,
  };

  const now = Date.now();

  if (wasCorrect) {
    existing.correct += 1;
    existing.ease = Math.min(3.0, existing.ease + 0.1);
    existing.interval = Math.ceil(existing.interval * existing.ease);
  } else {
    existing.incorrect += 1;
    existing.ease = Math.max(1.3, existing.ease - 0.2);
    existing.interval = 1;
  }
  existing.lastReviewed = now;

  return { ...memory, [stateName]: existing };
}

/** Returns a 0-1 strength score (1 = strong, 0 = forgotten) */
export function getMemoryStrength(mem: StateMemory | undefined): number {
  if (!mem) return 0;
  const daysSince = (Date.now() - mem.lastReviewed) / (1000 * 60 * 60 * 24);
  const ratio = daysSince / mem.interval;
  // Exponential decay
  return Math.max(0, Math.min(1, Math.exp(-0.5 * ratio)));
}
