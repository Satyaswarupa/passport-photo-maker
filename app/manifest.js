import { site } from "./lib/site";

export default function manifest() {
  return {
    name: `${site.name} — ${site.tagline}`,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#e6e9ef",
    theme_color: "#e6e9ef",
    categories: ["photo", "utilities", "productivity"],
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
