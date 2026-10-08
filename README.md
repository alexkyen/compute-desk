# The Compute Desk

**An interactive field guide to the physical side of AI.**

AI feels invisible. The machines behind it are not. The Compute Desk lets curious people take apart a rack, follow a network, and experiment with the choices that shape compute economics. Each exploration starts with a visual and a small action. Working tools, assumptions, source trails, and exports are available when you want more detail.

[Open the site](https://alexkyen.github.io/compute-desk/)

## The explorations

| | Start with a question | Try it |
| --- | --- | --- |
| 01 | [Meet the machine](plate-nvl72.html) | Turn a 72-GPU rack and take it apart in four chapters. |
| 02 | [One rack is just the beginning](plate-pod.html) | Pull back to a row, trace connections, and inspect failures. |
| 03 | [Not all chips think alike](silicon-ladder.html) | Compare memory, bandwidth, compute, and power. |
| 04 | [Why do fast chips wait?](the-fabric.html) | Change the network and see working time versus waiting. |
| 05 | [Give your chips a better way to talk](the-two-trees.html) | Compare two layouts and take a switch offline. |
| 06 | [How much is enough?](gpu-supply-book.html) | Move the capacity line and balance commitment against flexibility. |
| 07 | [Same chip. Different price](the-atlas-scatter.html) | Explore a dated market snapshot and compare sellers. |
| 08 | [What happens when things go wrong?](sla-anatomy.html) | Apply different contract promises to the same outage. |

The homepage groups these into hardware, connections, and tradeoffs. Its toolbox also offers direct access to the working models. Existing page URLs remain intact.

## Evidence and limits

The price atlas is an **archived July 2026 snapshot**, last verified on **22 July 2026**. Its original dates and source records are preserved. It is historical reference, not current pricing or executable availability. Hardware references also retain their July verification labels; the October interface redesign does not imply revalidation of those sources.

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

- `index.html` — visual entry point and toolbox
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

The original model calculations stay close to their pages. The shared exhibit layer changes how people encounter them without introducing a framework, build pipeline, analytics, or account requirement.

## Ownership and license

Designed, written, and implemented by Alex Yen. [Corrections are welcome](https://github.com/alexkyen/compute-desk/issues).

Original code is [MIT licensed](LICENSE). Three.js retains its upstream MIT notice. Linked specifications, rate cards, filings, and reporting remain subject to their original terms.
