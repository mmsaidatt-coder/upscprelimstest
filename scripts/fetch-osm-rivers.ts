import fs from 'fs';
import path from 'path';
import osmtogeojson from 'osmtogeojson';

async function main() {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  // Bounding box for India roughly [minLat, minLng, maxLat, maxLng]
  // We will query waterway=river. We use out body; >; out skel qt;
  // To avoid huge outputs, we'll only get relations or ways with name
  const query = `
    [out:json][timeout:90];
    (
      way["waterway"="river"]["name"](8.0, 68.0, 37.0, 97.0);
      relation["waterway"="river"]["name"](8.0, 68.0, 37.0, 97.0);
    );
    out body;
    >;
    out skel qt;
  `;

  console.log('Fetching from Overpass API...');
  
  const res = await fetch(overpassUrl, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  if (!res.ok) {
    throw new Error(`HTTP Error: ${res.status}`);
  }
  
  const data = await res.json();
  console.log(`Received ${data.elements.length} elements from OSM.`);
  
  console.log('Converting OSM JSON to GeoJSON...');
  const geojson = osmtogeojson(data) as any;
  console.log(`Created ${geojson.features.length} GeoJSON features.`);

  // Filter out non-linestrings or empty names
  const validFeatures = geojson.features.filter((f: any) => {
    if (f.geometry.type !== 'LineString' && f.geometry.type !== 'MultiLineString') return false;
    if (!f.properties || !f.properties.name) return false;
    return true;
  });

  // Keep only essential properties to reduce file size
  const finalFeatures = validFeatures.map((f: any) => {
    return {
      type: 'Feature',
      properties: {
        name: f.properties.name,
        name_en: f.properties['name:en'] || null,
        type: 'tributary' // default to tributary for styling 
      },
      geometry: f.geometry
    };
  });

  const outPath = path.join(process.cwd(), 'public', 'data', 'india-osm-rivers.geojson');
  fs.writeFileSync(outPath, JSON.stringify({ type: 'FeatureCollection', features: finalFeatures }));
  console.log(`Saved ${finalFeatures.length} named rivers to ${outPath}`);
}

main().catch(console.error);
