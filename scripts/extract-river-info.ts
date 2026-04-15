import fs from 'fs';
import path from 'path';

// Define levels
const LEVEL_1_RIVERS = ["Ganga", "Ganges", "Indus", "Brahmaputra", "Godavari", "Krishna", "Narmada", "Kaveri", "Cauvery", "Mahanadi"];
const LEVEL_2_RIVERS = ["Yamuna", "Chambal", "Kosi", "Jhelum", "Chenab", "Ravi", "Beas", "Sutlej", "Subansiri", "Teesta", "Tapi", "Tapti", "Periyar", "Pennar", "Tungabhadra"];
const LEVEL_3_RIVERS = ["Betwa", "Ken", "Son", "Sabarmati", "Mahi", "Vaigai", "Bhima", "Indravati", "Manjira", "Subarnarekha", "Brahmani", "Palar", "Lohit", "Dibang", "Zanskar", "Shyok"];

async function getWikipediaSummary(riverName: string): Promise<string> {
  const titlesToTry = [`${riverName} River`, `${riverName}_River`, riverName];
  
  for (const title of titlesToTry) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.type !== 'disambiguation' && data.extract && !data.extract.includes("may refer to")) {
          // Found a valid summary
          return data.extract;
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch Wikipedia for ${title}`);
    }
  }
  return "";
}

async function main() {
  const geojsonPath = path.join(process.cwd(), 'public', 'data', 'india-rivers-highres.geojson');
  console.log(`Reading geojson from ${geojsonPath}...`);
  
  const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

  // A cache to avoid querying Wikipedia hundreds of times for line segments of the same river
  const descriptionCache: Record<string, string> = {};

  // Process features sequentially to respect API rate limits
  for (let i = 0; i < data.features.length; i++) {
    const feature = data.features[i];
    const name = feature.properties.name || feature.properties.name_en || '';
    
    let level = 5; // Default Level 5 (Minor/Unknown, Unnamed)
    
    if (name) {
      const lowerName = name.toLowerCase();
      if (LEVEL_1_RIVERS.some(r => lowerName.includes(r.toLowerCase()))) {
        level = 1;
      } else if (LEVEL_2_RIVERS.some(r => lowerName.includes(r.toLowerCase()))) {
        level = 2;
      } else if (LEVEL_3_RIVERS.some(r => lowerName.includes(r.toLowerCase()))) {
        level = 3;
      } else if (feature.properties.basin && feature.properties.basin !== 'Minor / Unknown Basin') {
        level = 4; // Named river identified within a known basin
      } else {
        level = 5; // Valid name, but not inside major basins
      }

      // Fetch description for Level 1, 2, 3 rivers
      if (level <= 3) {
        if (descriptionCache[name] === undefined) {
          console.log(`Fetching Wikipedia summary for Level ${level} river: ${name}...`);
          const summary = await getWikipediaSummary(name);
          descriptionCache[name] = summary;
          // small delay to be polite to Wikipedia API
          await new Promise(r => setTimeout(r, 100));
        }
        
        feature.properties.description = descriptionCache[name];
      }
    }

    feature.properties.level = level;
  }

  // Count distribution
  const distribution: Record<number, number> = {1:0, 2:0, 3:0, 4:0, 5:0};
  data.features.forEach((f: any) => {
    distribution[f.properties.level]++;
  });

  fs.writeFileSync(geojsonPath, JSON.stringify(data));
  console.log(`Successfully enriched ${data.features.length} features with levels and descriptions.`);
  console.log('Level Distribution:', distribution);
}

main().catch(console.error);
