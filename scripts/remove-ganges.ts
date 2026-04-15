import fs from "fs";

const data = JSON.parse(fs.readFileSync("public/data/india-rivers-highres.geojson", "utf-8"));
const initialCount = data.features.length;

const ganges = data.features.filter((f: any) => f.properties.name === "Ganges");
const ganga = data.features.filter((f: any) => f.properties.name === "Ganga");
console.log(`Ganges count: ${ganges.length}`);
console.log(`Ganga count: ${ganga.length}`);

// Remove Ganges
data.features = data.features.filter((f: any) => f.properties.name !== "Ganges");
const finalCount = data.features.length;

console.log(`Removed ${initialCount - finalCount} features named "Ganges"`);

fs.writeFileSync("public/data/india-rivers-highres.geojson", JSON.stringify(data, null, 2));
