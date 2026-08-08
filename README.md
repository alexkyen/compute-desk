# The Compute Desk

[The Compute Desk](https://alexkyen.github.io/compute-desk/) is a set of browser-based decision tools for GPU procurement, infrastructure planning, and contract negotiation. It turns public market evidence and explicit operating assumptions into planning ranges, comparison tables, bills of material, and negotiation work products.

The tools are designed for commercial and technical operators. They are not a quotation system, an engineering design package, or legal advice. Each model identifies its assumptions and links to the shared [methods and sources](https://alexkyen.github.io/compute-desk/methodology.html).

## Decision tools

| Tool | Decision supported | Practical output |
| --- | --- | --- |
| [Market atlas](https://alexkyen.github.io/compute-desk/the-atlas-scatter.html) | Is a quote inside the public market range? | Filterable price benchmark, source trail, and comparison CSV |
| [Capacity commitment](https://alexkyen.github.io/compute-desk/gpu-supply-book.html) | How much demand should be committed rather than bought on demand? | Critical-ratio commitment point, cost comparison, and scenario summary |
| [Accelerator lifecycle](https://alexkyen.github.io/compute-desk/silicon-ladder.html) | Which NVIDIA accelerator generation fits the workload and contract horizon? | Metric comparison and buyer diligence prompts |
| [NVL72 rack](https://alexkyen.github.io/compute-desk/plate-nvl72.html) | What is the technical and commercial boundary of the NVL72 system? | Staged 3D system view with a static fallback |
| [Network cost](https://alexkyen.github.io/compute-desk/the-fabric.html) | How does collective communication change effective GPU economics? | Communication-time estimate and effective-price proxy |
| [Topology planner](https://alexkyen.github.io/compute-desk/the-two-trees.html) | What does fat-tree versus rail-optimized fabric imply for equipment count and failure behavior? | Planning BOM and scenario comparison |
| [Pod layout](https://alexkyen.github.io/compute-desk/plate-pod.html) | How do logical network choices map into a representative row? | Staged 3D physicalization with oversubscription and failure views |
| [SLA and issues list](https://alexkyen.github.io/compute-desk/sla-anatomy.html) | Which commercial terms need escalation, and what exposure sits behind them? | Live SLA scenario, issue workflow, redline copy, and CSV export |

## Evidence and model boundaries

- Public prices are normalized to USD per GPU-hour, with configuration and source context kept visible. A plotted point is a benchmark observation, not an executable offer.
- Market evidence is graded as public list price, marketplace observation, reported deal, estimate, or model output. The atlas can exclude entries without a linked public source.
- Demand imports preserve a load-duration distribution rather than chronology. They do not forecast growth or correlated outages.
- Network outputs are planning proxies. Measured NCCL bandwidth can replace the default efficiency assumption, but the model does not reproduce application-level goodput.
- Topology counts are planning estimates under the displayed port, radix, plane, and oversubscription assumptions. They must be reconciled with a vendor BOM.
- Contract language is a composite negotiation aid. Exposure values are scenario values, not additive or probability-adjusted expected savings.

See [`methodology.html`](methodology.html) for the complete evidence grades, normalization rules, assumptions, and freshness policy.

## Repository structure

The site is intentionally lightweight and is served directly from the repository root by GitHub Pages.

- `index.html` — landing page and tool navigation
- `*.html` — eight directly linkable tools plus the methods page
- `assets/desk.css` — shared accessibility, action, and responsive styles
- `assets/desk.js` — URL-state, copy, print, export, and live-region helpers
- `assets/three-r147.min.js` — pinned local Three.js runtime used by the two 3D plates
- `scripts/check-site.mjs` — metadata, landmark, internal-link, and freshness checks
- `.github/workflows/site-check.yml` — pull-request and scheduled verification

The individual tools keep their distinctive page-specific presentation and logic. Shared assets cover only site-level behavior and repeated utility styles. Both 3D pages retain static SVG fallbacks when WebGL is unavailable.

## Local verification

No package install or build step is required. Serve the directory with any static HTTP server, then open `index.html`.

```sh
npm test
python3 -m http.server 4173
```

`npm test` uses only Node.js built-ins. The scheduled check fails when the atlas market-verification date is more than 45 days old, because stale price evidence should be visible before publication.

## Ownership and license

Designed, written, and implemented by Alex Yen. Corrections are welcome through [GitHub issues](https://github.com/alexkyen/compute-desk/issues).

Original code is available under the [MIT License](LICENSE). The pinned Three.js runtime retains its upstream MIT notice. Linked specifications, rate cards, filings, and reporting remain subject to their original terms.
