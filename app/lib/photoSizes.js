// All physical dimensions are in millimetres.

export const PHOTO_SIZES = [
  {
    id: "35x45",
    label: "35 × 45 mm",
    w: 35,
    h: 45,
    note: "India, UK, EU, Australia — the common passport size",
  },
  { id: "50x70", label: "50 × 70 mm", w: 50, h: 70, note: "Large passport / visa" },
  { id: "51x51", label: "2 × 2 in (51 × 51 mm)", w: 50.8, h: 50.8, note: "USA passport, Canada visa" },
  { id: "33x48", label: "33 × 48 mm", w: 33, h: 48, note: "China visa" },
  { id: "35x35", label: "35 × 35 mm", w: 35, h: 35, note: "Square ID photo" },
  { id: "25x35", label: "25 × 35 mm", w: 25, h: 35, note: "Stamp size" },
  { id: "20x25", label: "20 × 25 mm", w: 20, h: 25, note: "Small stamp size" },
];

export const PAPER_SIZES = [
  { id: "4r", label: '4R — 6 × 4 in', w: 152.4, h: 101.6, note: "Standard photo lab print" },
  { id: "5r", label: '5R — 7 × 5 in', w: 177.8, h: 127, note: "Larger photo paper" },
  { id: "6r", label: '6R — 8 × 6 in', w: 203.2, h: 152.4, note: "Extra large photo paper" },
  { id: "a4", label: "A4 — 210 × 297 mm", w: 210, h: 297, note: "Home printer paper" },
];

export const DPI_OPTIONS = [
  { id: 300, label: "300 DPI — print quality" },
  { id: 600, label: "600 DPI — lab quality" },
];

export const BG_PRESETS = [
  { id: "white", label: "White", color: "#FFFFFF" },
  { id: "offwhite", label: "Off white", color: "#F2F2F2" },
  { id: "lightblue", label: "Light blue", color: "#D6E4F0" },
  { id: "skyblue", label: "Sky blue", color: "#6EA8DC" },
  { id: "grey", label: "Grey", color: "#D9D9D9" },
  { id: "cream", label: "Cream", color: "#FAF3E3" },
  { id: "red", label: "Red", color: "#C0392B" },
  { id: "green", label: "Green", color: "#4CAF50" },
];

export const getPhotoSize = (id) => PHOTO_SIZES.find((s) => s.id === id) ?? PHOTO_SIZES[0];
export const getPaperSize = (id) => PAPER_SIZES.find((s) => s.id === id) ?? PAPER_SIZES[0];
