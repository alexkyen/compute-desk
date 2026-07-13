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

## Build

The instruments are standalone HTML files, individually viewable. `consolidate.py`
embeds them as isolated `srcdoc` iframes directly into `index.html` — the page GitHub
Pages serves — so their scripts and element IDs never collide. To rebuild after editing
an instrument, or to add a new one:

```bash
python3 consolidate.py
```

Add or reorder instruments by editing the `(filename, title, description)` tuples in
`consolidate.py`, then rerun — list position is the instrument number. `index.html` is
generated — edit the instruments or the script, never the output.

## Notes

Framing after Modal, "How to price serverless" (2026). Hardware figures compiled July 2026;
Rubin-generation specs are pre-volume and marked accordingly in the silicon ladder. Atlas
prices are perishable; estimates and deal-reported figures are marked in their tooltips.
