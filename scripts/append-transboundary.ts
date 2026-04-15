import fs from 'fs';
import path from 'path';
import https from 'https';

const NATURAL_EARTH_URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson";

// Target rivers and their appropriate UPSC classification
const TARGET_RIVERS = {
  "Indus": { basin: "Indus Basin", level: 1 },
  "Sutlej": { basin: "Indus Basin", level: 1 },
  "Jhelum": { basin: "Indus Basin", level: 2 },
  "Chenab": { basin: "Indus Basin", level: 2 },
  "Ravi": { basin: "Indus Basin", level: 2 },
  "Beas": { basin: "Indus Basin", level: 2 },
  "Brahmaputra": { basin: "Brahmaputra Basin", level: 1 },
  "Ganges": { basin: "Ganga Basin", level: 1, name: "Ganga" }, // Map alias
  "Yamuna": { basin: "Ganga Basin", level: 1 },
};

async function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log("Fetching Natural Earth 10m Rivers...");
  const neData = await fetchJson(NATURAL_EARTH_URL);
  
  const extractedFeatures = [];
  
  for (const feature of neData.features) {
    const rawName = feature.properties.name_en || feature.properties.name;
    if (!rawName) continue;
    
    // Find if the rawName matches any of our targets
    const match = Object.keys(TARGET_RIVERS).find(target => rawName.toLowerCase() === target.toLowerCase());
    
    if (match) {
      const config = TARGET_RIVERS[match as keyof typeof TARGET_RIVERS];
      
      // Mutate properties to match our internal spec perfectly
      const newFeature = {
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          name: config.name || match, // E.g., 'Ganges' -> 'Ganga'
          basin: config.basin,
          type: config.level === 1 ? "major" : "tributary",
          level: config.level,
        },
        id: `ne_transboundary_${Math.floor(Math.random() * 100000)}`
      };
      
      extractedFeatures.push(newFeature);
      console.log(`Extracted full geometry for ${newFeature.properties.name} (${newFeature.properties.basin})`);
    }
  }

  const localFile = path.join(process.cwd(), "public/data/india-rivers-highres.geojson");
  console.log(`Loading local file: ${localFile}`);
  const localData = JSON.parse(fs.readFileSync(localFile, 'utf8'));

  console.log(`Appending ${extractedFeatures.length} trans-boundary vectors to existing ${localData.features.length} features.`);
  localData.features.push(...extractedFeatures);

  fs.writeFileSync(localFile, JSON.stringify(localData));
  console.log("Written successfully. Narmada/Indus/Brahmaputra bounds extended!");
}

run().catch(console.error);
