import fs from 'fs';
import path from 'path';

// This dataset includes minor streams, giving extreme density.
const NE_RIVERS_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson';

// India Bounding Box roughly
const INDIA_BBOX = {
  minLng: 68.1,
  minLat: 6.7,
  maxLng: 97.4,
  maxLat: 35.5
};

function pointInBbox(coord: number[]) {
  const [lng, lat] = coord;
  return lng >= INDIA_BBOX.minLng && lng <= INDIA_BBOX.maxLng && lat >= INDIA_BBOX.minLat && lat <= INDIA_BBOX.maxLat;
}

function lineIntersectsBbox(coords: number[][]) {
  return coords.some(pointInBbox);
}

function multiLineIntersectsBbox(coords: number[][][]) {
  return coords.some(line => lineIntersectsBbox(line));
}

async function main() {
  console.log('Downloading Natural Earth 1:10m Rivers...');
  const res = await fetch(NE_RIVERS_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  
  console.log(`Total rivers fetched globally: ${data.features.length}`);
  
  const indianRivers = data.features.filter((f: any) => {
    if (f.geometry.type === 'LineString') {
      return lineIntersectsBbox(f.geometry.coordinates);
    } else if (f.geometry.type === 'MultiLineString') {
      return multiLineIntersectsBbox(f.geometry.coordinates);
    }
    return false;
  });

  console.log(`Found ${indianRivers.length} river segments intersecting India's Bounding Box.`);
  
  // Format them for MapLibre
  const formattedRivers = indianRivers.map((f: any) => {
    let name = f.properties.name || f.properties.name_en || f.properties.name_alt || '';
    if (!name) name = "Unnamed River";
    return {
      type: "Feature",
      properties: {
        name,
        // Calculate major/tributary by scalerank (Natural Earth property: scalerank 1-10)
        type: (f.properties.scalerank <= 4) ? "major" : "tributary"
      },
      geometry: f.geometry
    };
  });
  
  const outPath = path.join(process.cwd(), 'public', 'data', 'india-rivers-highres.geojson');
  fs.writeFileSync(outPath, JSON.stringify({ type: "FeatureCollection", features: formattedRivers }));
  
  console.log(`Saved to ${outPath}`);
}

main().catch(console.error);
