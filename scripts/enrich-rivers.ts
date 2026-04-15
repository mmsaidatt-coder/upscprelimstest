import fs from 'fs';
import path from 'path';

// Basin Classification Dictionary
const BASIN_MAP: Record<string, string[]> = {
  "Ganga Basin": ["Ganga", "Ganges", "Yamuna", "Chambal", "Betwa", "Ken", "Kosi", "Gandak", "Ghaghara", "Gomti", "Son", "Hooghly", "Ramganga", "Damodar", "Rapti", "Bhagirathi", "Alaknanda", "Mandakini"],
  "Indus Basin": ["Indus", "Jhelum", "Chenab", "Ravi", "Beas", "Sutlej", "Shyok", "Zanskar", "Gilgit", "Nubra", "Suru", "Dras"],
  "Godavari Basin": ["Godavari", "Pranhita", "Indravati", "Manjira", "Sabari", "Wardha", "Wainganga", "Penganga", "Pravara", "Sindphana", "Purna"],
  "Krishna Basin": ["Krishna", "Tungabhadra", "Bhima", "Malaprabha", "Ghataprabha", "Musi", "Koyna", "Panchganga", "Dudhganga", "Ghataprabha", "Tunga", "Bhadra", "Vedavathi"],
  "Brahmaputra Basin": ["Brahmaputra", "Subansiri", "Kameng", "Manas", "Teesta", "Dibang", "Lohit", "Dihang", "Dhansiri", "Kopili", "Torsa", "Raidak", "Jaldhaka", "Luit"],
  "Mahanadi Basin": ["Mahanadi", "Seonath", "Hasdeo", "Mand River", "Jonk"],
  "Narmada Basin": ["Narmada", "Tawa", "Hiran", "Shakkar", "Dudhi", "Barna", "Kolar", "Orsang"],
  "Kaveri Basin": ["Kaveri", "Cauvery", "Kabini", "Hemavati", "Bhavani", "Amaravati", "Harangi", "Lakshmana Tirtha", "Shimsha", "Arkavathy"],
  "Tapi Basin": ["Tapi", "Tapti", "Purna", "Girna", "Bori", "Panjhra", "Buray", "Aner"],
  "Pennar Basin": ["Pennar", "Jayamangali", "Kunderu", "Sagileru", "Chitravathi", "Papagni", "Cheyyeru"],
  "Mahi Basin": ["Mahi", "Panam", "Goma"],
  "Sabarmati Basin": ["Sabarmati", "Wakal", "Harnav", "Hathmati", "Vatrak"],
  "Subarnarekha Basin": ["Subarnarekha", "Kharkai", "Roro", "Kanchi", "Harmu Nadi", "Damra", "Karru", "Chinguru", "Karakari", "Brahamani"],
  "Brahmani Basin": ["Brahmani", "Sankh", "South Koel"],
  "West Flowing / Coastal Basins": ["Periyar", "Mandovi", "Zuari", "Sharavathi", "Netravati", "Pamba", "Bharathappuzha", "Chaliyar", "Kadalundi"],
  "East Flowing / Coastal Basins": ["Vaigai", "Vellar", "Palar", "Tamaraparani"]
};

function assignBasin(riverName: string): string {
  if (!riverName) return "Minor / Unknown Basin";
  
  const lowerName = riverName.toLowerCase();
  for (const [basinName, rivers] of Object.entries(BASIN_MAP)) {
    if (rivers.some(r => new RegExp(`\\b${r.toLowerCase()}\\b`, 'i').test(lowerName))) {
      return basinName;
    }
  }
  return "Minor / Unknown Basin";
}

async function main() {
  const geojsonPath = path.join(process.cwd(), 'public', 'data', 'india-rivers-highres.geojson');
  console.log(`Reading geojson from ${geojsonPath}...`);
  
  const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  let idCounter = 1;
  const basinCounts: Record<string, number> = {};

  data.features.forEach((feature: any) => {
    // Inject root ID for MapLibre setFeatureState
    feature.id = idCounter++;
    
    // Attempt Basin Matching based on name
    const name = feature.properties.name || feature.properties.name_en || '';
    const basin = assignBasin(name);
    
    feature.properties.basin = basin;
    
    // Normalize type or set major if it is the parent river
    let type = "tributary";
    if (name) {
      if (Object.values(BASIN_MAP).flat().some(r => r.toLowerCase() === name.toLowerCase())) {
        type = "major";
      }
    }
    feature.properties.type = type;

    basinCounts[basin] = (basinCounts[basin] || 0) + 1;
  });

  fs.writeFileSync(geojsonPath, JSON.stringify(data));
  console.log(`Successfully enriched ${data.features.length} features.`);
  console.log('Basin Distribution:', basinCounts);
}

main().catch(console.error);
