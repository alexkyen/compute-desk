# The Compute Desk

Six interactive instruments on the economics of GPU procurement, built as self-contained HTML.

**Live:** https://alexkyen.github.io/compute-desk/

## The instruments

1. **The atlas** — the market itself: twelve sellers, eleven accelerators, three ways to buy, every public price plotted on a log scale with gated allocations shown as absence. Compiled July 2026 from public rate cards, filings, and deal reporting.
2. **The supply book** — how much capacity to commit, and at what duration. A load-duration curve with a draggable commitment line; the optimal point falls out of the newsvendor critical ratio (commit a GPU when its expected utilization exceeds the reserved-to-on-demand price ratio).
3. **The silicon ladder** — the NVIDIA generations (H100 → H200 → B200 → B300 → Rubin) read from the buyer's chair, with a per-metric view and a depreciation-clock argument for why deep multi-year discounts can be the wrong trade.
4. **The fabric tax** — what cluster wiring does to effective price. Interactive topology across InfiniBand/RoCE, oversubscription, and job placement, showing how identical GPUs price differently on interconnect alone.
5. **The two trees** — fabric topology as a design choice. Fat-tree vs rail-optimized, interactive across three scenarios: why rails serve training collectives at a fraction of the switch and optics cost, what off-pattern traffic pays in NVLink detours, and how a single rail failure stalls every multi-node job at once.
6. **SLA anatomy** — an SLA as an insurance contract. A calculator over the definition of "unavailable," the measurement window, and credit tiers, showing why credits rarely cover real losses and what operational clauses matter instead.

Each instrument ends with the questions a buyer should ask a supplier.

## Structure

Seven hand-maintained source pages, no build step, no generated files: `index.html` is
the contents page — cover, a ruled list of the six instruments, colophon — and each
instrument is its own page, directly linkable, served as-is by GitHub Pages from the
repo root. Position in the contents list is the instrument's number.

Every page is fully self-contained: its own CSS and JS, no shared stylesheets, no
frameworks, no external JS. Each instrument carries a top and bottom nav strip
(contents link plus prev/next); the ~20 lines of strip CSS are duplicated into every
file on purpose, so no page depends on another. Edit any page directly.

To add instrument 07: create the new file with its nav strip, add its row to the
contents list in `index.html`, and update the prev/next links on its two neighbors
(today that means giving 06 a next link, and pointing 07 back at 06).

One companion plate sits outside the numbered sequence — `plate-nvl72.html`, a 3D
exploded model of the GB200 NVL72 rack, cross-linked from the silicon ladder and
the fabric tax rather than listed in the contents — and it carries the site's one
documented exception to the no-external-JS rule: a pinned, minified Three.js build
(r147, MIT) inlined into the page, so the file remains fully self-contained and
served as-is.

## Notes

Framing after Modal, "How to price serverless" (2026). Hardware figures compiled July 2026;
Rubin-generation specs are pre-volume and marked accordingly in the silicon ladder. Atlas
prices are perishable; estimates and deal-reported figures are marked in their tooltips.
