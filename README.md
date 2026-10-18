# The Compute Desk

**A practical guide to AI compute, from hardware to economics.**

The Compute Desk connects hardware, networking, capacity decisions, and contract terms to the cost of useful work. The homepage is one scrolling page in four sections, each with a short explanation and a live figure that runs on its own. Eight interactive models let readers change the assumptions, inspect the calculation, and export a scenario.

[Open the site](https://alexkyen.github.io/compute-desk/)

## The explorations

| | Start with a question | Try it |
| --- | --- | --- |
| 01 | [Inside an AI rack](plate-nvl72.html) | Turn a 72-GPU rack and take it apart in four chapters. |
| 02 | [From racks to a cluster](plate-pod.html) | Pull back to a row, trace connections, and inspect failures. |
| 03 | [Accelerator specifications](silicon-ladder.html) | Compare memory, bandwidth, compute, and power. |
| 04 | [The cost of moving data](the-fabric.html) | Change the network and see working time versus waiting. |
| 05 | [Network topology](the-two-trees.html) | Compare two layouts and take a switch offline. |
| 06 | [What you actually pay](costs.html) | Compare an archived price snapshot across twelve sellers, then size a commitment against your own demand. |
| 07 | [What the contract covers](contracts.html) | Apply different contract promises to the same outage, then review fourteen clauses on your own deal. |

The homepage follows four sections: what you rent, where the time goes, what you actually pay, and what the contract covers. A list at the bottom links every model. The eight models are being folded into one page per section. `costs.html` and `contracts.html` are done; their old URLs (`the-atlas-scatter.html`, `gpu-supply-book.html`, `sla-anatomy.html`) are forwarding pages (`assets/redirect.js`) that keep saved scenario parameters and anchors.

## Evidence and limits

The price board is an **archived July 2026 snapshot**, last verified on **22 July 2026**. Its original dates and source records are preserved. It is historical reference, not current pricing or executable availability. Hardware references retain their July verification labels, except for a targeted 16 October correction on the rack page: GB200 has 186 GB per GPU, derived from NVIDIA’s specification of 372 GB per two-GPU superchip. Standalone B200 specifications are unchanged. Other hardware sources have not been reverified. The board defaults to on-demand observations with source links; saved filters still take precedence.

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

Tests use only Node.js built-ins. The check covers all HTML pages, metadata, landmarks, local asset links, inline and external JavaScript syntax, forwarding pages, the type system, and the market-evidence policy. Focused regression tests cover demand-file validation, commitment optimization against observed demand, consistent saved scenarios, forwarding of saved parameters, and the live-versus-archived evidence policy.

Live market evidence older than 45 days fails the check. Any page that shows prices declares `data-market-verified` and `data-market-status`; an archived dataset must preserve its verification date and show a dated historical-data notice outside collapsed detail panels. The scheduled GitHub Action runs the same checks.

Pages built on `assets/site.css` follow its type rules: two families (Newsreader and Inter) and five sizes, all as `--fs-` tokens, none under 13px. The check rejects any other font size or family in those stylesheets. A forwarding page must reach a real page in one hop, load `assets/redirect.js`, include a `<noscript>` refresh, be `noindex`, and point its canonical URL at its target.

For interface changes, also verify the affected interaction in a browser, including narrow screens and keyboard input. Check exports and URL-restored scenarios when their controls change. Every live figure has a Pause/Play control and starts paused, on a finished frame, for readers who prefer reduced motion. Both 3D explorations have static fallbacks.

## Repository map

- `index.html` — the four-section guide with five live figures, and the model list
- `assets/site.css` — the design system: tokens, type scale, page shell, figures, and controls
- `assets/figures.js` — shared figure kit: isometric drawing, pinned labels, Pause/Play, one animation loop, section rail
- `assets/home.js` — the homepage's five figures
- `costs.html`, `assets/costs.css`, `assets/costs.js` — section 03: the archived price board and the commitment model
- `assets/price-data.js` — the archived July 2026 price observations, moved unchanged from the price atlas
- `contracts.html`, `assets/contracts.css`, `assets/contracts.js` — section 04: the outage month, credits, your scenario, and the fourteen-clause review
- `assets/redirect.js` — forwarding for old page URLs, keeping saved parameters
- `*.html` — the remaining standalone explorations, forwarding pages for retired URLs, and the methods page
- `assets/editorial.css` — shared reading layer for the explorations (retired once they move to `site.css`)
- `assets/experience.css` — brand and rack exhibit
- `assets/tool-experience.css` — shared exploration controls, disclosures, responsive layout, and print styles
- `assets/network-experiences.css` — network, topology, and pod layouts
- `assets/market-experiences.css` — chip comparison
- `assets/methods.css` — evidence guide
- `assets/demand-import.js` — local-only demand parsing and empirical commitment optimization
- `assets/desk.css`, `assets/desk.js` — shared accessibility, URL state, copying, printing, and downloads
- `assets/three-r147.min.js` — pinned local Three.js runtime
- `scripts/check-site.mjs` — repository checks, including forwarding pages and type rules
- `scripts/market-policy.mjs` — live versus archived evidence rules
- `social-card.svg`, `social-card.png`, `favicon.svg` — share preview and site identity

The original model calculations stay close to their pages. The shared reading layer makes the assumptions and intermediate arithmetic visible. The site remains static and requires no framework, build pipeline, analytics, or account.

## Ownership and license

Designed, written, and implemented by Alex Yen. [Corrections are welcome](https://github.com/alexkyen/compute-desk/issues).

Original code is [MIT licensed](LICENSE). Three.js retains its upstream MIT notice. Linked specifications, rate cards, filings, and reporting remain subject to their original terms.
