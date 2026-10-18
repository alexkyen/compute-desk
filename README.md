# The Compute Desk

**A practical guide to buying AI compute.**

The Compute Desk connects hardware, networking, capacity decisions, and contract terms to the cost of useful work. The homepage is one scrolling page in four sections, each with a short explanation and a live figure that runs on its own. Four section pages go further: readers change the assumptions, inspect the calculation, and save or export a scenario.

[Open the site](https://compute.alexkyen.com/)

## The explorations

| | Start with a question | Try it |
| --- | --- | --- |
| 01 | [What you rent](hardware.html) | Check whether a model's weights fit in each GPU's memory, compare five GPUs measure by measure, and take a 72-GPU rack apart in 3D. |
| 02 | [Where the time goes](network.html) | See the wait in every training step, compare fat-tree and rail layouts, and walk a row of racks, on one set of network settings. |
| 03 | [What you actually pay](costs.html) | Compare list prices from thirteen sellers and an index of paid rentals, then size a commitment against your own demand. |
| 04 | [What the contract covers](contracts.html) | Apply different contract promises to the same outage, then review fourteen clauses on your own deal. |

The homepage follows four sections: what you rent, where the time goes, what you actually pay, and what the contract covers. A list at the bottom links each section page. The eight original models now live on those four pages; their old URLs (`plate-nvl72.html`, `silicon-ladder.html`, `the-fabric.html`, `the-two-trees.html`, `plate-pod.html`, `the-atlas-scatter.html`, `gpu-supply-book.html`, `sla-anatomy.html`) are forwarding pages (`assets/redirect.js`) that keep saved scenario parameters and anchors. The old `stage` parameter becomes `rack` for the rack model and `row` for the cluster layout.

## Evidence and limits

The price board was checked on **18 October 2026**. Every price links to the seller’s own price page or price API (AWS, Azure, Oracle, and Vast.ai expose machine-readable prices; the rest are read from their public price pages), and its note gives the raw instance price and region. Thirteen sellers cover the eight accelerators; where a seller offers a GPU without publishing a price, the board marks it “price on request” instead of estimating. A fourteenth row is the Ornn Compute Price Index, the average on-demand price actually paid for four GPUs, as a check on list prices. The prices are marked live, so the check fails after 45 days (2 December 2026) until they are rechecked or relabeled as archived. Hardware references retain their July verification labels, except for a targeted 16 October correction to the rack model: GB200 has 186 GB per GPU, derived from NVIDIA’s specification of 372 GB per two-GPU superchip. Standalone B200 specifications are unchanged. Other hardware sources have not been reverified.

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

Pages built on `assets/site.css` follow its type rules: one family (Inter) and five sizes, all as `--fs-` tokens, none under 13px. The check rejects any other font size or family in those stylesheets. A forwarding page must reach a real page in one hop, load `assets/redirect.js`, include a `<noscript>` refresh, be `noindex`, and point its canonical URL at its target.

For interface changes, also verify the affected interaction in a browser, including narrow screens and keyboard input. Check exports and URL-restored scenarios when their controls change. Every live figure has a Pause/Play control and starts paused, on a finished frame, for readers who prefer reduced motion. The 3D rack has a static fallback for browsers without WebGL.

## Repository map

- `index.html` — the four-section guide with five live figures, and the model list
- `assets/site.css` — the design system: tokens, type scale, page shell, figures, and controls
- `assets/figures.js` — shared figure kit: isometric drawing, pinned labels, Pause/Play, one animation loop, the stepped diagram, the fleet-month figure, section rail
- `assets/home.js` — the homepage's five figures
- `hardware.html`, `assets/hardware.css`, `assets/hardware.js` — section 01: will the model fit, the GPU comparison, and the 3D rack
- `assets/rack3d.js` — the GB200 NVL72 rack in Three.js, its four chapters, and the take-apart slider
- `network.html`, `assets/network.css`, `assets/network.js` — section 02: the step model, fat-tree and rail layouts with a parts estimate, and the physical row, on one set of network settings (with rails, a cluster-wide all-reduce stays on its rail and skips the spine)
- `costs.html`, `assets/costs.css`, `assets/costs.js` — section 03: the price board and the commitment model
- `assets/price-data.js` — the price observations checked 18 October 2026, with a source for every value; the homepage’s Figure 1 reads it too
- `contracts.html`, `assets/contracts.css`, `assets/contracts.js` — section 04: the outage month, credits, your scenario, and the fourteen-clause review
- `assets/redirect.js` — forwarding for old page URLs, keeping saved parameters
- `*.html` — forwarding pages for retired URLs, and the methods page
- `assets/editorial.css`, `assets/experience.css`, `assets/tool-experience.css`, `assets/methods.css` — the methods page's older styles, retired once it moves to `site.css`
- `assets/demand-import.js` — local-only demand parsing and empirical commitment optimization
- `assets/desk.css`, `assets/desk.js` — shared accessibility, URL state, copying, printing, and downloads
- `assets/three-r147.min.js` — pinned local Three.js runtime for the 3D rack
- `scripts/check-site.mjs` — repository checks, including forwarding pages and type rules
- `scripts/market-policy.mjs` — live versus archived evidence rules
- `og-image.png`, `scripts/og-image.html`, `favicon.svg` — the link-preview image, its source (the regenerate command is in the file), and the site icon

The original model calculations stay close to their pages. The shared reading layer makes the assumptions and intermediate arithmetic visible. The site remains static and requires no framework, build pipeline, analytics, or account.

## Ownership and license

Designed, written, and implemented by Alex Yen. [Corrections are welcome](https://github.com/alexkyen/compute-desk/issues).

Original code is [MIT licensed](LICENSE). Three.js retains its upstream MIT notice. Linked specifications, rate cards, filings, and reporting remain subject to their original terms.
