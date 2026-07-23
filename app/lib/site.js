/**
 * Single source of truth for branding, author details and SEO copy.
 * Change the values here and every page, meta tag, sitemap entry and
 * structured-data block follows.
 */
export const site = {
  name: "Passport Photo Studio",
  shortName: "PassportPhoto",
  // Set NEXT_PUBLIC_SITE_URL in production so canonical URLs and social
  // card images resolve to real absolute addresses.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://passport-photo-studio.vercel.app",
  tagline: "Free passport photo maker with AI background removal",
  description:
    "Make passport size photos online for free. Upload a photo, remove the background with AI, choose a solid colour, and download a print-ready 4R sheet with 8 photos at 35 × 45 mm. Runs entirely in your browser — nothing is uploaded.",
  locale: "en_IN",
  keywords: [
    "passport size photo maker",
    "passport photo online free",
    "remove background from photo",
    "35x45 mm photo",
    "4R photo sheet",
    "8 passport photos on 4x6",
    "passport photo background changer",
    "visa photo maker",
    "print passport photo at home",
    "AI background remover",
  ],
};

/** Phrases cycled by the hero typewriter. The first one is server-rendered. */
export const useCases = [
  "passport applications",
  "visa forms",
  "PAN card & Aadhaar",
  "driving licences",
  "student ID cards",
  "job applications",
  "exam admit cards",
];

export const author = {
  // Derived from the project owner's email — edit this line to correct it.
  name: "Satyaswarupa Parida",
  role: "Developer",
  bio: "Built this because getting passport photos printed shouldn't mean a trip to a studio, an upload to a stranger's server, or paying for a watermark to be removed.",
  links: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "Email", href: "mailto:satyaswarupaparida130@gmail.com" },
  ],
};

export const faqs = [
  {
    q: "How many passport photos fit on 4R paper?",
    a: "Eight. A 35 × 45 mm photo lays out as a 4 × 2 grid on 6 × 4 inch (4R) paper, with a 2.5 mm gap between photos so there is room to cut. Guide lines run right across the sheet along every photo edge, so you can line up a ruler or paper trimmer once and cut straight through.",
  },
  {
    q: "Is my photo uploaded to a server?",
    a: "No. The AI background removal model runs inside your browser, so the photo never leaves your device. The model file is downloaded once on first use and then cached.",
  },
  {
    q: "Will the printed photo be exactly 35 × 45 mm?",
    a: "Yes, if you print the PDF. Its page is exactly the size of the photo paper, so any PDF reader prints it correctly — just choose 'Actual size' rather than 'Fit to page'. The JPG is best sent to a photo lab, where the pixel dimensions match 4R exactly. Printing an image file at home is less reliable, because viewers often rescale it to fill the paper. Measure one photo after the first print.",
  },
  {
    q: "What background colour should I use for a passport photo?",
    a: "Plain white is accepted almost everywhere, including India, the UK, the US and the EU. Light blue and light grey are accepted by some authorities. Check your specific requirements before printing.",
  },
  {
    q: "Which photo sizes are supported?",
    a: "35 × 45 mm (India, UK, EU, Australia), 2 × 2 inch (US passport), 33 × 48 mm (China visa), 50 × 70 mm, 35 × 35 mm square, and 25 × 35 mm and 20 × 25 mm stamp sizes.",
  },
  {
    q: "Does it cost anything or add a watermark?",
    a: "No. It is free, there is no sign-up, no watermark and no limit on the number of photos you make.",
  },
];

export const howToSteps = [
  { name: "Upload your photo", text: "Drag in any clear, front-facing photo. Phone photos are rotated automatically." },
  { name: "Let the AI remove the background", text: "A segmentation model cuts out the subject in your browser." },
  { name: "Pick a background colour", text: "Choose white, light blue, grey or any custom colour." },
  { name: "Choose the size", text: "Select 35 × 45 mm or another passport size, and your photo paper." },
  { name: "Download or print", text: "Get a print-ready PDF of 8 photos with cutting guides." },
];
