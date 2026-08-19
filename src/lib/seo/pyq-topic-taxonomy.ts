import { fetchSearchablePyqQuestions } from "@/lib/supabase/questions";
import type { SearchablePyqQuestion } from "@/lib/supabase/questions";
import {
  PYQ_SUBJECTS,
  SUBJECT_SLUGS,
  type PyqSeoSubject,
} from "@/lib/seo/pyq-seo";

export const MIN_INDEXABLE_CANONICAL_TOPIC_QUESTIONS = 10;
export const MIN_INDEXABLE_CANONICAL_TOPIC_YEARS = 3;
export const REPRESENTATIVE_TOPIC_QUESTION_LIMIT = 10;

export type CanonicalPyqTopicRule = {
  slug: string;
  label: string;
  overview: string;
  topic: RegExp;
  broadSubTopic?: RegExp;
};

export type CanonicalTopicCount = {
  name: string;
  count: number;
};

export type CanonicalTopicYearCount = {
  year: number;
  count: number;
};

export type CanonicalPyqTopicGroup = {
  subject: PyqSeoSubject;
  subjectSlug: string;
  rule: CanonicalPyqTopicRule;
  count: number;
  representedYears: number;
  earliestYear: number;
  latestYear: number;
  yearCounts: CanonicalTopicYearCount[];
  rawTopicCounts: CanonicalTopicCount[];
  rawSubTopicCounts: CanonicalTopicCount[];
  conceptCounts: CanonicalTopicCount[];
  representativeQuestions: SearchablePyqQuestion[];
  questions: SearchablePyqQuestion[];
};

const GENERIC_TOPIC: Record<PyqSeoSubject, RegExp> = {
  History:
    /^(?:Ancient History|Ancient India|Ancient Indian History|Ancient\/Medieval History|Ancient\/Medieval Indian History|Ancient & Medieval Indian History|Medieval History|Medieval Indian History|Modern History|Modern Indian History|Modern Indian History & National Days)$/i,
  Geography:
    /^(?:Indian Geography|Physical Geography|World Geography|Economic Geography)$/i,
  Polity:
    /^(?:Indian Polity|Polity|Polity General|Constitutional Framework|Constitutional Schedules|Schedules of the Constitution|Schedules of the Indian Constitution)$/i,
  Economy:
    /^(?:Indian Economy|Financial Sector|International Organizations|Reports and Indices)$/i,
  Environment:
    /^(?:Environment & Ecology|General Science|Biodiversity & Conservation|Ecology)$/i,
  Science:
    /^(?:Science & Technology|Emerging Technologies|Environmental Science)$/i,
  "Current Affairs": /a^/,
};

export const CANONICAL_PYQ_TOPIC_RULES: Record<
  PyqSeoSubject,
  readonly CanonicalPyqTopicRule[]
> = {
  History: [
    {
      slug: "religion-philosophy",
      label: "Religion & Philosophy",
      overview:
        "This cluster traces the religious traditions, philosophical schools, texts, and institutions that UPSC repeatedly connects to ancient and medieval Indian history.",
      topic:
        /^(?:Ancient and Medieval Indian Religions|Ancient Indian Philosophy|Ancient Indian Religions|Buddhist Architecture and Sites|Bhakti and Sufi Movements)$/i,
      broadSubTopic:
        /(?:buddh|jain|religio|philosoph|bhakti|sufi|heterodox|dhamma|upanishad|vedic literature|hindu law schools?)/i,
    },
    {
      slug: "freedom-struggle",
      label: "Freedom Struggle",
      overview:
        "These questions cover the organizations, leaders, movements, negotiations, and social reform currents that shaped India’s struggle against colonial rule.",
      topic:
        /^(?:Indian National Movement|Non-Cooperation Movement|Socio-Religious Reform Movements|Tribal Uprisings)$/i,
      broadSubTopic:
        /(?:national movement|freedom struggle|gandh|congress|swadeshi|partition|revolutionary|quit india|non-cooperation|civil disobedience|satyagraha|home rule|reform movements?|reformers?|uprisings?|revolts?|ghadar|ina\b|cabinet mission|cripps mission|rowlatt|dalit upliftment|peasant movements?)/i,
    },
    {
      slug: "art-culture",
      label: "Art & Culture",
      overview:
        "This collection brings together UPSC questions on architecture, literature, music, dance, painting, crafts, languages, heritage, and other expressions of Indian culture.",
      topic:
        /(?:\bArt\b|Culture|Performing Arts|Literature|Paintings|Architecture|Foreign Travellers|Festivals|Calendar|Classical Music|Folk Arts|Temple Architecture|Languages)/i,
      broadSubTopic:
        /(?:\bart\b|architecture|paintings?|sculpture|classical|folk|dances?|music|crafts?|textiles?|festivals?|calendar|languages?|literature|heritage|traditions?|travellers?|stupas?|caves?)/i,
    },
    {
      slug: "modern-colonial-india",
      label: "Modern & Colonial India",
      overview:
        "This cluster examines European expansion, British administration, colonial economic and educational change, constitutional development, and early post-independence themes.",
      topic:
        /^(?:Modern History|Modern Indian History|Modern Indian History & National Days|Post-Independence India|Advent of Europeans|British Economic Policies|British Expansion in India|Constitutional History of India|Economic History of British India|Economic Impact of British Rule)$/i,
      broadSubTopic:
        /(?:post-independence|british|colonial|europeans?|east india company|charter act|government of india act|land revenue|subsidiary alliance|constitutional development|education under)/i,
    },
    {
      slug: "ancient-india",
      label: "Ancient India",
      overview:
        "These PYQs span the Indus and Vedic periods, mahajanapadas, Mauryan and Gupta rule, early southern kingdoms, society, economy, and administration.",
      topic: /(?:^Ancient|Ancient\/Medieval|^Indian Calendar System$)/i,
      broadSubTopic:
        /(?:harappan|indus valley|vedic|maurya|ashoka|gupta|mahajanapada|sangam|chola|pallava|prehistoric)/i,
    },
    {
      slug: "medieval-india",
      label: "Medieval India",
      overview:
        "This group focuses on the Sultanates, Mughal and Vijayanagara systems, regional kingdoms, medieval economy, administration, and social life.",
      topic: /(?:Medieval|Mughal|Vijayanagara|Vijayanagar)/i,
      broadSubTopic:
        /(?:mughal|sultanate|vijayanagara|vijayanagar|kakatiya|feudalism|regional kingdoms?)/i,
    },
  ],
  Geography: [
    {
      slug: "world-regional-geography",
      label: "World & Regional Geography",
      overview:
        "These questions test countries, borders, conflict regions, major basins, seas, latitudes, and the map relationships needed for world and regional geography.",
      topic:
        /^(?:World Geography|World Political Geography|Places in News|Mineral Resources of the World|Latitudes and Longitudes)$/i,
      broadSubTopic:
        /(?:countries|bordering|middle east|west asia|central asia|europe|africa|ukraine|south-east asia|international date line)/i,
    },
    {
      slug: "climatology-atmosphere",
      label: "Climatology & Atmosphere",
      overview:
        "This cluster covers atmospheric structure, radiation, circulation, monsoons, weather systems, cyclones, clouds, and the physical controls of climate.",
      topic:
        /^(?:Climatology(?: \/ Atmospheric Science| \/ Earth.s Movements| & Meteorology)?|Cloud Seeding|Physical Geography \/ Meteorology)$/i,
      broadSubTopic:
        /(?:atmospher|meteorolog|weather|monsoon|cyclones?|cloud|insolation|radiation balance|westerlies|western disturbances|jet streams?|iod\b|climate types?|dew formation)/i,
    },
    {
      slug: "oceanography-hydrosphere",
      label: "Oceanography & Hydrosphere",
      overview:
        "These PYQs connect ocean currents, tides, coasts, ocean-atmosphere interaction, and the global distribution and movement of water.",
      topic:
        /^(?:Oceanography|Ocean Currents|Oceanography & Climate Change|Hydrosphere|Coastal Geography)$/i,
      broadSubTopic:
        /(?:oceanography|ocean currents?|tidal|tides?\b|hydrosphere|ocean mean temperature)/i,
    },
    {
      slug: "rivers-water-resources",
      label: "Rivers & Water Resources",
      overview:
        "This collection follows Indian river systems, tributaries, drainage, lakes, glaciers, dams, reservoirs, wetlands, and water-resource projects.",
      topic:
        /^(?:Indian River Systems|Indian Rivers|Indian Drainage System|Water Resources and Infrastructure)$/i,
      broadSubTopic:
        /(?:river systems?|rivers?\b|drainage|dams?\b|reservoirs?|water resources?|watershed|lakes?\b|wetlands?|glaciers?)/i,
    },
    {
      slug: "agriculture-soils-vegetation",
      label: "Agriculture, Soils & Vegetation",
      overview:
        "These questions examine crops, irrigation, farming techniques, Indian soils, forest types, vegetation patterns, and their physical-geography setting.",
      topic: /(?:Agricultur|Soil Science|Indian Soils|Sustainable Agriculture)/i,
      broadSubTopic:
        /(?:agricultur|crops?|soil|irrigation|fertigation|forest types?|natural vegetation)/i,
    },
    {
      slug: "economic-geography-resources",
      label: "Economic Geography & Resources",
      overview:
        "This cluster covers minerals, energy, industry, transport, ports, power plants, and infrastructure through their location and resource relationships.",
      topic:
        /^(?:Economic Geography|Economic Geography \/ Agriculture|Energy Infrastructure|Energy Resources|Infrastructure & Connectivity Projects)$/i,
      broadSubTopic:
        /(?:minerals?|energy resources?|industr(?:y|ial)|power plants?|\bports?\b|highways?|transport|infrastructure|connectivity|shale gas|hydrocarbon)/i,
    },
    {
      slug: "indian-human-geography",
      label: "Indian & Human Geography",
      overview:
        "These PYQs combine Indian physiography and political geography with settlements, communities, boundaries, regional locations, and human-geography patterns.",
      topic:
        /^(?:Indian Geography|Indian Physical Geography|Physical Geography of India|Physiography of India|Political Map of India|Social Geography|Indian Geography \/ Anthropology|Indian Geography \/ Environment)$/i,
      broadSubTopic:
        /(?:human geography|cultural\/human geography|tribes?\b|anthropology|pastoral communities|pvtgs?|india)/i,
    },
    {
      slug: "physical-biogeography",
      label: "Physical Geography & Biogeography",
      overview:
        "This group brings together geomorphology, earth science, landforms, tectonic processes, mountains, ecosystems, and the distribution of life across space.",
      topic:
        /^(?:Physical Geography|Geomorphology|Geophysics|Earth Sciences|Biogeography|Environmental Geography|Environment \/ Physical Geography|Environment & Ecology)$/i,
      broadSubTopic:
        /(?:geomorphology|geophysics|earth.s (?:motions?|rotation|tilt|magnetic field)|continental drift|earthquake|weathering|landforms?|mountain systems?|solstices?|biogeography|ecosystems?|biomes?)/i,
    },
  ],
  Polity: [
    {
      slug: "rights-dpsp-duties",
      label: "Rights, DPSP & Duties",
      overview:
        "These questions examine Fundamental Rights, Directive Principles, Fundamental Duties, constitutional remedies, equality, liberty, and welfare-state obligations.",
      topic:
        /^(?:Directive Principles of State Policy(?: \(DPSP\))?|Fundamental Rights|Fundamental Duties|Fundamental Rights, DPSP and Fundamental Duties|Rights|Rights and Duties|Equality|Reservation Policy & Constitutional Articles|Education Policy & Legislation)$/i,
      broadSubTopic:
        /(?:fundamental rights?|directive principles|dpsp|fundamental duties|right to (?:equality|life|privacy|property|education)|right against exploitation|articles? 2[134]|welfare state|reservation)/i,
    },
    {
      slug: "judiciary-legal-system",
      label: "Judiciary & Legal System",
      overview:
        "This cluster covers the Supreme Court, judicial review, writs, jurisdiction, legal services, due process, criminal justice, and institutional checks on power.",
      topic:
        /(?:Judiciary|Supreme Court|Basic Structure & Judicial Review|Basic Structure & Judiciary|Constitutional Amendments & Judiciary|Indian Polity \/ Legal System|Indian Penal Code|Prison Administration)/i,
      broadSubTopic:
        /(?:judiciary|judicial|supreme court|high court|writs?\b|legal system|legal services|gram nyayalaya|contempt of court|due process|procedure established|criminal justice|custody|prison)/i,
    },
    {
      slug: "parliament-legislatures-elections",
      label: "Parliament, Legislatures & Elections",
      overview:
        "These PYQs test legislative procedure, parliamentary offices and control, the two Houses, state legislatures, representation, elections, and anti-defection rules.",
      topic:
        /(?:Parliament|State Legislature|Anti-Defection Law|^Elections$|Elections & Representation|Elections and Parliament Functioning)/i,
      broadSubTopic:
        /(?:\belections?\b|electoral|representation|delimitation|candidate eligibility|right to vote|fptp|rpa 1951|parliament|lok sabha|rajya sabha|money bill|finance bill|joint sitting|no-confidence|anti-defection|tenth schedule|legislative (?:procedure|council|assembly)|state legislature|presiding officers?|speaker|office of profit|mplads|private member.s bill)/i,
    },
    {
      slug: "constitutional-bodies-governance",
      label: "Constitutional Bodies & Governance",
      overview:
        "This collection focuses on constitutional and statutory institutions, commissions, regulators, public administration, accountability mechanisms, and governance reforms.",
      topic:
        /^(?:Constitutional Bodies|Constitutional and Non-Constitutional Bodies|Governance.*|Lokpal and Lokayuktas|Central Administration|Economic Planning|Government Schemes & Ministries|Indian Polity \/ Governance)$/i,
      broadSubTopic:
        /(?:constitutional (?:and non-constitutional )?bodies|statutory bodies|regulatory bodies|election commission|lokpal|niti aayog|planning commission|public administration|administrative reforms|government committees|government schemes|ministries)/i,
    },
    {
      slug: "executive",
      label: "Union & State Executive",
      overview:
        "These questions cover the President, Governors, councils of ministers, cabinet responsibility, ordinance and pardon powers, civil services, and state administration.",
      topic:
        /^(?:Executive|Union Executive|State Executive|President of India|Ordinance Making Power|State Administration|State Executive and Legislature|State Legislature & Executive|Forms of Government)$/i,
      broadSubTopic:
        /(?:union executive|state executive|president|presidential election|governors?|ordinance|council of ministers|cabinet|civil services|chief secretary|collective responsibility|pardoning power)/i,
    },
    {
      slug: "federalism-local-government",
      label: "Federalism & Local Government",
      overview:
        "This cluster examines Centre-State relations, federal features, scheduled areas, states and territories, Panchayati Raj, and other local-government arrangements.",
      topic:
        /^(?:Centre-State Relations.*|Indian Federalism|Local Self-Government.*|Panchayati Raj Institutions|Fifth Schedule|Scheduled Areas & Tribal Administration|States and Union Territories|Union and its Territory)$/i,
      broadSubTopic:
        /(?:federali|centre-state|center-state|local self-government|local governance|panchayat|scheduled areas?|tribal administration|fifth schedule|sixth schedule|states and union territories|inter-state relations)/i,
    },
    {
      slug: "political-theory-democracy",
      label: "Political Theory & Democracy",
      overview:
        "These PYQs test ideas such as liberty, equality, democracy, constitutionalism, rule of law, political ideologies, and forms of representative government.",
      topic:
        /^(?:Political Theory|Political Philosophy|Political Ideologies|Democracy|Constitutionalism|Constitutionalism & Democratic Principles|Indian Political System|Parliamentary System)$/i,
      broadSubTopic:
        /(?:political (?:theory|philosoph|ideolog)|democracy|forms of government|parliamentary system|constitutionalism|rule of law|concept of (?:liberty|equality)|gandhism|marxism)/i,
    },
    {
      slug: "constitutional-framework",
      label: "Constitutional Framework",
      overview:
        "This group covers the Constitution’s origins, Preamble, amendment process, basic structure, schedules, emergency provisions, and foundational constitutional design.",
      topic:
        /(?:Constitution|Amendment|Constitutional Framework|Constitutional History & Values|Historical Underpinnings|Preamble|Schedules of the|Constitutional Schedules|Emergency Provisions|National Symbols)/i,
      broadSubTopic:
        /(?:constitution|preamble|amendment|article 368|basic structure|constituent assembly|ninth schedule|emergency)/i,
    },
  ],
  Economy: [
    {
      slug: "agriculture-rural-economy",
      label: "Agriculture & Rural Economy",
      overview:
        "These questions connect agricultural prices, credit, trade, schemes, inputs, land reform, farm policy, and rural institutions to the wider Indian economy.",
      topic:
        /^(?:Agricultur.*|Agriculture.*|Government Schemes \(Agriculture.*|Banking \/ Rural Finance)$/i,
      broadSubTopic:
        /(?:agricultur|farming|crops?|seeds?|fertilizer|minimum support price|msp\b|rural economy|kisan credit|soil health|land reforms?|millet)/i,
    },
    {
      slug: "money-banking-monetary-policy",
      label: "Money, Banking & Monetary Policy",
      overview:
        "This cluster covers RBI functions and instruments, money and liquidity, banking institutions, payment systems, currency, inclusion, and financial-sector reform.",
      topic:
        /^(?:Banking.*|Monetary Policy.*|Money (?:and|&) Banking|Reserve Bank of India|Digital Payments.*|Financial Inclusion.*|Indian Financial System|Non-Performing Assets \(NPAs\)|Foreign Exchange Market|Financial Sector Reforms)$/i,
      broadSubTopic:
        /(?:banking|banks?\b|reserve bank|rbi\b|payment systems?|digital payments?|currency|liquidity|money supply|credit creation|financial inclusion|non-performing assets|npas?\b|legal tender|cbdc|upi\b|bhim\b)/i,
    },
    {
      slug: "financial-markets",
      label: "Financial Markets",
      overview:
        "These PYQs examine equity and debt, bonds, money-market and capital-market instruments, investment vehicles, ratings, securities, and market regulation.",
      topic:
        /^(?:Financial Markets.*|Financial Instruments|Corporate Finance \/ Banking|Infrastructure Finance)$/i,
      broadSubTopic:
        /(?:capital markets?|bond markets?|money market instruments?|stock markets?|financial instruments?|securities|investment funds?|venture capital|foreign portfolio investment|fpi\b|invit|credit rating|corporate finance|beta \(finance\)|equity vs debt|government securities)/i,
    },
    {
      slug: "public-finance-taxation",
      label: "Public Finance & Taxation",
      overview:
        "This collection focuses on budgets, deficits, public expenditure and borrowing, taxation, fiscal federalism, Finance Commissions, and government accounts.",
      topic:
        /^(?:Public Finance.*|Taxation|International Taxation|Finance Commission|Fiscal Federalism)$/i,
      broadSubTopic:
        /(?:public finance|fiscal|budget|taxation|tax\b|gst\b|finance commission|government borrowings?|government expenditure|tax devolution|budgetary process)/i,
    },
    {
      slug: "external-sector-trade",
      label: "External Sector & Trade",
      overview:
        "These questions cover trade, payments and current accounts, exchange rates, external debt, foreign investment, global financial institutions, and economic agreements.",
      topic:
        /^(?:External Sector|Balance of Payments|Exchange Rate|Foreign Investment|International (?:Economic.*|Economics|Economy|Finance|Financial Institutions|Reports and Indices|Trade.*)|International Organizations (?:\/ Global Finance|& Finance)|International Relations & Trade Blocs|World Trade Organization \(WTO\)|Trade Policy & Industrial Policy|E-commerce Policy)$/i,
      broadSubTopic:
        /(?:balance of payments?|balance of trade|current account|foreign exchange|exchange rates?|external (?:debt|sector)|foreign investment|fdi\b|international trade|world trade organization|wto\b|imports?|exports?|global (?:economic|financial)|imf\b|world bank|financial institutions|multilateral development|masala bonds|capital flight|foreign reserves?|european union|agricultural trade bodies)/i,
    },
    {
      slug: "growth-development-inflation",
      label: "Growth, Development & Inflation",
      overview:
        "This cluster brings together national income, growth and productivity, inflation, economic planning and reform, microeconomic principles, and development measures.",
      topic:
        /^(?:Economic (?:Development.*|Growth.*|Planning|Reforms|Sectors)|Macroeconomics|Microeconomics|Inflation.*|Human Development|Sectors of Economy)$/i,
      broadSubTopic:
        /(?:economic (?:development|growth|planning|reforms)|macroeconomics|microeconomics|inflation|price indices|national income|gdp\b|gnp\b|capital-output|demand and supply|factors of production|opportunity cost|five-year plans?|human development|human capital|economic sectors?|real sector)/i,
    },
    {
      slug: "industry-infrastructure-business",
      label: "Industry, Infrastructure & Business",
      overview:
        "These PYQs examine industry and MSMEs, infrastructure and energy sectors, corporate rules, insolvency, investment structures, and sectoral regulation.",
      topic:
        /^(?:Industrial Sector|Energy Sector.*|Infrastructure Finance|Insolvency and Bankruptcy Code|Corporate Governance|Business & Accounting Concepts|Agriculture \/ Industrial Policy|Trade Policy & Industrial Policy|Regulatory Bodies|Mineral Resources)$/i,
      broadSubTopic:
        /(?:industrial|industries|industry|infrastructure|energy sector|coal mining|mineral policy|e-commerce|corporate governance|insolvency|bankruptcy|business|msme|core sector|power sector)/i,
    },
    {
      slug: "employment-welfare-schemes",
      label: "Employment, Welfare & Schemes",
      overview:
        "This collection covers labour and employment, skills, pensions and social security, inclusion, entrepreneurship, welfare programmes, and human-capital interventions.",
      topic:
        /^(?:Labour.*|Education & Skill Development|Government Schemes.*|Social Security Schemes)$/i,
      broadSubTopic:
        /(?:labour|employment|poverty|social security|pension|education|skill|government schemes?|entrepreneurship|food security|national pension|self-help groups?)/i,
    },
  ],
  Environment: [
    {
      slug: "climate-change",
      label: "Climate Change",
      overview:
        "These questions cover greenhouse gases, warming impacts, carbon sinks and markets, mitigation technologies, climate finance, negotiations, and national action.",
      topic:
        /(?:Climate Change|Carbon Sequestration|National Action Plan on Climate Change|Greenhouse Gas Emissions)/i,
      broadSubTopic:
        /(?:global warming|greenhouse|carbon|unfccc|cop\d|kyoto|paris agreement|redd\+?|geoengineering|wet-bulb)/i,
    },
    {
      slug: "pollution-waste",
      label: "Pollution & Waste",
      overview:
        "This cluster examines air, water, chemical, industrial, and agricultural pollution alongside waste rules, remediation, health effects, and control technologies.",
      topic:
        /(?:Pollution|Environmental Chemistry|Environmental Degradation|Pollutants|Fossil Fuels|Waste)/i,
      broadSubTopic:
        /(?:pollution|pollutants?|waste|air quality|aqi\b|plastics?|bisphenol|triclosan|bioaccumulation|degradation|sand mining|bioremediation|remediation)/i,
    },
    {
      slug: "environmental-governance-laws",
      label: "Environmental Governance & Laws",
      overview:
        "These PYQs focus on environmental statutes, regulatory bodies, standards, rules, forest and wildlife law, rights, compliance, and institutional accountability.",
      topic:
        /(?:Governance|Legislation|Law|Regulations|Wildlife Protection (?:Act|Law)|Environmental Ethics)/i,
      broadSubTopic:
        /(?:act,? 19|legislation|law|rules|regulatory|standards|statutory|ngt\b|cpcb\b|geac\b|campa\b)/i,
    },
    {
      slug: "international-conventions-organizations",
      label: "International Conventions & Organizations",
      overview:
        "This group covers environmental conventions, protocols, global organizations, reports, funds, and international initiatives outside the climate-only cluster.",
      topic:
        /(?:International Environmental|Environmental Conventions|Environmental Organizations|Environment - International)/i,
      broadSubTopic:
        /(?:international|conventions?|agreements?|organizations?|ramsar|montreux|teeb\b|traffic\b|birdlife|earth summit|agenda 21)/i,
    },
    {
      slug: "renewable-energy-green-tech",
      label: "Renewable Energy & Green Technology",
      overview:
        "These questions examine solar energy, biofuels, green hydrogen, efficiency, clean-energy initiatives, and technologies intended to reduce environmental pressure.",
      topic: /(?:Renewable Energy|Energy Conservation)/i,
      broadSubTopic:
        /(?:renewable|solar|biofuels?|green hydrogen|energy conservation|hydrogen)/i,
    },
    {
      slug: "sustainable-development-agriculture",
      label: "Sustainable Development & Agriculture",
      overview:
        "This collection links sustainable farming, resource use, afforestation, circular economy, development goals, and lower-impact infrastructure and production.",
      topic:
        /(?:Sustainable|Agriculture|Afforestation|Reforestation|Urban Ecology \/ Forestry)/i,
      broadSubTopic:
        /(?:sustainable|agriculture|farming|permaculture|biochar|miyawaki|circular economy|green economy|eco-friendly|zero tillage|rice intensification)/i,
    },
    {
      slug: "water-wetlands-marine",
      label: "Water, Wetlands & Marine",
      overview:
        "These PYQs cover groundwater, wetlands, rivers, marine and coral systems, aquaculture, water management, and aquatic conservation challenges.",
      topic: /(?:Water Resources|Wetlands|Marine|Aquaculture)/i,
      broadSubTopic:
        /(?:groundwater|wetlands?|marine|coral|aquaculture|river conservation|ganges river|water & sanitation|ocean)/i,
    },
    {
      slug: "protected-areas-wildlife",
      label: "Protected Areas & Wildlife",
      overview:
        "This cluster brings together national parks, sanctuaries, reserves, corridors, wildlife law and management, habitat conservation, and species translocation.",
      topic: /(?:Protected Areas|Conservation|Wildlife|National Parks)/i,
      broadSubTopic:
        /(?:protected areas?|national parks?|wildlife|tiger reserves?|biosphere reserves?|sanctuar(?:y|ies)|translocation|corridors?)/i,
    },
    {
      slug: "biodiversity-species",
      label: "Biodiversity & Species",
      overview:
        "These questions test species characteristics and distribution, plant and animal biology, endemic and invasive life, habitats, taxonomy, and biodiversity threats.",
      topic:
        /(?:Biodiversity|Animal|Botany|Plant & Fungi|Biogeography|Biological Interactions|Bio-resources)/i,
      broadSubTopic:
        /(?:biodiversity|species|animal|botany|plants?|fungi|birds?|insects?|primates?|endemic|invasive|habitats?|biology|physiology|morphology|classification)/i,
    },
    {
      slug: "ecology-ecosystems",
      label: "Ecology & Ecosystems",
      overview:
        "This collection focuses on ecological interactions, food chains, cycles, adaptations, ecosystem function, biomes, and the roles organisms play within them.",
      topic:
        /(?:Ecology|Ecosystems|Biogeochemical Cycles|Basic Ecology|Ecological Roles)/i,
      broadSubTopic:
        /(?:ecology|ecosystems?|biomes?|ecological|food chains?|biogeochemical|symbiosis|adaptations?|detritivores?|cycle)/i,
    },
  ],
  Science: [
    {
      slug: "biotechnology-genetics",
      label: "Biotechnology & Genetics",
      overview:
        "These PYQs cover genes and genomes, biotechnology applications, editing and cloning, GM crops, vaccines, reproductive technology, and molecular methods.",
      topic: /(?:Biotechnology|Genetics & Evolutionary Biology)/i,
      broadSubTopic:
        /(?:biotechnology|genetic|genomics?|gene editing|crispr|dna|rna interference|cloning|transgenic|gm crops?|stem cells?|reproductive|vaccine|metagenomics|phylogenetics)/i,
    },
    {
      slug: "biology-health",
      label: "Biology & Health",
      overview:
        "This cluster examines human and plant biology, microorganisms, immunity, nutrition, diseases, public-health interventions, and the biological basis of health.",
      topic:
        /(?:Biology|Microbiology|Public Health|Human Biology|Human Health|Health & Diseases|Plant Biology|Plant Physiology|Zoology|Anthropology)/i,
      broadSubTopic:
        /(?:biology|microbiology|virolog|viruses?|public health|human health|diseases?|immune|immunolog|nutrition|vitamins?|microorganisms?|biofilms?|fungi|plant|zoology|human evolution|probiotics|vaccines?)/i,
    },
    {
      slug: "digital-quantum-cybersecurity",
      label: "Digital, Quantum & Cybersecurity",
      overview:
        "These questions cover computing, communications, AI, blockchain, the internet, digital public systems, cyber risk, cryptography, and quantum technologies.",
      topic:
        /(?:Information|Cyber|Blockchain|Digital|Internet|E-Governance|Quantum Technology)/i,
      broadSubTopic:
        /(?:ict\b|cyber|blockchain|cryptocurrenc|digital|internet|web 3|cloud computing|artificial intelligence|\bai\b|virtual reality|augmented reality|iot\b|communication technology|wearable|li-fi|wireless|biometric|quantum)/i,
    },
    {
      slug: "space-astronomy",
      label: "Space & Astronomy",
      overview:
        "This collection spans space missions, satellites and navigation, remote sensing, astronomical objects and distances, gravitational waves, and planetary science.",
      topic:
        /(?:Space|Astronomy|Astrophysics|Cosmology|Particle Physics & Astronomy)/i,
      broadSubTopic:
        /(?:space|astronomy|astrophysics|cosmology|stellar|planetary|satellites?|remote sensing|gravitational wave|black ?holes?|exoplanets?|geomagnetic|neutrino)/i,
    },
    {
      slug: "defence-nuclear-aerospace",
      label: "Defence, Nuclear & Aerospace",
      overview:
        "These PYQs examine missiles, drones, naval and aerospace systems, nuclear energy and safeguards, defence platforms, and dual-use technologies.",
      topic: /(?:Defence|Nuclear Technology|Unmanned Aerial Vehicles)/i,
      broadSubTopic:
        /(?:defen[cs]e|missile|munitions|explosives|nuclear|naval|aerospace|aviation|unmanned aerial|uavs?|drones?)/i,
    },
    {
      slug: "energy-green-technology",
      label: "Energy & Green Technology",
      overview:
        "This cluster covers solar and hydrogen systems, batteries, electric vehicles, fuel cells, coal technologies, and scientific approaches to cleaner energy.",
      topic:
        /(?:Renewable Energy|Battery Technology|Green Technology|Energy & Chemistry)/i,
      broadSubTopic:
        /(?:renewable energy|solar|hydrogen|fuel cells?|battery|electric vehicles?|powertrain|green hydrogen|coal technologies)/i,
    },
    {
      slug: "physical-sciences-materials",
      label: "Physical Sciences, Chemistry & Materials",
      overview:
        "These questions combine core physics and chemistry with materials science, nanotechnology, polymers, sensors, composites, and advanced manufacturing.",
      topic:
        /(?:Materials Science|Nanoscience|Nanotechnology|Advanced Manufacturing|^Physics|Chemistry|Chemical Compounds|Cell Biology)/i,
      broadSubTopic:
        /(?:materials|nano|carbon nanotubes?|polymers?|composites|3d printing|physics|chemistry|chemical|properties of water|thermodynamics|light-year|sensors?)/i,
    },
  ],
  "Current Affairs": [
    {
      slug: "international-organizations-summits",
      label: "International Organizations & Summits",
      overview:
        "This collection covers multilateral organizations, international groupings, summits, declarations, reports, alliances, and cross-border institutional initiatives.",
      topic:
        /(?:International Organizations?|International Groupings?|International Summits?|International Conferences?|International Treaties|International Trade Agreements|Nuclear Security & International Organizations)/i,
    },
    {
      slug: "international-relations-geopolitics",
      label: "International Relations & Geopolitics",
      overview:
        "These PYQs connect bilateral and regional relations, conflict zones, strategic geography, migration, security, diplomacy, and geopolitical developments.",
      topic:
        /(?:International Relations|Global Conflict Zones|International Geography \/ Geopolitics|Deep Sea Mining and Ocean Governance)/i,
    },
    {
      slug: "government-schemes-governance",
      label: "Government Schemes & Governance",
      overview:
        "This cluster examines public schemes, ministries, institutions, health and social policy, citizenship, governance initiatives, and implementation mechanisms.",
      topic:
        /(?:Government|Governance|Social (?:Legislation|Welfare)|Citizenship|Federalism|Judiciary|Indian Polity|Political Theory|Food Safety|Health|Poverty and Unemployment|Quality Certification)/i,
    },
    {
      slug: "economy-infrastructure-agriculture",
      label: "Economy, Infrastructure & Agriculture",
      overview:
        "These questions cover current economic policy, finance, payments, taxation, agriculture, energy and transport infrastructure, industry, and intellectual property.",
      topic:
        /(?:Economy|Capital Market|Digital Payments|Taxation|Agricultur|Cropping Patterns|Biofuels|Infrastructure|Railways|Industrial Policy|Intellectual Property|Rare Earth|Renewable Energy Infrastructure)/i,
    },
    {
      slug: "environment-climate",
      label: "Environment & Climate",
      overview:
        "This collection links current environmental rules and initiatives with biodiversity, wildlife, climate intervention, sustainable agriculture, and ecosystem events.",
      topic:
        /(?:Environment|Biodiversity|Climate Change|Sustainable Agriculture|Terrestrial Biomes)/i,
    },
    {
      slug: "science-space-defence",
      label: "Science, Space & Defence",
      overview:
        "These current-affairs PYQs cover major technologies, space missions, defence platforms, communications, physics, health events, and science in the news.",
      topic: /(?:Science|Technology|Space|Defence|Physics|Global Health)/i,
    },
    {
      slug: "history-art-culture-people",
      label: "History, Art, Culture & People",
      overview:
        "This cluster gathers history and culture in the news, heritage, personalities, literature, movements, architecture, awards context, and commemorative events.",
      topic:
        /(?:Art & Culture|History|Ancient|Medieval|Modern|British|Buddh|Jain|Bhakti|Sufi|National Movement|Socio-Religious|Tribal and Peasant|Culture|Personalities|Delhi Sultanate)/i,
    },
    {
      slug: "sports-awards",
      label: "Sports & Awards",
      overview:
        "These questions cover tournaments, championships, major sporting events, prizes, honours, and notable achievements that entered the current-affairs cycle.",
      topic: /(?:Sports|Awards|Honours)/i,
    },
    {
      slug: "geography-places",
      label: "Geography & Places",
      overview:
        "This group covers places and regions in the news, physical settings, latitudes, rivers, oceans, climate, and geographic facts tied to current events.",
      topic: /(?:Geography|Climatology|Oceanography|Places in News|Physical Geography)/i,
    },
  ],
};

export const OTHER_CANONICAL_PYQ_TOPIC = {
  slug: "other",
  label: "Other",
  overview:
    "Questions whose labels are ambiguous, unreadable, or outside the assigned subject remain unindexed until they are reviewed.",
  topic: /a^/,
} satisfies CanonicalPyqTopicRule;

export function normalizeTaxonomyLabel(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

export function isPyqSeoSubject(value: string): value is PyqSeoSubject {
  return (PYQ_SUBJECTS as readonly string[]).includes(value);
}

export function classifyPyqTopic(input: {
  subject: PyqSeoSubject;
  topic: string | null | undefined;
  subTopic: string | null | undefined;
}): CanonicalPyqTopicRule {
  const topic = normalizeTaxonomyLabel(input.topic);
  const subTopic = normalizeTaxonomyLabel(input.subTopic);
  const useBroadSubTopic = GENERIC_TOPIC[input.subject].test(topic);

  return (
    CANONICAL_PYQ_TOPIC_RULES[input.subject].find(
      (rule) =>
        rule.topic.test(topic) ||
        (useBroadSubTopic &&
          rule.broadSubTopic !== undefined &&
          rule.broadSubTopic.test(subTopic)),
    ) ?? OTHER_CANONICAL_PYQ_TOPIC
  );
}

function countLabels(labels: Iterable<string | null | undefined>) {
  const counts = new Map<string, number>();

  for (const value of labels) {
    const label = normalizeTaxonomyLabel(value);
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function selectRepresentativeQuestions(questions: SearchablePyqQuestion[]) {
  const sorted = [...questions].sort(
    (a, b) =>
      (b.year ?? 0) - (a.year ?? 0) || a.id.localeCompare(b.id),
  );
  const selected: SearchablePyqQuestion[] = [];
  const selectedIds = new Set<string>();
  const seenYears = new Set<number>();
  const seenPrompts = new Set<string>();

  const addQuestion = (question: SearchablePyqQuestion) => {
    if (!question.correct_option_id || selectedIds.has(question.id)) return;
    const promptKey = question.prompt.replace(/\s+/g, " ").trim().toLowerCase();
    if (seenPrompts.has(promptKey)) return;
    selected.push(question);
    selectedIds.add(question.id);
    seenPrompts.add(promptKey);
  };

  for (const question of sorted) {
    if (selected.length >= REPRESENTATIVE_TOPIC_QUESTION_LIMIT) break;
    if (question.year === null || seenYears.has(question.year)) continue;
    addQuestion(question);
    seenYears.add(question.year);
  }

  for (const question of sorted) {
    if (selected.length >= REPRESENTATIVE_TOPIC_QUESTION_LIMIT) break;
    addQuestion(question);
  }

  return selected;
}

function buildCanonicalTopicGroup(
  subject: PyqSeoSubject,
  rule: CanonicalPyqTopicRule,
  questions: SearchablePyqQuestion[],
): CanonicalPyqTopicGroup {
  const yearCounts = Array.from(
    questions.reduce((counts, question) => {
      if (question.year !== null) {
        counts.set(question.year, (counts.get(question.year) ?? 0) + 1);
      }
      return counts;
    }, new Map<number, number>()),
  )
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);
  const years = yearCounts.map(({ year }) => year);

  return {
    subject,
    subjectSlug: SUBJECT_SLUGS[subject],
    rule,
    count: questions.length,
    representedYears: yearCounts.length,
    earliestYear: Math.min(...years),
    latestYear: Math.max(...years),
    yearCounts,
    rawTopicCounts: countLabels(questions.map((question) => question.topic)),
    rawSubTopicCounts: countLabels(
      questions.map((question) => question.sub_topic),
    ),
    conceptCounts: countLabels(
      questions.flatMap((question) => question.concepts ?? []),
    ),
    representativeQuestions: selectRepresentativeQuestions(questions),
    questions,
  };
}

export function isIndexableCanonicalTopic(group: CanonicalPyqTopicGroup) {
  return (
    group.rule.slug !== OTHER_CANONICAL_PYQ_TOPIC.slug &&
    group.count >= MIN_INDEXABLE_CANONICAL_TOPIC_QUESTIONS &&
    group.representedYears >= MIN_INDEXABLE_CANONICAL_TOPIC_YEARS
  );
}

export async function getCanonicalPyqTopicGroups() {
  const questions = await fetchSearchablePyqQuestions();
  const groups = new Map<string, SearchablePyqQuestion[]>();

  for (const question of questions) {
    if (!isPyqSeoSubject(question.subject)) continue;
    const rule = classifyPyqTopic({
      subject: question.subject,
      topic: question.topic,
      subTopic: question.sub_topic,
    });
    if (rule.slug === OTHER_CANONICAL_PYQ_TOPIC.slug) continue;

    const key = `${question.subject}:${rule.slug}`;
    const group = groups.get(key) ?? [];
    group.push(question);
    groups.set(key, group);
  }

  return PYQ_SUBJECTS.flatMap((subject) =>
    CANONICAL_PYQ_TOPIC_RULES[subject].flatMap((rule) => {
      const questionsForRule = groups.get(`${subject}:${rule.slug}`) ?? [];
      if (!questionsForRule.length) return [];
      return [buildCanonicalTopicGroup(subject, rule, questionsForRule)];
    }),
  );
}

export async function getIndexableCanonicalPyqTopics() {
  const groups = await getCanonicalPyqTopicGroups();

  return groups.filter(isIndexableCanonicalTopic).map((group) => ({
    subject: group.subject,
    subjectSlug: group.subjectSlug,
    topic: group.rule.label,
    topicSlug: group.rule.slug,
    count: group.count,
    representedYears: group.representedYears,
  }));
}

export async function getCanonicalPyqTopicData(
  subject: PyqSeoSubject,
  topicSlug: string,
) {
  const groups = await getCanonicalPyqTopicGroups();
  const group = groups.find(
    (candidate) =>
      candidate.subject === subject && candidate.rule.slug === topicSlug,
  );

  return group && isIndexableCanonicalTopic(group) ? group : null;
}
