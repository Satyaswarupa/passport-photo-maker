# Passport Photo Studio

Upload a photo → AI removes the background → pick a solid colour and a photo size → download a print-ready sheet you can cut.

Everything runs in the browser. The photo is never uploaded to a server.

## Flow

1. **Upload** — drag and drop or browse. The file is re-encoded to a max 2000 px PNG with the EXIF orientation baked in, so phone photos are never sideways.
2. **Remove background** — an ONNX segmentation model (`isnet_fp16`) runs client-side. The model downloads once on first use and is then cached by the browser.
3. **Background** — eight presets (white, off-white, light blue, sky blue, grey, cream, red, green) plus a custom colour picker. "Original" keeps the photo's own background and is also the automatic fallback if the AI step fails.
4. **Position** — drag to move, wheel or slider to zoom. An optional overlay marks where the head and eye line should sit.
5. **Size and paper** — photo size (35 × 45 mm default) and paper (4R default), copies, and 300 or 600 DPI.
6. **Export** — sheet as JPG or PNG, a single photo as PNG, or print at exact physical size.

## The 4R sheet

On 4R paper (6 × 4 in / 152.4 × 101.6 mm) a 35 × 45 mm photo lays out as **4 × 2 = 8 photos**, with a **2.5 mm gap** between photos and the leftover space split evenly as the outer margin (~2.45 mm sides, ~4.55 mm top and bottom).

### Why 2.5 mm

Four 35 mm photos across 152.4 mm of paper leave 12.4 mm of slack to share between 3 gaps and 2 margins — five spaces — so 2.5 mm distributes it almost perfectly evenly. It is also close to the ceiling: at 3 mm only 1.7 mm of outer margin is left, which borderless lab printing can trim into, and past 3.4 mm the grid collapses to 3 × 2 = 6 photos. Tuning `GAP_MM` / `MARGIN_MM` in `app/lib/render.js` trades gap against margin against photo count; A4 and small stamp sizes lose a few cells at 2.5 mm, every 4R/5R/6R passport layout keeps its count.

### Cutting guides

One continuous line runs along every photo edge, spanning the full block and overhanging into the margin. Because the grid is regular, these lines only ever travel along an edge or through a gap — never across an image — so a ruler or guillotine can be lined up once and drawn straight across the sheet. Each pair of neighbours gets two lines with the gap between them: cut both, discard the thin offcut, and every photo keeps its full size.

Paper orientation is chosen automatically — whichever way round fits more photos wins.

## Printing at the correct size

Exported files carry real DPI metadata — a JFIF density header on JPEG, a `pHYs` chunk on PNG (`app/lib/dpiMetadata.js`). Without it `canvas.toBlob()` emits files with no physical size at all, and every desktop print path assumes 72 DPI and prints the sheet about four times too large.

- **Photo lab / print shop** — upload the JPG and order a 4R print. The pixel dimensions match 4R exactly (1800 × 1200 at 300 DPI), so it needs no adjustment. This is the reliable path.
- **Home printer** — set scale to **100%** and turn off "fit to page" / "fit to printable area". Browsers apply a few percent of shrink by default, which is enough to turn a 45 mm photo into a 43 mm one. No CSS can override this, so the print window shows a checklist and waits for you to press Print rather than opening the dialog over the top of it.

Always measure one photo after the first print.

## Files

| Path | Purpose |
| --- | --- |
| `app/page.js` | **Server component** — hero, how-it-works, sizes table, FAQ, JSON-LD |
| `app/layout.js` | Fonts and the full metadata block |
| `app/lib/site.js` | Author name, site URL, SEO copy, FAQ and how-to content |
| `app/lib/render.js` | mm↔px maths, sheet layout, canvas drawing, export, print |
| `app/lib/photoSizes.js` | Photo sizes, paper sizes, DPI and colour presets |
| `app/lib/dpiMetadata.js` | Writes real DPI into the encoded JPEG/PNG bytes |
| `app/lib/backgroundRemoval.js` | Lazy-loaded wrapper around the segmentation model |
| `app/components/PassportStudio.jsx` | **Client component** — all editor state |
| `app/components/` | Dropzone, PhotoAdjuster, SheetPreview, Footer |
| `app/sitemap.js`, `robots.js`, `manifest.js`, `opengraph-image.js` | Generated SEO routes |

Only the editor is a client component. Everything else is static HTML, so crawlers get the headings, size table and FAQ without running JavaScript.

The crop transform (`zoom`, `tx`, `ty`) is resolution independent — `tx`/`ty` are fractions of the frame — so the same numbers drive the small on-screen preview and the full 300/600 DPI export.

## Neumorphic design system

Defined once in `app/globals.css`. Surfaces share the page background and are separated by a light and a dark shadow rather than borders:

| Class | Use |
| --- | --- |
| `.nm-raised` / `-sm` / `-lg` | Extruded surfaces — panels, cards |
| `.nm-inset` / `-sm` | Recessed wells — previews, inputs, the dropzone |
| `.nm-btn` | Raised at rest, pressed in on `:active` |
| `.nm-btn-accent` / `.nm-btn-active` | Primary action / selected state |
| `.nm-select`, `.nm-range`, `.nm-check` | Form controls in the same language |

Two constraints worth keeping:

- **Never mix `ring-*` with `.nm-*`.** Tailwind's ring composes into `box-shadow`, which the neumorphic classes already own, so the two clobber each other. Use `outline-*` for selected and focus states — it is a separate property.
- **Soft applies to surfaces, not type.** Text colours stay high-contrast, and `:focus-visible` keeps a solid accent outline. Light and dark palettes are both defined via `prefers-color-scheme`.

## SEO

- Metadata: title template, description, keywords, canonical, Open Graph, Twitter card, robots directives, theme colour (`app/layout.js`, values from `app/lib/site.js`).
- Structured data: a single JSON-LD `@graph` with `WebApplication`, `Person`, `HowTo` and `FAQPage`, cross-linked by `@id`.
- Generated routes: `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, and an Open Graph card rendered at build time by `next/og`.
- On-page: one `h1`, ordered `h2`/`h3`, semantic landmarks, a captioned sizes table, and ~840 words of crawlable copy.

**Before deploying, set `NEXT_PUBLIC_SITE_URL`** to your real domain, or canonical URLs and social images will point at the placeholder in `app/lib/site.js`.

## Adding a size

Append to `PHOTO_SIZES` or `PAPER_SIZES` in `app/lib/photoSizes.js`. Dimensions are in millimetres; the grid, the sizes table and the structured data all recalculate.

## Licence note

Background removal uses [`@imgly/background-removal`](https://github.com/imgly/background-removal-js), which is **AGPL-3.0**. That is fine for personal and open-source use. If you plan to run this commercially without open-sourcing it, you need a commercial licence from IMG.LY, or swap `app/lib/backgroundRemoval.js` for another provider — it is the only file that touches the model.

## Development

```bash
pnpm dev     # http://localhost:3000
pnpm build
pnpm start
```
