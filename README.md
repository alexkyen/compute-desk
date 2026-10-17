# The Compute Desk

**A practical guide to AI compute, from hardware to economics.**

The Compute Desk connects hardware, networking, capacity decisions, and contract terms to the cost of useful work. The homepage develops four questions through concise explanations and worked examples. Eight interactive models let readers change the assumptions, inspect the calculation, and export a scenario.

[Open the site](https://alexkyen.github.io/compute-desk/)

## The explorations

| | Start with a question | Try it |
| --- | --- | --- |
| 01 | [Inside an AI rack](plate-nvl72.html) | Turn a 72-GPU rack and take it apart in four chapters. |
| 02 | [From racks to a cluster](plate-pod.html) | Pull back to a row, trace connections, and inspect failures. |
| 03 | [Accelerator specifications](silicon-ladder.html) | Compare memory, bandwidth, compute, and power. |
| 04 | [The cost of moving data](the-fabric.html) | Change the network and see working time versus waiting. |
| 05 | [Network topology](the-two-trees.html) | Compare two layouts and take a switch offline. |
| 06 | [Sizing a GPU commitment](gpu-supply-book.html) | Move the capacity line and balance commitment against flexibility. |
| 07 | [Historical GPU prices](the-atlas-scatter.html) | Explore a dated market snapshot and compare sellers. |
| 08 | [GPU service agreements](sla-anatomy.html) | Apply different contract promises to the same outage. |

The homepage follows four chapters: hardware, networks, economics, and contracts. An always-visible model directory gives direct access to every tool. Existing page URLs and saved scenario parameters remain intact.

## Evidence and limits

The price atlas is an **archived July 2026 snapshot**, last verified on **22 July 2026**. Its original dates and source records are preserved. It is historical reference, not current pricing or executable availability. Hardware references retain their July verification labels, except for a targeted 16 October correction on the rack page: GB200 has 186 GB per GPU, derived from NVIDIA’s specification of 372 GB per two-GPU superchip. Standalone B200 specifications are unchanged. Other hardware sources have not been reverified. The atlas defaults to on-demand observations with source links; saved filters still take precedence.

Models are interactive planning aids. They do not replace vendor quotes, engineering designs, workload measurements, or legal advice. Imported demand preserves a distribution, not chronology. Network outputs are communication proxies, not application-level performance. Contract exposure values are not additive or probability-adjusted savings.

[Methods and sources](methodology.html) explains the evidence grades, normalization rules, model boundaries, and archive policy. Each exploration retains its own relevant source links and assumptions.

## Run locally

This is a static site served directly from the repository root. No package installation or build step is required.

```sh
python3 -m http.server 4173
```

Then open [localhost:4173](http://localhost:4173/).

## Check the site

```sh
npm test
```

Tests use only Node.js built-ins. The check covers all HTML pages, metadata, landmarks, local asset links, inline and external JavaScript syntax, and the market-evidence policy. Focused regression tests cover demand-file validation, commitment optimization against observed demand, consistent saved scenarios, and the live-versus-archived evidence policy.

Live market evidence older than 45 days fails the check. An archived dataset must preserve its verification date and show a dated historical-data notice outside collapsed detail panels. The scheduled GitHub Action runs the same checks.

For interface changes, also verify the affected interaction in a browser, including narrow screens and keyboard input. Check exports and URL-restored scenarios when their controls change. Both 3D explorations have static fallbacks; motion controls and reduced-motion support keep the experience usable without continuous animation.

## Repository map

- `index.html` — four-chapter guide, worked examples, and model directory
- `assets/editorial.css` — shared editorial design and homepage figures
- `assets/home-economics.js` — illustrative utilization and unit-cost example
- `*.html` — eight standalone explorations and the methods page
- `assets/experience.css` — brand, homepage, and rack exhibit
- `assets/tool-experience.css` — shared exploration controls, disclosures, responsive layout, and print styles
- `assets/network-experiences.css` — network, topology, and pod layouts
- `assets/buying-experiences.css` — capacity and contract layouts
- `assets/market-experiences.css` — chip comparison and historical price atlas
- `assets/methods.css` — evidence guide
- `assets/home-scene.js` — conceptual interactive GPU, with local geometry and static fallback
- `assets/demand-import.js` — local-only demand parsing and empirical commitment optimization
- `assets/desk.css`, `assets/desk.js` — shared accessibility, URL state, copying, printing, and downloads
- `assets/three-r147.min.js` — pinned local Three.js runtime
- `scripts/check-site.mjs` — repository checks
- `scripts/market-policy.mjs` — live versus archived evidence rules
- `social-card.svg`, `social-card.png`, `favicon.svg` — share preview and site identity

The original model calculations stay close to their pages. The shared reading layer makes the assumptions and intermediate arithmetic visible. The site remains static and requires no framework, build pipeline, analytics, or account.

## Ownership and license

Designed, written, and implemented by Alex Yen. [Corrections are welcome](https://github.com/alexkyen/compute-desk/issues).

Original code is [MIT licensed](LICENSE). Three.js retains its upstream MIT notice. Linked specifications, rate cards, filings, and reporting remain subject to their original terms.
