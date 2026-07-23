import PassportStudio from "./components/PassportStudio";
import Footer from "./components/Footer";
import Typewriter from "./components/Typewriter";
import Underline from "./components/Underline";
import { PHOTO_SIZES } from "./lib/photoSizes";
import { author, faqs, howToSteps, site, useCases } from "./lib/site";

/**
 * Server component: everything except the editor itself is static HTML, so
 * crawlers see the headings, the size table and the FAQ without running JS.
 */

export const metadata = {
  alternates: { canonical: "/" },
};

function StructuredData() {
  const graph = [
    {
      "@type": "WebApplication",
      "@id": `${site.url}/#app`,
      name: site.name,
      url: site.url,
      description: site.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any (web browser)",
      browserRequirements: "Requires JavaScript and a modern browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "AI background removal in the browser",
        "Solid background colour replacement",
        "35 × 45 mm and other passport sizes",
        "8 photos on a 4R (6 × 4 inch) sheet",
        "Cutting guides and 300/600 DPI export",
      ],
      author: { "@id": `${site.url}/#author` },
    },
    {
      "@type": "Person",
      "@id": `${site.url}/#author`,
      name: author.name,
      jobTitle: author.role,
    },
    {
      "@type": "HowTo",
      name: "How to make a passport size photo online",
      description: site.description,
      totalTime: "PT2M",
      step: howToSteps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.name,
        text: step.text,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

export default function Home() {
  return (
    <>
      <StructuredData />

      <header className="px-5 pt-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <a href="#tool" className="flex items-center gap-3">
            <span className="nm-raised flex h-11 w-11 items-center justify-center rounded-2xl">
              <svg
                className="h-5 w-5 text-nm-accent"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <rect x="4" y="3" width="16" height="18" rx="2" />
                <circle cx="12" cy="10" r="3" />
                <path strokeLinecap="round" d="M7.5 18a4.5 4.5 0 0 1 9 0" />
              </svg>
            </span>
            <span className="text-base font-bold tracking-tight text-nm-text">{site.name}</span>
          </a>

          <nav aria-label="Main" className="hidden gap-2 sm:flex">
            {[
              ["How it works", "#how-it-works"],
              ["Sizes", "#sizes"],
              ["FAQ", "#faq"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="nm-btn rounded-xl px-4 py-2 text-sm font-semibold"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 px-5">
        {/* ------------------------------- hero ------------------------------- */}
        <section className="mx-auto max-w-3xl pt-14 pb-12 text-center">
          <p className="nm-inset mx-auto mb-6 inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-nm-muted">
            Free · No sign-up · Nothing leaves your device
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.12] tracking-tight text-nm-text sm:text-5xl">
            Passport size photo maker with{" "}
            <Underline className="text-nm-accent">AI background removal</Underline>
          </h1>

          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 text-lg font-semibold text-nm-text sm:text-xl">
            <span>Ready for</span>
            <Typewriter
              words={useCases}
              srLabel={`Ready for ${useCases.slice(0, -1).join(", ")} and ${useCases.at(-1)}.`}
              className="text-nm-accent"
            />
          </p>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-nm-muted sm:text-lg">
            Upload a photo, let the AI cut out the background, pick a solid colour and size, then
            download a print-ready <strong className="text-nm-text">4R sheet with 8 photos</strong>{" "}
            at 35 × 45 mm — with cutting guides included.
          </p>
        </section>

        {/* ------------------------------- tool ------------------------------- */}
        <section id="tool" className="mx-auto max-w-6xl scroll-mt-8" aria-label="Passport photo editor">
          <PassportStudio />
        </section>

        {/* ---------------------------- how it works --------------------------- */}
        <section id="how-it-works" className="mx-auto mt-28 max-w-6xl scroll-mt-8">
          <SectionHeading
            eyebrow="How it works"
            title="Five steps to a printed passport photo"
            lead="No account, no upload, no watermark. The whole process runs in your browser."
          />
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {howToSteps.map((step, i) => (
              <li key={step.name} className="nm-raised flex flex-col rounded-2xl p-6">
                <span className="nm-inset mb-4 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-nm-accent">
                  {i + 1}
                </span>
                <h3 className="text-sm font-bold text-nm-text">{step.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-nm-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ------------------------------ features ----------------------------- */}
        <section className="mx-auto mt-28 max-w-6xl">
          <SectionHeading
            eyebrow="Why this one"
            title="Built to get the millimetres right"
            lead="Most free tools hand you a JPEG with no physical size and hope for the best."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "Private by design",
                "The segmentation model runs on your device. Your photo is never uploaded, stored or seen by anyone.",
              ],
              [
                "Correct print size",
                "Exports carry real DPI metadata, so a 35 × 45 mm photo measures 35 × 45 mm when it comes off the printer.",
              ],
              [
                "8 photos per 4R sheet",
                "A 4 × 2 grid on 6 × 4 inch paper with a 2.5 mm gap between photos, and guide lines running the full width and height so you can cut straight through with a ruler.",
              ],
              [
                "Any background colour",
                "White, off-white, light blue, sky blue, grey, cream, red, green — or any custom colour you need.",
              ],
              [
                "Face position guides",
                "An overlay shows where the head and eye line should sit, so the crop meets passport requirements.",
              ],
              [
                "Free and unlimited",
                "No sign-up, no credits, no watermark, no upsell to remove one. Make as many photos as you like.",
              ],
            ].map(([title, body]) => (
              <article key={title} className="nm-raised rounded-2xl p-6">
                <h3 className="text-base font-bold text-nm-text">{title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-nm-muted">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------------- sizes ------------------------------- */}
        <section id="sizes" className="mx-auto mt-28 max-w-6xl scroll-mt-8">
          <SectionHeading
            eyebrow="Supported sizes"
            title="Passport and visa photo dimensions"
            lead="Pick a preset and the sheet layout recalculates itself."
          />
          <div className="nm-raised mt-10 overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                <caption className="sr-only">
                  Supported passport photo sizes and where each is used
                </caption>
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-nm-muted">
                    <th scope="col" className="px-6 py-4 font-bold">Size</th>
                    <th scope="col" className="px-6 py-4 font-bold">Millimetres</th>
                    <th scope="col" className="px-6 py-4 font-bold">Commonly used for</th>
                  </tr>
                </thead>
                <tbody>
                  {PHOTO_SIZES.map((size) => (
                    <tr key={size.id} className="border-t border-nm-muted/15">
                      <th scope="row" className="px-6 py-4 font-semibold text-nm-text">
                        {size.label}
                      </th>
                      <td className="px-6 py-4 font-mono text-xs text-nm-muted">
                        {size.w} × {size.h} mm
                      </td>
                      <td className="px-6 py-4 text-nm-muted">{size.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* -------------------------------- faq -------------------------------- */}
        <section id="faq" className="mx-auto mt-28 max-w-3xl scroll-mt-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions people ask"
            lead="Everything about sizes, printing and privacy."
          />
          <div className="mt-10 flex flex-col gap-4">
            {faqs.map((item) => (
              <details key={item.q} className="nm-raised group rounded-2xl p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-nm-text">
                  {item.q}
                  <span className="nm-inset flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-nm-accent transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-nm-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function SectionHeading({ eyebrow, title, lead }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-nm-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-nm-text sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-nm-muted">{lead}</p>
    </div>
  );
}
