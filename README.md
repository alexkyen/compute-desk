# The Compute Desk

Four interactive instruments on the economics of GPU procurement, built as self-contained HTML.

**Live:** https://alexkyen.github.io/compute-desk/

## The instruments

1. **The supply book** — how much capacity to commit, and at what duration. A load-duration curve with a draggable commitment line; the optimal point falls out of the newsvendor critical ratio (commit a GPU when its expected utilization exceeds the reserved-to-on-demand price ratio).
2. **The silicon ladder** — the NVIDIA generations (H100 → H200 → B200 → B300 → Rubin) read from the buyer's chair, with a per-metric view and a depreciation-clock argument for why deep multi-year discounts can be the wrong trade.
3. **The fabric** — what cluster wiring does to effective price. Interactive topology across InfiniBand/RoCE, oversubscription, and job placement, showing how identical GPUs price differently on interconnect alone.
4. **SLA anatomy** — an SLA as an insurance contract. A calculator over the definition of "unavailable," the measurement window, and credit tiers, showing why credits rarely cover real losses and what operational clauses matter instead.

Each instrument ends with the questions a buyer should ask a supplier.

## Build

The four instruments are standalone HTML files. `consolidate.py` embeds them as isolated
`srcdoc` iframes into a single deliverable (`compute-desk.html` / `index.html`), so their
scripts and element IDs never collide. To rebuild after editing an instrument, or to add a
new one:

```bash
python3 consolidate.py
cp compute-desk.html index.html
```

Add a new instrument by appending one line to the `INSTRUMENTS` list in `consolidate.py`.

## Notes

Framing after Modal, "How to price serverless" (2026). Hardware figures compiled July 2026;
Rubin-generation specs are pre-volume and marked accordingly in the silicon ladder.
