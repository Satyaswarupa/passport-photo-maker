import { author, site } from "../lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 px-5 pb-10">
      <div className="mx-auto max-w-6xl">
        <div className="nm-raised rounded-3xl p-8 sm:p-10">
          <div className="grid gap-10 md:grid-cols-[1.6fr_1fr_1fr]">
            {/* Author */}
            <div>
              <div className="flex items-center gap-4">
                <span className="nm-inset flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-nm-accent">
                  {author.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <p className="text-lg font-bold tracking-tight text-nm-text">{author.name}</p>
                  <p className="text-sm text-nm-muted">{author.role}</p>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-nm-muted">{author.bio}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {author.links.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="nm-btn rounded-xl px-4 py-2 text-sm font-semibold"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Product links */}
            <nav aria-label="Footer">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-nm-muted">
                {site.shortName}
              </h2>
              <ul className="space-y-2.5 text-sm text-nm-muted">
                {[
                  ["Make a photo", "#tool"],
                  ["How it works", "#how-it-works"],
                  ["Supported sizes", "#sizes"],
                  ["Questions", "#faq"],
                ].map(([label, href]) => (
                  <li key={href}>
                    <a href={href} className="transition hover:text-nm-accent">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Reassurance */}
            <div>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.12em] text-nm-muted">
                Good to know
              </h2>
              <ul className="space-y-2.5 text-sm text-nm-muted">
                <li>Photos never leave your device</li>
                <li>No sign-up, no watermark</li>
                <li>Free and unlimited</li>
                <li>Works offline after first load</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-nm-muted/15 pt-6 text-xs text-nm-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {year} {author.name}. Built with Next.js.
            </p>
            <p>
              {site.name} is a free tool. Always check your authority’s current photo requirements
              before submitting.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
