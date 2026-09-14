const fs = require('fs');
const https = require('https');

const dataFile = 'india-rivers-highres.geojson';
const geojson = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const rivers = ["Yamuna", "Brahmaputra", "Godavari", "Krishna", "Narmada", "Kaveri", "Cauvery", "Indus", "Mahanadi", "Sutlej", "Chambal", "Tapi", "Beas", "Chenab", "Jhelum", "Ravi", "Luni", "Son", "Tungabhadra", "Brahmani", "Sabarmati", "Mahi", "Damodar", "Subarnarekha", "Pennar", "Vaigai", "Periyar", "Teesta", "Tista", "Subansiri", "Manas", "Kosi", "Gandak", "Ghaghara", "Gomti", "Betwa", "Ken", "Hooghly", "Barak", "Alaknanda", "Bhagirathi", "Zanskar", "Shyok"];

const queryStr = rivers.join("|");
const overpassQuery = `[out:json][timeout:300][bbox:6.0,68.0,37.0,98.0];
(
  way["waterway"="river"]["name:en"~"^(${queryStr})$",i];
  way["waterway"="river"]["name"~"^(${queryStr})$",i];
);
out geom;`;

console.log("Fetching river data from Overpass API...");

const req = https.request("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }, res => {
  let chunks = '';
  res.on('data', chunk => chunks += chunk);
  res.on('end', () => {
    try {
      if (res.statusCode !== 200) {
        console.error("Failed API Call:", res.statusCode, chunks.substring(0, 500));
        return;
      }
      
      const osmData = JSON.parse(chunks);
      console.log(`Received ${osmData.elements.length} components from OSM.`);
      
      const propMap = {};
      geojson.features.forEach(f => {
        if (f.properties && f.properties.name) {
          const nm = f.properties.name.toLowerCase();
          if (!propMap[nm]) propMap[nm] = f.properties;
        }
      });
      
      propMap["cauvery"] = propMap["kaveri"];
      propMap["tista"] = propMap["teesta"];
      
      let added = 0;
      
      osmData.elements.forEach(el => {
        if (!el.geometry || el.geometry.length < 2) return;
        
        let rawName = (el.tags && (el.tags["name:en"] || el.tags.name)) || "";
        let identifiedName = "";
        for (let r of rivers) {
          if (rawName.toLowerCase() === r.toLowerCase()) {
            identifiedName = r === "Cauvery" ? "Kaveri" : (r === "Tista" ? "Teesta" : r);
            break;
          }
        }
        
        if (!identifiedName) return; 
        
        const coords = el.geometry.map(g => [g.lon, g.lat]);
        let rProps = propMap[identifiedName.toLowerCase()];
        if (!rProps) {
           rProps = { name: identifiedName, level: 2, basin: "Inland" };
        }
        
        geojson.features.push({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coords
          },
          properties: { ...rProps, name: identifiedName }
        });
        
        added++;
        
      });
      
      fs.writeFileSync(dataFile, JSON.stringify(geojson));
      console.log(`Successfully merged ${added} new high-res river segments into data file!`);

    } catch (e) {
      console.error("OSM parsing error:", Object.keys(e), e.message, chunks.substring(0, 200));
    }
  });
});

req.write("data=" + encodeURIComponent(overpassQuery));
req.end();
