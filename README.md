# The Compute Desk

Eight interactive pages on the economics of buying GPU compute, built as self-contained HTML.

**Live:** https://alexkyen.github.io/compute-desk/

## The pages

1. **The sellers** — the market itself: twelve sellers, eight accelerators, three ways to buy, every public price plotted on a log scale with gated allocations shown as absence. Compiled July 2026 from public rate cards, filings, and deal reporting.
2. **The supply book** — how much capacity to commit, and at what duration. A load-duration curve with a draggable commitment line; the optimal point falls out of the newsvendor critical ratio (commit a GPU when its expected utilization exceeds the reserved-to-on-demand price ratio).
3. **The NVIDIA generations** — the NVIDIA generations (H100 → H200 → B200 → B300 → Rubin) read from a buyer's point of view, with a per-metric view and a depreciation-clock argument for why deep multi-year discounts can be the wrong trade.
4. **The NVL72 rack** — a 3D take-apart model of the GB200 NVL72: the rack, the trays, the ~5,000-cable copper spine, and the GB200 superchip, staged as an argument for why the coherent machine — and the commercial unit — ends at the rack.
5. **The network tax** — what cluster wiring does to effective price. Interactive topology across InfiniBand/RoCE, oversubscription, and job placement, showing how identical GPUs price differently on interconnect alone.
6. **The two topologies** — fabric topology as a design choice. Fat-tree vs rail-optimized, interactive across three scenarios: why rails serve training collectives at a fraction of the switch and optics cost, what off-pattern traffic pays in NVLink detours, and how a single rail failure stalls every multi-node job at once.
7. **The pod** — a 3D datacenter row: eight compute racks, an end-of-row switch rack, and the overhead cable tray. The fat-tree snapped onto its hardware, oversubscription as fibers physically leaving the tray, and rails as a stripe of savings and blast radius painted down the row.
8. **The issues list** — every negotiable term of the reference deal, priced: what the draft says, what you ask for, the redline, and what each clause is worth against a configurable deal. The definition-of-"available" row embeds Exhibit A, the availability-SLA pricing model that shows why credits rarely cover real losses.

## Structure

Nine hand-maintained source pages, no build step, no generated files: `index.html` is
the contents page — cover, a ruled list of the eight pages, colophon — and each
page stands alone, directly linkable, served as-is by GitHub Pages from the
repo root. Position in the contents list is the page's number.

Every page is fully self-contained: its own CSS and JS, no shared stylesheets, no
frameworks, no external JS. Each page carries a top and bottom nav strip
(contents link plus prev/next); the ~20 lines of strip CSS are duplicated into every
file on purpose, so no page depends on another. Edit any page directly.

To add page 09: create the new file with its nav strip, add its row to the
contents list in `index.html`, and update the prev/next links on its two neighbors
(today that means giving 08 a next link, and pointing 09 back at 08).

Two of the pages are 3D companion views — `plate-nvl72.html` (04) and
`plate-pod.html` (07) — and they carry the site's one documented exception to the
no-external-JS rule: a pinned, minified Three.js build (r147, MIT) inlined into
each page, so both files remain fully self-contained and served as-is. Each plate
keeps a static SVG fallback and working stage copy when WebGL is unavailable.

## Notes

Framing after Modal, "How to price serverless" (2026). Hardware figures compiled July 2026;
Rubin-generation specs are pre-volume and marked accordingly in the NVIDIA generations. Atlas
prices are perishable; estimates and deal-reported figures are marked in their tooltips.
