// ── Rivers, Mountains, National Parks — GeoJSON for map overlays ──────────────
// Expanded for exhaustive UPSC preparation.

import type { FeatureCollection, Feature, LineString, Point } from "geojson";

// ── RIVERS ───────────────────────────────────────────────────────────────────────
type RiverProps = { name: string; type: "major" | "tributary"; length?: number; basin?: "Ganga" | "Indus" | "Brahmaputra" | "Peninsular" | "Inland" };

export const RIVERS: FeatureCollection<LineString, RiverProps> = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Yamuna", type: "major", length: 1376, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[78.45, 31.02], [78.10, 30.40], [77.55, 29.60], [77.33, 28.95], [77.21, 28.61], [77.65, 27.50], [78.02, 27.18], [79.05, 26.60], [80.30, 26.10], [81.85, 25.43]] } },
    { type: "Feature", properties: { name: "Brahmaputra", type: "major", length: 2900, basin: "Brahmaputra" }, geometry: { type: "LineString", coordinates: [[95.30, 28.50], [95.00, 28.10], [94.70, 27.50], [94.90, 27.33], [95.00, 27.20], [94.10, 26.80], [93.50, 26.65], [92.80, 26.63], [91.75, 26.18], [91.20, 26.10], [90.60, 26.12], [89.90, 26.05], [89.70, 25.20]] } },
    { type: "Feature", properties: { name: "Godavari", type: "major", length: 1465, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[73.55, 19.93], [74.40, 19.65], [75.85, 19.35], [77.32, 19.15], [78.50, 18.75], [79.20, 18.50], [79.95, 17.75], [80.65, 17.30], [81.25, 17.05], [81.78, 16.99], [82.30, 16.55]] } },
    { type: "Feature", properties: { name: "Krishna", type: "major", length: 1400, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[73.66, 17.92], [74.85, 17.10], [75.90, 16.70], [76.50, 16.45], [77.30, 16.30], [78.10, 16.20], [79.10, 16.35], [80.20, 16.40], [80.62, 16.10], [80.90, 15.90]] } },
    { type: "Feature", properties: { name: "Narmada", type: "major", length: 1312, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[81.75, 22.67], [80.70, 22.90], [79.95, 23.17], [79.00, 23.10], [78.10, 22.90], [77.25, 22.75], [76.50, 22.50], [75.85, 22.25], [74.95, 22.00], [73.80, 21.85], [72.98, 21.69], [72.50, 21.60]] } },
    { type: "Feature", properties: { name: "Kaveri", type: "major", length: 800, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[75.49, 12.42], [76.05, 12.35], [76.35, 12.42], [76.66, 12.30], [77.00, 12.30], [77.45, 12.15], [77.85, 11.90], [78.25, 11.55], [78.69, 10.79], [79.15, 10.90], [79.50, 10.95], [79.85, 11.10]] } },
    { type: "Feature", properties: { name: "Indus", type: "major", length: 3180, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[78.80, 34.40], [78.20, 34.25], [77.60, 34.15], [77.00, 34.40], [76.40, 34.30], [75.80, 34.20], [75.20, 34.25], [74.60, 34.30], [74.30, 33.80]] } },
    { type: "Feature", properties: { name: "Mahanadi", type: "major", length: 851, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[82.10, 21.70], [82.50, 21.55], [83.20, 21.45], [83.97, 21.47], [84.50, 21.15], [85.10, 20.75], [85.88, 20.46], [86.20, 20.35], [86.50, 20.30]] } },
    { type: "Feature", properties: { name: "Sutlej", type: "tributary", length: 1500, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[78.80, 31.50], [78.00, 31.45], [77.20, 31.55], [76.70, 31.45], [76.43, 31.42], [75.90, 31.30], [75.30, 31.20], [74.95, 31.17]] } },
    { type: "Feature", properties: { name: "Chambal", type: "tributary", length: 960, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[75.60, 22.50], [76.05, 24.20], [76.50, 25.00], [77.10, 25.55], [77.65, 26.25], [78.30, 26.55], [79.05, 26.60]] } },
    { type: "Feature", properties: { name: "Tapi", type: "tributary", length: 724, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[78.00, 21.35], [77.30, 21.25], [76.50, 21.10], [75.60, 21.00], [74.80, 21.05], [73.80, 21.10], [72.85, 21.18], [72.60, 21.20]] } },
    { type: "Feature", properties: { name: "Beas", type: "tributary", length: 470, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[77.08, 32.36], [77.00, 32.00], [76.93, 31.71], [76.40, 31.55], [75.80, 31.45], [75.30, 31.35], [74.95, 31.17]] } },
    { type: "Feature", properties: { name: "Chenab", type: "tributary", length: 960, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[77.35, 32.75], [76.50, 32.80], [75.50, 33.10], [74.80, 33.00], [74.10, 32.60], [73.80, 32.20]] } },
    { type: "Feature", properties: { name: "Jhelum", type: "tributary", length: 725, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[75.20, 33.55], [74.80, 34.05], [74.30, 34.30], [73.80, 34.15], [73.50, 33.80], [73.70, 33.10]] } },
    { type: "Feature", properties: { name: "Ravi", type: "tributary", length: 720, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[76.80, 32.25], [76.05, 32.55], [75.50, 32.40], [75.05, 31.95], [74.50, 31.60]] } },
    { type: "Feature", properties: { name: "Luni", type: "major", length: 495, basin: "Inland" }, geometry: { type: "LineString", coordinates: [[74.70, 26.50], [73.80, 26.00], [72.50, 25.50], [71.50, 24.80], [70.80, 24.10]] } },
    { type: "Feature", properties: { name: "Son", type: "tributary", length: 784, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[81.80, 22.80], [81.50, 23.50], [82.00, 24.10], [83.00, 24.50], [84.10, 24.80], [85.00, 25.60]] } },
    { type: "Feature", properties: { name: "Tungabhadra", type: "tributary", length: 531, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[75.20, 13.90], [75.80, 14.50], [76.50, 15.20], [77.50, 15.80], [78.10, 16.20]] } },
    { type: "Feature", properties: { name: "Brahmani", type: "major", length: 480, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[84.80, 22.20], [85.30, 21.50], [85.80, 21.00], [86.40, 20.80], [86.80, 20.70]] } },
    { type: "Feature", properties: { name: "Sabarmati", type: "major", length: 371, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[73.30, 24.60], [73.00, 24.00], [72.80, 23.50], [72.60, 23.00], [72.40, 22.50], [72.30, 22.10]] } },
    { type: "Feature", properties: { name: "Mahi", type: "major", length: 583, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[74.90, 22.60], [74.50, 23.60], [74.00, 23.90], [73.50, 23.50], [73.20, 23.00], [72.80, 22.30]] } },
    { type: "Feature", properties: { name: "Damodar", type: "tributary", length: 592, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[84.80, 23.90], [85.50, 23.70], [86.50, 23.60], [87.50, 23.20], [88.00, 22.80], [88.20, 22.30]] } },
    { type: "Feature", properties: { name: "Subarnarekha", type: "major", length: 395, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[85.30, 23.30], [86.00, 22.80], [86.80, 22.30], [87.50, 21.50]] } },
    { type: "Feature", properties: { name: "Pennar", type: "major", length: 597, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[77.60, 13.40], [78.20, 14.50], [79.20, 14.60], [80.10, 14.60]] } },
    { type: "Feature", properties: { name: "Vaigai", type: "major", length: 258, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[77.40, 9.60], [78.10, 9.90], [78.60, 9.50], [79.00, 9.30]] } },
    { type: "Feature", properties: { name: "Periyar", type: "major", length: 244, basin: "Peninsular" }, geometry: { type: "LineString", coordinates: [[77.20, 9.30], [76.90, 9.60], [76.50, 10.10], [76.20, 10.20]] } },
    { type: "Feature", properties: { name: "Teesta", type: "tributary", length: 414, basin: "Brahmaputra" }, geometry: { type: "LineString", coordinates: [[88.60, 28.00], [88.50, 27.00], [88.70, 26.50], [89.00, 26.00], [89.70, 25.40]] } },
    { type: "Feature", properties: { name: "Subansiri", type: "tributary", length: 442, basin: "Brahmaputra" }, geometry: { type: "LineString", coordinates: [[93.00, 28.50], [93.80, 27.50], [94.10, 26.80]] } },
    { type: "Feature", properties: { name: "Manas", type: "tributary", length: 376, basin: "Brahmaputra" }, geometry: { type: "LineString", coordinates: [[91.00, 27.50], [91.30, 26.80], [90.60, 26.20]] } },
    { type: "Feature", properties: { name: "Kosi", type: "tributary", length: 729, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[86.50, 27.80], [86.80, 26.50], [87.00, 25.50], [87.20, 25.40]] } },
    { type: "Feature", properties: { name: "Gandak", type: "tributary", length: 630, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[83.50, 28.00], [84.00, 27.20], [84.80, 26.50], [85.10, 25.60]] } },
    { type: "Feature", properties: { name: "Ghaghara", type: "tributary", length: 1080, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[81.00, 29.50], [81.50, 28.20], [82.50, 27.00], [83.80, 26.20], [84.70, 25.70]] } },
    { type: "Feature", properties: { name: "Gomti", type: "tributary", length: 900, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[80.00, 28.50], [80.50, 27.50], [81.00, 26.80], [82.00, 26.00], [83.00, 25.50]] } },
    { type: "Feature", properties: { name: "Betwa", type: "tributary", length: 590, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[77.50, 23.00], [78.20, 24.50], [78.80, 25.50], [79.60, 25.90]] } },
    { type: "Feature", properties: { name: "Ken", type: "tributary", length: 427, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[80.20, 23.80], [80.00, 24.50], [80.10, 25.20], [80.30, 25.80]] } },
    { type: "Feature", properties: { name: "Hooghly", type: "tributary", length: 260, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[88.10, 24.00], [88.30, 23.50], [88.40, 22.80], [88.10, 21.80]] } },
    { type: "Feature", properties: { name: "Barak", type: "major", length: 900, basin: "Brahmaputra" }, geometry: { type: "LineString", coordinates: [[94.00, 25.50], [93.50, 24.80], [92.50, 24.80], [92.20, 25.20], [91.80, 24.80]] } },
    { type: "Feature", properties: { name: "Alaknanda", type: "tributary", length: 190, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[79.31, 30.74], [79.35, 30.26], [78.60, 30.15]] } },
    { type: "Feature", properties: { name: "Bhagirathi", type: "tributary", length: 205, basin: "Ganga" }, geometry: { type: "LineString", coordinates: [[79.08, 30.99], [78.44, 30.73], [78.60, 30.15]] } },
    { type: "Feature", properties: { name: "Zanskar", type: "tributary", length: 300, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[77.20, 33.10], [76.80, 33.80], [77.30, 34.15]] } },
    { type: "Feature", properties: { name: "Shyok", type: "tributary", length: 550, basin: "Indus" }, geometry: { type: "LineString", coordinates: [[78.00, 35.20], [77.50, 34.80], [76.50, 34.80], [76.00, 35.10]] } },
  ],
};

// ── Mountain Peaks, Passes & Range Labels ──────────────────────────────────────────────
type MountainProps = { name: string; type: "peak" | "pass"; elevation?: number; range?: string; };

export const MOUNTAINS: FeatureCollection<Point, MountainProps> = {
  type: "FeatureCollection",
  features: [
    // Peaks
    { type: "Feature", properties: { name: "K2", type: "peak", elevation: 8611, range: "Karakoram" }, geometry: { type: "Point", coordinates: [76.51, 35.88] } },
    { type: "Feature", properties: { name: "Kangchenjunga", type: "peak", elevation: 8586, range: "Himalayas" }, geometry: { type: "Point", coordinates: [88.15, 27.70] } },
    { type: "Feature", properties: { name: "Nanda Devi", type: "peak", elevation: 7816, range: "Himalayas" }, geometry: { type: "Point", coordinates: [79.97, 30.37] } },
    { type: "Feature", properties: { name: "Nanga Parbat", type: "peak", elevation: 8126, range: "Himalayas" }, geometry: { type: "Point", coordinates: [74.59, 35.24] } },
    { type: "Feature", properties: { name: "Kamet", type: "peak", elevation: 7756, range: "Himalayas" }, geometry: { type: "Point", coordinates: [79.59, 30.92] } },
    { type: "Feature", properties: { name: "Anamudi", type: "peak", elevation: 2695, range: "Western Ghats" }, geometry: { type: "Point", coordinates: [77.06, 10.17] } },
    { type: "Feature", properties: { name: "Guru Shikhar", type: "peak", elevation: 1722, range: "Aravalli" }, geometry: { type: "Point", coordinates: [72.78, 24.60] } },
    { type: "Feature", properties: { name: "Doddabetta", type: "peak", elevation: 2637, range: "Nilgiri" }, geometry: { type: "Point", coordinates: [76.74, 11.40] } },
    { type: "Feature", properties: { name: "Saramati", type: "peak", elevation: 3841, range: "Patkai" }, geometry: { type: "Point", coordinates: [95.05, 25.73] } },
    { type: "Feature", properties: { name: "Namcha Barwa", type: "peak", elevation: 7782, range: "Himalayas" }, geometry: { type: "Point", coordinates: [95.06, 29.63] } },
    { type: "Feature", properties: { name: "Trisul", type: "peak", elevation: 7120, range: "Himalayas" }, geometry: { type: "Point", coordinates: [79.77, 30.31] } },
    { type: "Feature", properties: { name: "Saddle Peak", type: "peak", elevation: 731, range: "Andaman" }, geometry: { type: "Point", coordinates: [93.00, 13.15] } },
    { type: "Feature", properties: { name: "Agasthyamalai", type: "peak", elevation: 1868, range: "Western Ghats" }, geometry: { type: "Point", coordinates: [77.24, 8.61] } },
    { type: "Feature", properties: { name: "Kalsubai", type: "peak", elevation: 1646, range: "Western Ghats" }, geometry: { type: "Point", coordinates: [73.71, 19.60] } },
    { type: "Feature", properties: { name: "Parasnath", type: "peak", elevation: 1365, range: "Chota Nagpur" }, geometry: { type: "Point", coordinates: [86.13, 23.96] } },
    { type: "Feature", properties: { name: "Phawngpui (Blue Mt.)", type: "peak", elevation: 2157, range: "Mizo Hills" }, geometry: { type: "Point", coordinates: [93.04, 22.63] } },

    // Passes
    { type: "Feature", properties: { name: "Khardung La", type: "pass", elevation: 5359, range: "Ladakh" }, geometry: { type: "Point", coordinates: [77.60, 34.28] } },
    { type: "Feature", properties: { name: "Rohtang Pass", type: "pass", elevation: 3978, range: "Pir Panjal" }, geometry: { type: "Point", coordinates: [77.25, 32.37] } },
    { type: "Feature", properties: { name: "Nathu La", type: "pass", elevation: 4310, range: "Himalayas" }, geometry: { type: "Point", coordinates: [88.83, 27.39] } },
    { type: "Feature", properties: { name: "Zoji La", type: "pass", elevation: 3528, range: "Great Himalayas" }, geometry: { type: "Point", coordinates: [75.49, 34.30] } },
    { type: "Feature", properties: { name: "Banihal Pass", type: "pass", elevation: 2832, range: "Pir Panjal" }, geometry: { type: "Point", coordinates: [75.09, 33.50] } },
    { type: "Feature", properties: { name: "Bomdi La", type: "pass", elevation: 2217, range: "Himalayas" }, geometry: { type: "Point", coordinates: [92.42, 27.26] } },
    { type: "Feature", properties: { name: "Shipki La", type: "pass", elevation: 4500, range: "Great Himalayas" }, geometry: { type: "Point", coordinates: [78.76, 31.78] } },
    { type: "Feature", properties: { name: "Palghat Gap", type: "pass", elevation: 140, range: "Western Ghats" }, geometry: { type: "Point", coordinates: [76.67, 10.75] } },
    { type: "Feature", properties: { name: "Bhor Ghat", type: "pass", elevation: 625, range: "Western Ghats" }, geometry: { type: "Point", coordinates: [73.47, 18.66] } },
    { type: "Feature", properties: { name: "Thal Ghat", type: "pass", elevation: 583, range: "Western Ghats" }, geometry: { type: "Point", coordinates: [73.58, 19.65] } },
    { type: "Feature", properties: { name: "Lipulekh", type: "pass", elevation: 5334, range: "Himalayas" }, geometry: { type: "Point", coordinates: [81.00, 30.22] } },
    { type: "Feature", properties: { name: "Niti Pass", type: "pass", elevation: 5800, range: "Himalayas" }, geometry: { type: "Point", coordinates: [79.88, 30.93] } },
    { type: "Feature", properties: { name: "Jelep La", type: "pass", elevation: 4267, range: "Himalayas" }, geometry: { type: "Point", coordinates: [88.88, 27.35] } },
    { type: "Feature", properties: { name: "Sela Pass", type: "pass", elevation: 4170, range: "Himalayas" }, geometry: { type: "Point", coordinates: [92.10, 27.50] } },
    { type: "Feature", properties: { name: "Karakoram Pass", type: "pass", elevation: 5540, range: "Karakoram" }, geometry: { type: "Point", coordinates: [77.82, 35.51] } },
    { type: "Feature", properties: { name: "Shencottah Gap", type: "pass", elevation: 175, range: "Cardamom Hills" }, geometry: { type: "Point", coordinates: [77.20, 8.97] } },
    { type: "Feature", properties: { name: "Haldighati Pass", type: "pass", elevation: 395, range: "Aravalli" }, geometry: { type: "Point", coordinates: [73.80, 24.89] } },
    { type: "Feature", properties: { name: "Mana Pass", type: "pass", elevation: 5545, range: "Himalayas" }, geometry: { type: "Point", coordinates: [79.25, 31.06] } },
    { type: "Feature", properties: { name: "Bara-lacha La", type: "pass", elevation: 4890, range: "Zaskar" }, geometry: { type: "Point", coordinates: [77.41, 32.82] } },
    { type: "Feature", properties: { name: "Diphu Pass", type: "pass", elevation: 4321, range: "Patkai" }, geometry: { type: "Point", coordinates: [97.35, 28.21] } },
    { type: "Feature", properties: { name: "Pangsau Pass", type: "pass", elevation: 1136, range: "Patkai" }, geometry: { type: "Point", coordinates: [96.15, 27.24] } },
    { type: "Feature", properties: { name: "Aghil Pass", type: "pass", elevation: 4805, range: "Karakoram" }, geometry: { type: "Point", coordinates: [76.55, 36.18] } },
    { type: "Feature", properties: { name: "Mintaka Pass", type: "pass", elevation: 4709, range: "Karakoram" }, geometry: { type: "Point", coordinates: [74.85, 36.95] } },
    { type: "Feature", properties: { name: "Burzil Pass", type: "pass", elevation: 4100, range: "Himalayas" }, geometry: { type: "Point", coordinates: [75.10, 35.15] } },
    { type: "Feature", properties: { name: "Pir Panjal Pass", type: "pass", elevation: 3490, range: "Pir Panjal" }, geometry: { type: "Point", coordinates: [74.52, 33.60] } },
    { type: "Feature", properties: { name: "Chang La", type: "pass", elevation: 5360, range: "Ladakh" }, geometry: { type: "Point", coordinates: [77.93, 34.04] } },
    { type: "Feature", properties: { name: "Lanak La", type: "pass", elevation: 5466, range: "Ladakh" }, geometry: { type: "Point", coordinates: [79.52, 34.37] } },
    { type: "Feature", properties: { name: "Pensi La", type: "pass", elevation: 4400, range: "Zaskar" }, geometry: { type: "Point", coordinates: [76.36, 33.85] } },
    { type: "Feature", properties: { name: "Lungalacha La", type: "pass", elevation: 5059, range: "Zaskar" }, geometry: { type: "Point", coordinates: [77.63, 33.10] } },
    { type: "Feature", properties: { name: "Thaga La", type: "pass", elevation: 5300, range: "Himalayas" }, geometry: { type: "Point", coordinates: [79.25, 31.18] } },
    { type: "Feature", properties: { name: "Mangsha Dhura", type: "pass", elevation: 5490, range: "Himalayas" }, geometry: { type: "Point", coordinates: [80.35, 30.25] } },
    { type: "Feature", properties: { name: "Muling La", type: "pass", elevation: 5669, range: "Himalayas" }, geometry: { type: "Point", coordinates: [79.05, 31.20] } },
    { type: "Feature", properties: { name: "Debsa Pass", type: "pass", elevation: 5360, range: "Himalayas" }, geometry: { type: "Point", coordinates: [77.65, 32.15] } },
    { type: "Feature", properties: { name: "Bhabha Pass", type: "pass", elevation: 4890, range: "Himalayas" }, geometry: { type: "Point", coordinates: [78.02, 31.55] } },
    { type: "Feature", properties: { name: "Bum La", type: "pass", elevation: 4600, range: "Himalayas" }, geometry: { type: "Point", coordinates: [91.89, 27.71] } },
    { type: "Feature", properties: { name: "Yonggyap Pass", type: "pass", elevation: 3962, range: "Himalayas" }, geometry: { type: "Point", coordinates: [95.53, 29.18] } },
    { type: "Feature", properties: { name: "Dihang Pass", type: "pass", elevation: 4000, range: "Himalayas" }, geometry: { type: "Point", coordinates: [95.83, 29.07] } },
    { type: "Feature", properties: { name: "Goram Ghat", type: "pass", elevation: 900, range: "Aravalli" }, geometry: { type: "Point", coordinates: [73.85, 25.40] } },
    { type: "Feature", properties: { name: "Asirgarh Pass", type: "pass", elevation: 260, range: "Satpura" }, geometry: { type: "Point", coordinates: [76.28, 21.46] } },
    { type: "Feature", properties: { name: "Gompas", type: "peak", elevation: 5100, range: "Himalayas" }, geometry: { type: "Point", coordinates: [78.01, 31.62] } },
    { type: "Feature", properties: { name: "Mount Diavolo", type: "peak", elevation: 730, range: "Andaman" }, geometry: { type: "Point", coordinates: [92.95, 12.91] } },
    { type: "Feature", properties: { name: "Dhaula Dhar", type: "peak", elevation: 5639, range: "Lesser Himalayas" }, geometry: { type: "Point", coordinates: [76.32, 32.22] } },
  ],
};

// ── National Parks & Sanctuaries (Protected Areas) ────────────────────────────────────────────────
type ParkProps = { name: string; state: string; unesco?: boolean; category: "NP" | "TR" | "WLS" | "BR" };

export const NATIONAL_PARKS: FeatureCollection<Point, ParkProps> = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Jim Corbett NP", state: "Uttarakhand", category: "NP" }, geometry: { type: "Point", coordinates: [78.78, 29.53] } },
    { type: "Feature", properties: { name: "Kaziranga NP", state: "Assam", unesco: true, category: "NP" }, geometry: { type: "Point", coordinates: [93.17, 26.58] } },
    { type: "Feature", properties: { name: "Ranthambore NP", state: "Rajasthan", category: "TR" }, geometry: { type: "Point", coordinates: [76.50, 26.02] } },
    { type: "Feature", properties: { name: "Sundarbans NP", state: "West Bengal", unesco: true, category: "BR" }, geometry: { type: "Point", coordinates: [88.90, 21.94] } },
    { type: "Feature", properties: { name: "Gir NP", state: "Gujarat", category: "NP" }, geometry: { type: "Point", coordinates: [70.79, 21.12] } },
    { type: "Feature", properties: { name: "Periyar NP", state: "Kerala", category: "TR" }, geometry: { type: "Point", coordinates: [77.17, 9.47] } },
    { type: "Feature", properties: { name: "Bandipur NP", state: "Karnataka", category: "TR" }, geometry: { type: "Point", coordinates: [76.63, 11.66] } },
    { type: "Feature", properties: { name: "Kanha NP", state: "Madhya Pradesh", category: "TR" }, geometry: { type: "Point", coordinates: [80.61, 22.28] } },
    { type: "Feature", properties: { name: "Bandhavgarh NP", state: "Madhya Pradesh", category: "TR" }, geometry: { type: "Point", coordinates: [81.00, 23.72] } },
    { type: "Feature", properties: { name: "Valley of Flowers NP", state: "Uttarakhand", unesco: true, category: "NP" }, geometry: { type: "Point", coordinates: [79.65, 30.72] } },
    { type: "Feature", properties: { name: "Nanda Devi NP", state: "Uttarakhand", unesco: true, category: "BR" }, geometry: { type: "Point", coordinates: [79.97, 30.40] } },
    { type: "Feature", properties: { name: "Hemis NP", state: "Ladakh", category: "NP" }, geometry: { type: "Point", coordinates: [77.40, 33.80] } },
    { type: "Feature", properties: { name: "Great Himalayan NP", state: "Himachal Pradesh", unesco: true, category: "NP" }, geometry: { type: "Point", coordinates: [77.45, 31.75] } },
    { type: "Feature", properties: { name: "Khangchendzonga NP", state: "Sikkim", unesco: true, category: "BR" }, geometry: { type: "Point", coordinates: [88.40, 27.60] } },
    { type: "Feature", properties: { name: "Namdapha NP", state: "Arunachal Pradesh", category: "TR" }, geometry: { type: "Point", coordinates: [96.40, 27.50] } },
    { type: "Feature", properties: { name: "Manas NP", state: "Assam", unesco: true, category: "BR" }, geometry: { type: "Point", coordinates: [91.00, 26.70] } },
    { type: "Feature", properties: { name: "Keoladeo NP", state: "Rajasthan", unesco: true, category: "NP" }, geometry: { type: "Point", coordinates: [77.52, 27.17] } },
    { type: "Feature", properties: { name: "Simlipal NP", state: "Odisha", category: "BR" }, geometry: { type: "Point", coordinates: [86.33, 21.83] } },
    { type: "Feature", properties: { name: "Bhitarkanika NP", state: "Odisha", category: "NP" }, geometry: { type: "Point", coordinates: [87.00, 20.72] } },
    { type: "Feature", properties: { name: "Dudhwa NP", state: "Uttar Pradesh", category: "TR" }, geometry: { type: "Point", coordinates: [80.58, 28.63] } },
    { type: "Feature", properties: { name: "Silent Valley NP", state: "Kerala", category: "NP" }, geometry: { type: "Point", coordinates: [76.43, 11.08] } },
    { type: "Feature", properties: { name: "Tadoba NP", state: "Maharashtra", category: "TR" }, geometry: { type: "Point", coordinates: [79.37, 20.23] } },
    { type: "Feature", properties: { name: "Panna NP", state: "Madhya Pradesh", category: "TR" }, geometry: { type: "Point", coordinates: [80.05, 24.72] } },
    { type: "Feature", properties: { name: "Keibul Lamjao NP", state: "Manipur", category: "NP" }, geometry: { type: "Point", coordinates: [93.80, 24.50] } },
    { type: "Feature", properties: { name: "Dachigam NP", state: "Jammu and Kashmir", category: "NP" }, geometry: { type: "Point", coordinates: [75.08, 34.10] } },
    { type: "Feature", properties: { name: "Nagarhole NP", state: "Karnataka", category: "TR" }, geometry: { type: "Point", coordinates: [76.16, 12.02] } },
    { type: "Feature", properties: { name: "Mudumalai NP", state: "Tamil Nadu", category: "TR" }, geometry: { type: "Point", coordinates: [76.54, 11.58] } },
    { type: "Feature", properties: { name: "Wayanad WLS", state: "Kerala", category: "WLS" }, geometry: { type: "Point", coordinates: [76.22, 11.75] } },
    { type: "Feature", properties: { name: "Sariska TR", state: "Rajasthan", category: "TR" }, geometry: { type: "Point", coordinates: [76.40, 27.32] } },
    { type: "Feature", properties: { name: "Pench TR", state: "Madhya Pradesh", category: "TR" }, geometry: { type: "Point", coordinates: [79.25, 21.65] } },
    { type: "Feature", properties: { name: "Pakke TR", state: "Arunachal Pradesh", category: "TR" }, geometry: { type: "Point", coordinates: [92.95, 27.05] } },
    { type: "Feature", properties: { name: "Nameri NP", state: "Assam", category: "NP" }, geometry: { type: "Point", coordinates: [92.85, 26.93] } },
    { type: "Feature", properties: { name: "Dibru-Saikhowa NP", state: "Assam", category: "BR" }, geometry: { type: "Point", coordinates: [95.30, 27.65] } },
    { type: "Feature", properties: { name: "Kuno NP", state: "Madhya Pradesh", category: "NP" }, geometry: { type: "Point", coordinates: [77.10, 25.68] } },
    { type: "Feature", properties: { name: "Desert NP", state: "Rajasthan", category: "NP" }, geometry: { type: "Point", coordinates: [70.50, 26.50] } },
    { type: "Feature", properties: { name: "Gulf of Mannar NP", state: "Tamil Nadu", unesco: true, category: "BR" }, geometry: { type: "Point", coordinates: [78.60, 9.00] } },
    { type: "Feature", properties: { name: "Marine NP", state: "Gujarat", category: "NP" }, geometry: { type: "Point", coordinates: [69.75, 22.45] } },
    { type: "Feature", properties: { name: "Nokrek NP", state: "Meghalaya", unesco: true, category: "BR" }, geometry: { type: "Point", coordinates: [90.32, 25.48] } },
    { type: "Feature", properties: { name: "Balpakram NP", state: "Meghalaya", category: "NP" }, geometry: { type: "Point", coordinates: [90.85, 25.26] } },
    { type: "Feature", properties: { name: "Mount Harriet NP", state: "Andaman", category: "NP" }, geometry: { type: "Point", coordinates: [92.73, 11.75] } },
    { type: "Feature", properties: { name: "Papikonda NP", state: "Andhra Pradesh", category: "NP" }, geometry: { type: "Point", coordinates: [81.56, 17.51] } },
    { type: "Feature", properties: { name: "Sri Venkateswara NP", state: "Andhra Pradesh", category: "BR" }, geometry: { type: "Point", coordinates: [79.35, 13.80] } },
    { type: "Feature", properties: { name: "Valmiki NP", state: "Bihar", category: "TR" }, geometry: { type: "Point", coordinates: [84.14, 27.35] } },
    { type: "Feature", properties: { name: "Indravati NP", state: "Chhattisgarh", category: "TR" }, geometry: { type: "Point", coordinates: [80.35, 19.38] } },
    { type: "Feature", properties: { name: "Mollem NP", state: "Goa", category: "NP" }, geometry: { type: "Point", coordinates: [74.25, 15.35] } },
    { type: "Feature", properties: { name: "Blackbuck NP", state: "Gujarat", category: "NP" }, geometry: { type: "Point", coordinates: [72.03, 25.04] } },
    { type: "Feature", properties: { name: "Kalesar NP", state: "Haryana", category: "NP" }, geometry: { type: "Point", coordinates: [77.56, 30.34] } },
    { type: "Feature", properties: { name: "Pin Valley NP", state: "Himachal Pradesh", category: "NP" }, geometry: { type: "Point", coordinates: [78.02, 31.90] } },
    { type: "Feature", properties: { name: "Betla NP", state: "Jharkhand", category: "NP" }, geometry: { type: "Point", coordinates: [84.19, 23.86] } },
    { type: "Feature", properties: { name: "Anshi NP", state: "Karnataka", category: "TR" }, geometry: { type: "Point", coordinates: [74.37, 15.02] } },
    { type: "Feature", properties: { name: "Eravikulam NP", state: "Kerala", category: "NP" }, geometry: { type: "Point", coordinates: [77.06, 10.21] } },
    { type: "Feature", properties: { name: "Madhav NP", state: "Madhya Pradesh", category: "NP" }, geometry: { type: "Point", coordinates: [77.72, 25.56] } },
    { type: "Feature", properties: { name: "Sanjay Gandhi NP", state: "Maharashtra", category: "NP" }, geometry: { type: "Point", coordinates: [72.91, 19.22] } },
    { type: "Feature", properties: { name: "Ntangki NP", state: "Nagaland", category: "NP" }, geometry: { type: "Point", coordinates: [93.42, 25.57] } },
    { type: "Feature", properties: { name: "Khangchendzonga", state: "Sikkim", unesco: true, category: "BR" }, geometry: { type: "Point", coordinates: [88.16, 27.70] } },
    { type: "Feature", properties: { name: "Mukurthi NP", state: "Tamil Nadu", category: "NP" }, geometry: { type: "Point", coordinates: [76.54, 11.26] } },
    { type: "Feature", properties: { name: "Clouded Leopard NP", state: "Tripura", category: "NP" }, geometry: { type: "Point", coordinates: [91.24, 23.51] } },
  ],
};

// ── Mountain range polylines (for explicit click selection and subtle rendering) ────────────────
export const MOUNTAIN_RANGES: FeatureCollection<LineString, { name: string, type: string }> = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Western Ghats", type: "ghats" }, geometry: { type: "LineString", coordinates: [[73.40, 20.80], [73.50, 19.60], [73.60, 18.40], [74.10, 16.50], [75.10, 14.50], [75.60, 13.00], [76.20, 11.80], [76.80, 11.00], [77.00, 10.20], [77.10, 8.80]] } },
    { type: "Feature", properties: { name: "Eastern Ghats", type: "ghats" }, geometry: { type: "LineString", coordinates: [[86.00, 21.50], [84.80, 19.80], [83.50, 18.50], [80.50, 16.00], [79.50, 14.50], [79.00, 12.50], [78.30, 11.50]] } },
    { type: "Feature", properties: { name: "Aravalli", type: "range" }, geometry: { type: "LineString", coordinates: [[77.10, 28.60], [76.10, 27.60], [75.30, 26.90], [74.50, 26.20], [73.80, 25.50], [73.30, 24.70], [72.80, 24.10]] } },
    { type: "Feature", properties: { name: "Vindhya", type: "range" }, geometry: { type: "LineString", coordinates: [[82.00, 24.00], [81.00, 23.70], [80.00, 23.50], [79.00, 23.50], [78.00, 23.60], [77.00, 23.70], [76.00, 23.50]] } },
    { type: "Feature", properties: { name: "Satpura", type: "range" }, geometry: { type: "LineString", coordinates: [[81.50, 22.80], [80.50, 22.40], [79.50, 22.10], [78.50, 21.90], [77.50, 21.80], [76.50, 21.70]] } },
    { type: "Feature", properties: { name: "Greater Himalayas", type: "range" }, geometry: { type: "LineString", coordinates: [[74.40, 35.20], [75.50, 34.40], [77.00, 33.80], [78.00, 31.80], [79.50, 30.70], [80.50, 30.20], [82.00, 29.80], [84.00, 28.80], [86.00, 28.00], [88.00, 27.60], [89.50, 27.40], [92.00, 27.60], [94.00, 28.00], [96.00, 28.40]] } },
    { type: "Feature", properties: { name: "Shivalik Hills", type: "range" }, geometry: { type: "LineString", coordinates: [[74.00, 32.80], [75.50, 31.80], [77.00, 30.80], [78.50, 30.20], [80.00, 28.80], [82.00, 27.80], [84.50, 27.00], [86.50, 26.50], [88.00, 26.80]] } },
    { type: "Feature", properties: { name: "Karakoram", type: "range" }, geometry: { type: "LineString", coordinates: [[74.50, 36.80], [75.50, 36.20], [76.50, 35.80], [77.50, 35.20], [78.50, 34.50]] } },
    { type: "Feature", properties: { name: "Pir Panjal", type: "range" }, geometry: { type: "LineString", coordinates: [[73.80, 34.20], [74.50, 33.80], [75.50, 33.40], [76.50, 32.80], [77.00, 32.30]] } },
    { type: "Feature", properties: { name: "Ladakh Range", type: "range" }, geometry: { type: "LineString", coordinates: [[76.00, 35.00], [77.00, 34.50], [78.00, 34.00], [78.50, 33.50]] } },
    { type: "Feature", properties: { name: "Zaskar Range", type: "range" }, geometry: { type: "LineString", coordinates: [[76.50, 34.20], [77.50, 33.70], [78.50, 33.00]] } },
    { type: "Feature", properties: { name: "Patkai Range", type: "range" }, geometry: { type: "LineString", coordinates: [[94.00, 28.00], [95.50, 27.50], [96.50, 27.00], [97.00, 26.50]] } },
    { type: "Feature", properties: { name: "Garo Hills", type: "range" }, geometry: { type: "LineString", coordinates: [[90.00, 25.50], [90.50, 25.30]] } },
    { type: "Feature", properties: { name: "Khasi Hills", type: "range" }, geometry: { type: "LineString", coordinates: [[91.00, 25.40], [91.50, 25.20]] } },
    { type: "Feature", properties: { name: "Jaintia Hills", type: "range" }, geometry: { type: "LineString", coordinates: [[92.00, 25.30], [92.50, 25.10]] } },
  ],
}

// ── Specialized Quiz Generator ──────────────────────────────────────────────────────────

export function generateFeatureQuizQuestion(
  category: "river" | "mountain" | "park",
  basinFilter?: string
): any {
  let features: any[] = [];
  
  if (category === "river") {
    features = RIVERS.features.filter(f => !basinFilter || (f.properties as any).basin === basinFilter);
  } else if (category === "mountain") {
    features = MOUNTAINS.features;
  } else if (category === "park") {
    features = NATIONAL_PARKS.features;
  }

  if (features.length === 0) return null;
  
  const feature = features[Math.floor(Math.random() * features.length)]!;
  const props = feature.properties as any;
  
  let promptText = "";
  if (category === "river") promptText = `Find River: ${props.name}`;
  else if (category === "mountain") promptText = `Find: ${props.name} ${props.type === "peak" ? "Peak" : "Pass"}`;
  else if (category === "park") promptText = `Find: ${props.name}`;

  return {
    type: "identify_feature",
    prompt: promptText,
    correctFeature: { ...props, _category: category },
    correctOption: props.name,
  };
};
