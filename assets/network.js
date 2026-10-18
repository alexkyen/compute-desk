/* Where the time goes. One set of network settings drives the step model (Figure 1), the wiring
   and parts estimate (Figure 2), and the physical row (Figure 3). The calculations, URL parameters,
   and downloads match the original communication-time and network-topology pages, with one
   addition: the layout now reaches the step model, so with rails a cluster-wide all-reduce stays
   on each GPU's rail and skips the oversubscribed spine. The old cluster-layout page's `stage`
   arrives here as `row`. */
(function () {
  'use strict';
  const { COL, reduced, el, mix, light, fmt, clamp, iso, box, fit, along, makeLabel, placeLabel, register, stepper } = window.Figures;
  const desk = window.ComputeDesk;
  const $ = id => document.getElementById(id);
  const q = desk.params();

  // ---------- One network, read from the address ----------
  const FABRICS = { ib: { label: 'InfiniBand 400G', eff: .92 }, roce: { label: 'RoCE v2 400G', eff: .80 } };
  const SPANS = { node: { label: 'One server · 8 chips', n: 8 }, leaf: { label: 'One group · 32 chips', n: 32 }, cluster: { label: 'Whole cluster · 128 chips', n: 128 } };
  const NIC = 50, NVL = 810; // GB/s per GPU outside a server, and inside one
  const s = {
    fabric: q.get('fabric') === 'roce' ? 'roce' : 'ib',
    over: [1, 2, 4].includes(+q.get('over')) ? +q.get('over') : 1,
    span: SPANS[q.get('span')] ? q.get('span') : 'cluster',
    params: q.has('params') ? Math.max(7, +q.get('params') || 70) : 70,
    compute: q.has('compute') ? Math.max(.01, +q.get('compute') || 10) : 10,
    overlap: q.has('overlap') ? clamp((+q.get('overlap') || 0) / 100, 0, 1) : .5,
    measured: q.has('measured') ? Math.max(0, +q.get('measured') || 0) : 0,
    sticker: q.has('sticker') ? Math.max(.01, +q.get('sticker') || 2.5) : 2.5,
    topo: q.get('topo') === 'rail' ? 'rail' : 'fat',
    scen: ['coll', 'cross', 'fail'].includes(q.get('scen')) ? q.get('scen') : 'coll',
    gpus: q.has('gpus') ? Math.max(16, +q.get('gpus') || 512) : 512,
    radix: q.has('radix') ? Math.max(16, +q.get('radix') || 64) : 64,
    rails: q.has('rails') ? Math.max(1, +q.get('rails') || 8) : 8,
    planes: q.has('planes') ? clamp(+q.get('planes') || 1, 1, 2) : 1,
    optic: q.has('optic') ? Math.max(0, +q.get('optic') || 0) : 1200,
    row: q.has('row') ? clamp(Math.round(+q.get('row') || 0), 0, 3) : null
  };
  function save() {
    desk.setParams({
      fabric: s.fabric, over: s.over, span: s.span, params: s.params, compute: s.compute, overlap: Math.round(s.overlap * 100), measured: s.measured || null, sticker: s.sticker.toFixed(2),
      topo: s.topo, scen: s.scen, gpus: s.gpus, radix: s.radix, rails: s.rails, planes: s.planes, optic: s.optic, row: s.row
    });
  }

  // ---------- The arithmetic ----------
  // One FP16 copy of every gradient through a ring all-reduce; the part not hidden by computing
  // lengthens the step, and the quoted price is divided by the compute throughput kept.
  // A fat-tree job across the cluster shares the leaf-to-spine uplinks; with rails, each GPU's
  // exchange stays on its own rail switch, so the uplink ratio does not apply.
  function stepModel() {
    const fab = FABRICS[s.fabric], span = SPANS[s.span];
    let B;
    if (s.span === 'node') B = NVL;
    else if (s.span === 'leaf' || s.topo === 'rail') B = NIC * fab.eff;
    else B = NIC * fab.eff / s.over;
    if (s.measured > 0 && s.span !== 'node') B = s.measured;
    const P = 2 * s.params; // GB of FP16 gradients
    const t = 2 * P * (span.n - 1) / (span.n * B);
    const exposed = t * (1 - s.overlap), step = s.compute + exposed;
    const kept = Math.min(1, s.compute / step);
    return { fab, span, B, t, exposed, step, kept, cost: s.sticker / kept };
  }
  // A two-tier Clos estimate for the fat-tree and one switch group per rail, times the planes.
  function partsModel() {
    const nodes = Math.ceil(s.gpus / s.rails), downPorts = Math.floor(s.radix / 2), leaves = Math.ceil(s.gpus / downPorts);
    const uplinksPerLeaf = Math.max(1, Math.ceil(downPorts / s.over));
    const fatSpines = Math.max(1, Math.ceil(leaves * uplinksPerLeaf / s.radix));
    const railGroups = Math.ceil(nodes / s.radix);
    return {
      fat: { switches: (leaves + fatSpines) * s.planes, links: (s.gpus + leaves * uplinksPerLeaf) * s.planes },
      rail: { switches: s.rails * railGroups * s.planes, links: s.gpus * s.planes },
      railGroups, nodesPerLeaf: Math.ceil(downPorts / s.rails)
    };
  }
  const secs = t => t < .001 ? Math.round(t * 1e6) + ' µs' : t < 1 ? Math.round(t * 1000) + ' ms' : t.toFixed(1) + ' s';
  const line = (g, a, b, attrs) => { const p = iso(...a), r = iso(...b); return el('line', Object.assign({ x1: p[0], y1: p[1], x2: r[0], y2: r[1], 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, attrs || {}), g); };
  const narrow = matchMedia('(max-width: 760px)');

  // ======================= Figure 1: the wait in every step =======================
  // 128 GPUs: four groups of four servers (eight GPUs each, drawn as four tiles), a leaf switch per
  // group, and two spine switches joining the groups.
  const time = (function () {
    const fig = $('fig-time'), svg = $('time-svg'), inner = el('g', {}, svg);
    const SV = 38, LEAF_Z = 110, SPINE_Z = 230, SW = 28;
    const groups = [0, 1, 2, 3].map(g => ({ x: g * 190, y: -g * 190 }));
    const gc = g => [groups[g].x + 41, groups[g].y + 41];
    const mid = [(gc(0)[0] + gc(3)[0]) / 2, (gc(0)[1] + gc(3)[1]) / 2];
    const spines = [[mid[0] - 120, mid[1] + 120], [mid[0] + 120, mid[1] - 120]];
    const servers = [];
    groups.forEach((G, g) => [[0, 0], [44, 0], [0, 44], [44, 44]].forEach(([dx, dy], i) => {
      const x = G.x + dx, y = G.y + dy;
      box(inner, x, y, 0, SV, SV, 22, COL.steel);
      const tiles = [[3, 3], [20, 3], [3, 20], [20, 20]].map(([tx, ty]) => box(inner, x + tx, y + ty, 22, 15, 15, 4, COL.compute));
      servers.push({ g, i, tiles, top: [x + SV / 2, y + SV / 2, 26], tileTops: [[3, 3], [20, 3], [20, 20], [3, 20]].map(([tx, ty]) => [x + tx + 7.5, y + ty + 7.5, 27]) });
    }));
    // Fat-tree: a leaf switch per group, two spines above.
    const fatG = el('g', {}, inner);
    const downG = el('g', {}, fatG);
    servers.forEach(sv => { const [lx, ly] = gc(sv.g); sv.down = line(downG, sv.top, [lx, ly, LEAF_Z]); });
    const leaves = [0, 1, 2, 3].map(g => { const [cx, cy] = gc(g); return box(fatG, cx - SW, cy - SW, LEAF_Z, SW * 2, SW * 2, 10, COL.network); });
    const upG = el('g', {}, fatG);
    const uplinks = [];
    [0, 1, 2, 3].forEach(g => spines.forEach(sp => { const [cx, cy] = gc(g); uplinks.push(line(upG, [cx, cy, LEAF_Z + 10], [sp[0], sp[1], SPINE_Z])); }));
    const spineBoxes = spines.map(([x, y]) => box(fatG, x - SW, y - SW, SPINE_Z, SW * 2, SW * 2, 10, COL.network));
    // Rails: one switch per GPU position, wired to that position on every server (4 of 8 drawn).
    const RAIL_Z = 175;
    const railG = el('g', {}, inner);
    const rails = [0, 1, 2, 3].map(k => [mid[0] + (k - 1.5) * 150, mid[1] - (k - 1.5) * 150]);
    const railWireG = el('g', {}, railG);
    servers.forEach(sv => { sv.railWires = sv.tileTops.map((t, k) => line(railWireG, t, [rails[k][0], rails[k][1], RAIL_Z])); });
    const railBoxes = rails.map(([x, y]) => box(railG, x - SW, y - SW, RAIL_Z, SW * 2, SW * 2, 10, COL.network));
    const fx = el('g', {}, inner);
    const packets = [0, 1, 2, 3, 4, 5, 6, 7].map(() => el('circle', { r: 5, fill: COL.network, stroke: COL.surface, 'stroke-width': 1.5, opacity: 0, 'vector-effect': 'non-scaling-stroke' }, fx));

    const pins = {
      spine: makeLabel(svg, 'Spine switches', 'right'),
      leaf: makeLabel(svg, 'A leaf switch per group', 'left'),
      group: makeLabel(svg, 'Group: 4 servers, 32 GPUs', 'right'),
      nvlink: makeLabel(svg, 'Inside one server: NVLink', 'left'),
      uplinks: makeLabel(svg, 'Uplinks', 'left'),
      rails: makeLabel(svg, 'Rail switches, 4 of 8 drawn', 'right')
    };
    function layout() {
      const rail = s.topo === 'rail';
      fatG.style.display = rail ? 'none' : '';
      railG.style.display = rail ? '' : 'none';
      svg.setAttribute('aria-label', rail
        ? '128 GPUs in four groups of four servers, with rail switches that each connect one GPU position on every server. The selected job computes, then exchanges results over the connections it uses.'
        : '128 GPUs in four groups of four servers. Each group has a leaf switch; two spine switches join the groups. The selected job computes, then exchanges results over the connections it uses.');
      svg.setAttribute('viewBox', narrow.matches ? '0 0 600 560' : '0 0 960 470');
      const xf = fit(inner, narrow.matches ? { x: 20, y: 90, w: 560, h: 440 } : { x: 150, y: 70, w: 660, h: 360 });
      placeLabel(pins.rails, svg, xf, [rails[3][0] + SW, rails[3][1], RAIL_Z + 5]);
      [pins.spine, pins.leaf, pins.uplinks].forEach(p => { p.hidden = rail; });
      pins.rails.hidden = !rail;
      placeLabel(pins.spine, svg, xf, [spines[1][0] + SW, spines[1][1], SPINE_Z + 5]);
      placeLabel(pins.leaf, svg, xf, [gc(0)[0] - SW, gc(0)[1] + SW, LEAF_Z + 5]);
      placeLabel(pins.group, svg, xf, [groups[1].x + 82, groups[1].y + 82, -14]);
      placeLabel(pins.nvlink, svg, xf, [groups[0].x, groups[0].y + SV, 24]);
      const [cx, cy] = gc(0);
      placeLabel(pins.uplinks, svg, xf, [(cx + spines[0][0]) / 2, (cy + spines[0][1]) / 2, (LEAF_Z + SPINE_Z) / 2]);
    }
    narrow.addEventListener('change', layout);

    // Which servers, switches, and links the job uses, and the routes its messages take.
    let m, routes = [], activeServers = [], drawnTopo = null;
    function paint() {
      if (drawnTopo !== s.topo) { drawnTopo = s.topo; layout(); }
      m = stepModel();
      activeServers = s.span === 'node' ? [servers[0]] : s.span === 'leaf' ? servers.filter(sv => sv.g === 0) : servers;
      const cluster = s.span === 'cluster';
      servers.forEach(sv => {
        const on = activeServers.includes(sv);
        sv.down.setAttribute('stroke', on && s.span !== 'node' ? COL.network : COL.rule);
        sv.down.setAttribute('stroke-opacity', on && s.span !== 'node' ? .7 : 1);
        sv.down.setAttribute('stroke-width', on && s.span !== 'node' ? 1.5 : 1);
        sv.tiles.forEach(t => t.paint(on ? COL.compute : light(COL.idle, .2)));
      });
      leaves.forEach((lf, g) => lf.paint(cluster || (s.span === 'leaf' && g === 0) ? COL.network : COL.steel));
      spineBoxes.forEach(sp => sp.paint(cluster ? COL.network : COL.steel));
      const width = { 1: 3, 2: 1.8, 4: 1 }[s.over];
      uplinks.forEach(u => {
        u.setAttribute('stroke', cluster ? COL.network : COL.rule);
        u.setAttribute('stroke-width', cluster ? width : 1);
        u.setAttribute('stroke-opacity', cluster ? .8 : 1);
        u.setAttribute('stroke-dasharray', cluster && s.over > 1 ? '5 4' : '');
      });
      pins.nvlink.hidden = s.span !== 'node';
      pins.uplinks.querySelector('span').textContent = `Uplinks ${s.over}:1${cluster ? '' : ', unused by this job'}`;
      placeLabel(pins.uplinks); placeLabel(pins.nvlink);
      const leafTop = g => [gc(g)[0], gc(g)[1], LEAF_Z + 5];
      const railTop = k => [rails[k][0], rails[k][1], RAIL_Z + 5];
      if (s.topo === 'rail') {
        // GPU position k on one server talks to position k on another, through rail k.
        const hops = s.span === 'node' ? []
          : s.span === 'leaf' ? [0, 1, 2, 3].map(i => [i, (i + 1) % 4, i])
          : [0, 1, 2, 3].flatMap(g => [0, 3].map((j, n) => [g * 4 + j, ((g + 1) % 4) * 4 + j, (g + n) % 4]));
        const used = new Set(hops.flatMap(([a, b, k]) => [a + ':' + k, b + ':' + k]));
        servers.forEach((sv, n) => sv.railWires.forEach((w, k) => {
          const on = used.has(n + ':' + k);
          w.setAttribute('stroke', on ? COL.network : COL.rule);
          w.setAttribute('stroke-width', on ? 1.6 : 1);
          w.setAttribute('stroke-opacity', on ? .85 : .8);
        }));
        railBoxes.forEach((b, k) => b.paint(hops.some(h => h[2] === k) ? COL.network : COL.steel));
        if (s.span !== 'node') {
          routes = hops.map(([a, b, k], i) => ({ path: [servers[a].tileTops[k], railTop(k), servers[b].tileTops[k]], delay: (i % 2) * .15 }));
          packets.forEach((p, i) => { if (!routes[i]) p.setAttribute('opacity', 0); });
          readouts();
          return;
        }
      }
      if (s.span === 'node') {
        const t = servers[0].tileTops;
        routes = [0, 1, 2, 3].map(k => ({ path: [t[k], t[(k + 1) % 4], t[(k + 2) % 4]], delay: k * .12 }));
      } else if (s.span === 'leaf') {
        routes = [0, 1, 2, 3].map(i => ({ path: [servers[i].top, leafTop(0), servers[(i + 1) % 4].top], delay: i * .1 }));
      } else {
        routes = [];
        [0, 1, 2, 3].forEach(g => [0, 3].forEach((j, n) => {
          const from = servers[g * 4 + j], to = servers[((g + 1) % 4) * 4 + j], sp = spines[(g + n) % 2];
          routes.push({ path: [from.top, leafTop(g), [sp[0], sp[1], SPINE_Z + 5], leafTop((g + 1) % 4), to.top], delay: n * .15 });
        }));
      }
      packets.forEach((p, i) => { if (!routes[i]) p.setAttribute('opacity', 0); });
      readouts();
    }

    const els = { tc: $('t-compute'), tw: $('t-wait'), phase: $('time-phase') };
    function readouts() {
      $('r-bw').textContent = Math.round(m.B) + ' GB/s';
      $('r-sync').textContent = secs(m.t);
      $('r-kept').textContent = Math.round(m.kept * 100) + '%';
      $('r-cost-label').textContent = `Real cost of a $${s.sticker.toFixed(2)} GPU-hour`;
      $('r-cost').textContent = '$' + m.cost.toFixed(2);
      $('time-working').innerHTML = `Compute <b>${s.compute.toFixed(1)} s</b> + exchange not hidden <b>${m.exposed.toFixed(2)} s</b> = <b>${m.step.toFixed(2)} s</b> per step; ${Math.round((1 - m.kept) * 100)}% of it spent waiting.`;
      $('bandwidth-basis').textContent = s.span === 'node'
        ? 'Inside one server the GPUs use an 810 GB/s internal connection, so the outside network does not matter.'
        : s.measured > 0 ? `Bandwidth: your measured ${s.measured} GB/s, which replaces the protocol and uplink estimates.`
        : `Bandwidth: 50 GB/s × ${Math.round(m.fab.eff * 100)}% assumed efficiency${s.span !== 'cluster' ? ', with no spine crossing' : s.topo === 'rail' ? ', with each GPU’s exchange staying on its rail' : ' ÷ ' + s.over + ' for shared uplinks'} = ${m.B.toFixed(1)} GB/s per GPU.`;
      let msg;
      if (s.span === 'node') msg = 'Kept inside one server, the GPUs use its fast internal connection. Changing the outside network makes no difference here.';
      else if (s.measured > 0) msg = `At your measured ${s.measured} GB/s, the exchange adds ${m.exposed.toFixed(1)} seconds to each ${s.compute.toFixed(1)}-second step.`;
      else if (s.span === 'leaf') msg = 'This job stays inside one group, so it never crosses a shared tier. Narrowing the uplinks would not slow it down.';
      else if (s.topo === 'rail') msg = `With rails, matching GPUs exchange results along their own rail and never cross a shared spine, so the uplink ratio does not slow this job. ${Math.round((1 - m.kept) * 100)}% of every step is still spent waiting.`;
      else if (s.over === 1) msg = `The job spans the cluster. Even at full uplink capacity, ${Math.round((1 - m.kept) * 100)}% of every step is spent waiting.`;
      else msg = `With ${s.over === 2 ? 'half' : 'a quarter of'} the uplink capacity, this job waits ${m.exposed.toFixed(1)} seconds every step for messages to cross the spine.`;
      $('time-status').textContent = msg;
    }

    // The loop: compute for its share of the step, then exchange; the timeline fills to match.
    const CYCLE = 3.6, PAUSE = .5;
    function draw(t) {
      const share = s.compute / m.step, tc = CYCLE * share, tx = Math.max(.35, CYCLE * (1 - share));
      const local = t % (tc + tx + PAUSE), computing = local < tc;
      const done = clamp((local - tc) / tx, 0, 1);
      els.tc.style.width = (share * 100 * Math.min(1, local / tc)) + '%';
      els.tw.style.width = ((1 - share) * 100 * done) + '%';
      setPhase(computing ? 'compute' : 'exchange');
      const pulse = .5 + .5 * Math.sin(t * 9);
      activeServers.forEach((sv, i) => sv.tiles.forEach((tile, k) => tile.top.setAttribute('fill', computing ? mix(light(COL.compute, .22), light(COL.compute, .6), (pulse + (i + k) * .17) % 1) : light(COL.compute, .45))));
      packets.forEach((p, i) => {
        const r = routes[i];
        if (!r || computing || local > tc + tx) { p.setAttribute('opacity', 0); return; }
        const u = clamp(done * 1.25 - r.delay, 0, 1), pos = along(r.path, u);
        p.setAttribute('cx', pos[0].toFixed(1)); p.setAttribute('cy', pos[1].toFixed(1));
        p.setAttribute('opacity', u > 0 && u < 1 ? 1 : 0);
      });
    }
    function setPhase(name) {
      if (els.phase.dataset.name === name) return;
      els.phase.dataset.name = name;
      els.phase.innerHTML = name === 'compute' ? '<i class="sw compute"></i>Computing' : '<i class="sw network"></i>Exchanging results';
    }
    let t0 = 0;
    const live = register({ node: fig, tick(dt) { t0 += dt; draw(t0); } });
    // Paused: the whole step drawn on the timeline, messages mid-flight.
    function settle() {
      if (!live.paused) return;
      const share = s.compute / m.step;
      draw(CYCLE * share + Math.max(.35, CYCLE * (1 - share)) * .55);
      els.tc.style.width = share * 100 + '%'; els.tw.style.width = (1 - share) * 100 + '%';
    }
    return { update() { paint(); t0 = 0; settle(); } };
  })();

  // ======================= Figure 2: two ways to wire the same servers =======================
  const layoutFig = (function () {
    const fig = $('fig-layout'), svg = $('layout-svg');
    const S = 64, servers = [0, 84, 214, 298].map(u => ({ x: u, y: -u }));
    const TILE = [[6, 6], [34, 6], [6, 34], [34, 34]];
    const center = sv => [sv.x + S / 2, sv.y + S / 2];
    const tileTop = (n, k) => [servers[n].x + TILE[k][0] + 12, servers[n].y + TILE[k][1] + 12, 31];
    const mid = [(center(servers[0])[0] + center(servers[3])[0]) / 2, (center(servers[0])[1] + center(servers[3])[1]) / 2];
    let inner, fx, packets = [], routes = [];

    function build() {
      svg.textContent = '';
      svg.parentNode.querySelectorAll('.pin').forEach(p => p.remove());
      inner = el('g', {}, svg);
      const dead = s.scen === 'fail';
      const tiles = [];
      servers.forEach((sv, n) => {
        box(inner, sv.x, sv.y, 0, S, S, 26, COL.steel);
        tiles.push(TILE.map(([dx, dy]) => box(inner, sv.x + dx, sv.y + dy, 26, 24, 24, 5, COL.compute)));
      });
      const wires = el('g', {}, inner);
      const used = (attrs, on, off) => Object.assign({ stroke: on ? COL.network : off ? COL.down : COL.rule, 'stroke-width': on ? 2 : off ? 1.4 : 1, 'stroke-opacity': on ? .85 : 1 }, off ? { 'stroke-dasharray': '5 4' } : {}, attrs || {});
      const pins = [];
      if (s.topo === 'fat') {
        const leafs = [[0, 1], [2, 3]].map(([a, b]) => ({ cx: (center(servers[a])[0] + center(servers[b])[0]) / 2, cy: (center(servers[a])[1] + center(servers[b])[1]) / 2, z: 125 }));
        const spines = [[-58, -58], [58, 58]].map(([dx, dy]) => ({ cx: mid[0] + dx, cy: mid[1] - dy, z: 255 }));
        const leafDead = dead ? 0 : -1;
        servers.forEach((sv, n) => {
          const l = leafs[n < 2 ? 0 : 1], c = center(sv);
          const on = s.scen === 'coll' || (s.scen === 'cross' && (n === 0 || n === 3)) || (dead && n >= 2);
          line(wires, [c[0], c[1], 31], [l.cx, l.cy, l.z], used({}, on, dead && n < 2));
        });
        const SW = 30;
        const leafBoxes = leafs.map((l, i) => box(inner, l.cx - SW, l.cy - SW, l.z, SW * 2, SW * 2, 12, i === leafDead ? COL.down : COL.network));
        const up = el('g', {}, inner);
        leafs.forEach((l, i) => spines.forEach((sp, k) => line(up, [l.cx, l.cy, l.z + 12], [sp.cx, sp.cy, sp.z], used({}, !dead && k === 0, dead && i === 0))));
        spines.forEach(sp => box(inner, sp.cx - SW, sp.cy - SW, sp.z, SW * 2, SW * 2, 12, COL.network));
        if (dead) [0, 1].forEach(n => tiles[n].forEach(t => t.paint(light(COL.down, .3))));
        const via = (l, sp) => [[l.cx, l.cy, l.z + 6], [sp.cx, sp.cy, sp.z + 6]];
        if (s.scen === 'coll') routes = [0, 1, 2, 3].map(n => ({ path: [tileTop(n, 1), ...via(leafs[n < 2 ? 0 : 1], spines[0]), [leafs[n < 2 ? 1 : 0].cx, leafs[n < 2 ? 1 : 0].cy, 131], tileTop((n + 2) % 4, 1)] }));
        else if (s.scen === 'cross') routes = [0, .5].map(phase => ({ phase, path: [tileTop(0, 1), ...via(leafs[0], spines[0]), [leafs[1].cx, leafs[1].cy, 131], tileTop(3, 3)] }));
        else routes = [[2, 3], [3, 2]].map(([a, b], i) => ({ phase: i * .5, path: [tileTop(a, 1), [leafs[1].cx, leafs[1].cy, 131], tileTop(b, 1)] }));
        if (s.scen !== 'fail') [0, 1, 2, 3].forEach(n => { if (s.scen === 'coll' || (s.scen === 'cross' && (n === 0 || n === 3))) tiles[n][s.scen === 'cross' && n === 3 ? 3 : 1].paint(COL.compute); });
        pins.push(['Spine switches', [spines[1].cx + SW, spines[1].cy, spines[1].z + 6], 'right'], [dead ? 'Leaf switch offline' : 'Leaf switches', [leafs[dead ? 0 : 1].cx + (dead ? -SW : SW), leafs[dead ? 0 : 1].cy + (dead ? SW : 0), leafs[0].z + 6], dead ? 'left' : 'right', dead]);
      } else {
        const rails = [0, 1, 2, 3].map(k => ({ cx: mid[0] + (k - 1.5) * 95, cy: mid[1] - (k - 1.5) * 95, z: 165 }));
        const railDead = dead ? 1 : -1;
        const via = k => [rails[k].cx, rails[k].cy, rails[k].z + 5];
        // Each route is [from server, to server, rail]; the wires it uses are highlighted.
        const hops = s.scen === 'coll' ? [0, 1, 2, 3].map(n => [n, (n + 1) % 4, 1])
          : s.scen === 'cross' ? [[0, 3, 3]]
          : [0, 2, 3].map(k => [k % 4, (k + 1) % 4, k]);
        const usedWire = new Set(hops.flatMap(([a, b, k]) => [a + ':' + k, b + ':' + k]));
        servers.forEach((sv, n) => TILE.forEach((_, k) => {
          const r = rails[k];
          line(wires, tileTop(n, k), [r.cx, r.cy, r.z], used({}, usedWire.has(n + ':' + k), k === railDead));
        }));
        if (s.scen === 'cross') line(wires, tileTop(0, 1), tileTop(0, 3), { stroke: COL.memory, 'stroke-width': 2.4, 'stroke-dasharray': '4 3' });
        const SW = 26;
        rails.forEach((r, k) => box(inner, r.cx - SW, r.cy - SW, r.z, SW * 2, SW * 2, 10, k === railDead ? COL.down : COL.network));
        if (dead) servers.forEach((_, n) => tiles[n][1].paint(light(COL.down, .3)));
        if (s.scen === 'cross') routes = [0, .5].map(phase => ({ phase, path: [tileTop(0, 1), tileTop(0, 3), via(3), tileTop(3, 3)] }));
        else routes = hops.map(([a, b, k], i) => ({ phase: i / hops.length, path: [tileTop(a, k), via(k), tileTop(b, k)] }));
        pins.push(['Rail switches, one per GPU position', [rails[3].cx + SW, rails[3].cy, rails[3].z + 5], 'right']);
        if (dead) pins.push(['Rail 1 offline', [rails[1].cx - SW, rails[1].cy + SW, rails[1].z + 5], 'left', true]);
        if (s.scen === 'cross') pins.push(['Detour inside the server', [servers[0].x, servers[0].y + S, 20], 'left']);
      }
      pins.push(['Servers, 4 GPUs each', [servers[0].x, servers[0].y + S, 14], 'left']);
      fx = el('g', {}, inner);
      packets = routes.map(r => Object.assign({ node: el('circle', { r: 6, fill: COL.network, stroke: COL.surface, 'stroke-width': 1.5, opacity: 0, 'vector-effect': 'non-scaling-stroke' }, fx), u: r.phase || Math.random() }, r));
      svg.setAttribute('viewBox', narrow.matches ? '0 0 600 560' : '0 0 960 470');
      const xf = fit(inner, narrow.matches ? { x: 30, y: 60, w: 540, h: 440 } : { x: 180, y: 60, w: 600, h: 360 });
      pins.filter((p, i, all) => all.findIndex(o => o[0] === p[0]) === i).forEach(([text, at, side, isDown]) => { const n = makeLabel(svg, text, side); if (isDown) n.classList.add('pin-down'); placeLabel(n, svg, xf, at); });
      if (live && live.paused) settle();
    }
    narrow.addEventListener('change', build);
    function settle() { packets.forEach((p, i) => { const pos = along(p.path, .5); p.node.setAttribute('cx', pos[0]); p.node.setAttribute('cy', pos[1]); p.node.setAttribute('opacity', 1); }); }

    const STATUS = {
      'fat coll': 'A shared update climbs through a leaf switch, crosses a spine, and comes back down. This is one simplified path.',
      'rail coll': 'Matching GPUs talk along their own rail. The path is shorter because the wiring matches the work.',
      'fat cross': 'GPUs in different positions reach each other through the same switches. How fast depends on capacity and other traffic.',
      'rail cross': 'This message needs a different rail, so it first detours inside the server, sharing that link with other work.',
      'fat fail': 'One leaf switch goes dark and two of the four servers lose their connection. Redundant paths can change what happens next.',
      'rail fail': 'One rail goes dark on every server. Backup connections may let work continue at a lower speed.'
    };
    function counts() {
      const p = partsModel(), cur = s.topo === 'fat' ? p.fat : p.rail;
      $('b-switches').textContent = fmt(cur.switches);
      $('b-links').textContent = fmt(cur.links);
      $('b-optics').textContent = '$' + fmt(Math.round(cur.links * s.optic / 1000)) + 'k';
      $('b-cross').textContent = s.topo === 'fat' ? 'Direct path' : 'Detour inside a server';
      $('b-blast').textContent = s.topo === 'fat' ? p.nodesPerLeaf + ' servers per leaf' : 'One position on every server';
      $('b-compare').innerHTML = `For ${fmt(s.gpus)} GPUs, a fat-tree uses <b>${fmt(p.fat.switches)}</b> switches and <b>${fmt(p.fat.links)}</b> optical links; rails use <b>${fmt(p.rail.switches)}</b> switches and <b>${fmt(p.rail.links)}</b> links. The difference buys a different set of routes, not guaranteed speed.` + (p.railGroups > 1 ? ` Each rail needs ${p.railGroups} switch groups here; links between them are not counted, so the rail estimate is incomplete.` : '');
      $('b-basis').textContent = `${fmt(s.gpus)} GPUs, ${s.rails} per server, ${s.radix}-port switches, ${s.planes} plane${s.planes > 1 ? 's' : ''}, and ${s.over}:1 fat-tree uplinks`;
      $('layout-status').textContent = STATUS[s.topo + ' ' + s.scen];
    }
    const live = register({
      node: fig,
      tick(dt) {
        packets.forEach(p => {
          p.u = (p.u + dt * .45) % 1;
          const pos = along(p.path, p.u);
          p.node.setAttribute('cx', pos[0].toFixed(1)); p.node.setAttribute('cy', pos[1].toFixed(1));
          p.node.setAttribute('opacity', Math.min(1, Math.sin(p.u * Math.PI) * 2).toFixed(2));
        });
      }
    });
    return { rebuild() { build(); counts(); }, counts };
  })();

  // ======================= Figure 3: the physical row =======================
  const RACK = 46, H = 150, TRAY = 196;
  const racks = [0, 1, 2, 3, 4, 5, 6, 7].map(i => [i * 64, -i * 64]);
  const net = [8.6 * 64, -8.6 * 64];
  const rc = ([x, y]) => [x + RACK / 2, y + RACK / 2];
  function rowBase(g, withLeaves) {
    racks.forEach(r => {
      box(g, r[0], r[1], 0, RACK, RACK, H, COL.compute);
      if (withLeaves) box(g, r[0], r[1], H, RACK, RACK, 8, COL.network);
    });
  }
  function tray(g) {
    const a = iso(rc(racks[0])[0], rc(racks[0])[1], TRAY + 8), b = iso(rc(net)[0], rc(net)[1], TRAY + 8);
    el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: COL.steelDark, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-opacity': .45, 'vector-effect': 'non-scaling-stroke' }, g);
  }
  // The network rack: spine switches (or rail switches) stacked inside.
  function netRack(g, count, deadIndex) {
    const step = (H - 8) / count;
    for (let k = 0; k < count; k++) box(g, net[0], net[1], 4 + k * step, RACK, RACK, step - 4, k === deadIndex ? COL.down : COL.network);
  }
  // A cable rises from a rack, runs along the tray at its own tier, and drops into the network
  // rack, so 4, 2, or 1 uplinks per rack read as that many strands.
  function cable(g, from, z0, k, spacing, zEnd, attrs) {
    const [cx, cy] = rc(from), [nx, ny] = rc(net), zt = TRAY + k * spacing;
    const path = [[cx, cy, z0], [cx, cy, zt], [nx, ny, zt], [nx, ny, zEnd]];
    el('polyline', Object.assign({ points: path.map(p => iso(...p).join(',')).join(' '), fill: 'none', stroke: COL.network, 'stroke-width': 1.2, 'stroke-opacity': .6, 'vector-effect': 'non-scaling-stroke' }, attrs || {}), g);
    return path;
  }
  function rowCables(g, particlesOut, cablesOut) {
    const cg = el('g', {}, g);
    racks.forEach((r, i) => [0, 1, 2, 3].forEach(k => {
      const path = cable(cg, r, H + 8, k, 22, H);
      cablesOut.push({ k, node: cg.lastChild });
      particlesOut.push({ path: path.slice(0, 3), color: COL.network, speed: .3, k });
    }));
    return cg;
  }
  const rowCablesStat = $('row-cables-stat'), rowCablesText = $('row-cables');
  function cablesCopy() {
    const per = 4 / s.over;
    rowCablesText.textContent = `At ${s.over}:1, each leaf switch has ${per} uplink${per > 1 ? 's' : ''} to the spines: ${32 / s.over} logical links and ${64 / s.over} connection ends. ${s.over === 1 ? 'Every job crossing the spine gets full capacity.' : 'That is less equipment, but jobs crossing the spine share less bandwidth.'} Change the uplink capacity in Figure 1 to see the difference.`;
    rowCablesStat.innerHTML = `<i class="sw network"></i>${32 / s.over} links · ${64 / s.over} connection ends at ${s.over}:1`;
  }
  let row = null;
  row = stepper({
    fig: $('fig-row'), svg: $('row-svg'),
    wide: { viewBox: '0 0 960 520', rect: { x: 40, y: 50, w: 560, h: 420 } },
    narrow: { viewBox: '0 0 600 440', rect: { x: 30, y: 40, w: 540, h: 360 } },
    start: s.row === null ? 0 : s.row,
    advance: s.row === null,
    scenes: [
      // The room
      function (g) {
        tray(g); rowBase(g, true); netRack(g, 4, -1);
        return {
          particles: racks.map((r, i) => ({ path: [[rc(racks[0])[0], rc(racks[0])[1], TRAY + 8], [rc(net)[0], rc(net)[1], TRAY + 8]], color: COL.network, speed: .25, phase: i / 8 })),
          labels: [
            { text: 'Rack 3: the NVL72 from section 01', at: [racks[2][0], racks[2][1] + RACK, 70], side: 'left' },
            { text: 'A leaf switch on every rack', at: [racks[7][0] + RACK, racks[7][1] + RACK / 2, H + 4], side: 'right' },
            { text: 'Network rack: 4 spine switches', at: [net[0] + RACK, net[1] + RACK / 2, H / 2], side: 'right' }
          ]
        };
      },
      // The connections
      function (g) {
        const particles = [], cables = [];
        rowBase(g, true); rowCables(g, particles, cables); netRack(g, 4, -1);
        return { particles, labels: [{ text: '32 links through the overhead tray', at: [rc(racks[4])[0], rc(racks[4])[1], TRAY + 8], side: 'right' }] };
      },
      // The cables, at the chosen uplink capacity
      function (g) {
        const particles = [], cables = [];
        rowBase(g, true); rowCables(g, particles, cables); netRack(g, 4, -1);
        return { cablesScene: true, particles, cables, labels: [{ text: 'Uplinks at your capacity', at: [rc(racks[4])[0], rc(racks[4])[1], TRAY + 8], side: 'right', id: 'over' }] };
      },
      // The alternative: rails, with one rail switch lost
      function (g) {
        const particles = [];
        rowBase(g, false);
        const cg = el('g', {}, g);
        racks.forEach(r => [0, 1, 2, 3, 4, 5, 6, 7].forEach(k => {
          const lost = k === 3, step = (H - 8) / 8;
          const path = cable(cg, r, H, k, 1.6, 4 + k * step + step / 2, lost ? { stroke: COL.down, 'stroke-opacity': .9, 'stroke-dasharray': '4 3' } : { 'stroke-opacity': .35 });
          if (!lost && k % 3 === 0) particles.push({ path: path.slice(0, 3), color: COL.network, speed: .3 });
        }));
        netRack(g, 8, 3);
        return { particles, labels: [
          { text: 'Rail switches (8)', at: [net[0] + RACK, net[1] + RACK / 2, H - 20], side: 'right' },
          { text: 'One rail lost: that position in all 8 racks', at: [rc(racks[1])[0], rc(racks[1])[1], TRAY + 6], side: 'left' }
        ] };
      }
    ],
    onShow(scene, i, paused, user) { if (user) { s.row = i; save(); } if (row) applyOver(); }
  });
  // Show only the uplinks the chosen capacity keeps: 4, 2, or 1 per leaf.
  function applyOver() {
    cablesCopy();
    const keep = 4 / s.over;
    row.scenes.forEach(sc => {
      if (!sc.cablesScene) return;
      sc.cables.forEach(c => { c.node.style.display = c.k < keep ? '' : 'none'; });
      sc.particles.forEach(p => { p.off = p.k >= keep; });
      const pin = sc.labels.find(l => l.id === 'over');
      pin.node.querySelector('span').textContent = `${32 / s.over} uplinks at ${s.over}:1`;
      placeLabel(pin.node);
    });
  }

  // ======================= Controls =======================
  function segment(id, key, read, after) {
    const buttons = [...$(id).querySelectorAll('button')];
    const paint = () => buttons.forEach(b => b.setAttribute('aria-pressed', String(read(b) === s[key])));
    buttons.forEach(b => b.addEventListener('click', () => { s[key] = read(b); paint(); after(); }));
    paint();
  }
  const all = () => { time.update(); layoutFig.counts(); applyOver(); save(); };
  segment('span-seg', 'span', b => b.dataset.span, () => { time.update(); save(); });
  segment('over-seg', 'over', b => +b.dataset.over, all);
  segment('topo-seg', 'topo', b => b.dataset.topo, () => { layoutFig.rebuild(); time.update(); save(); });
  segment('scen-seg', 'scen', b => b.dataset.scen, () => { layoutFig.rebuild(); save(); });
  segment('fabric-seg', 'fabric', b => b.dataset.fabric, () => { time.update(); save(); });
  segment('planes-seg', 'planes', b => +b.dataset.planes, () => { layoutFig.counts(); save(); });
  const paramsOut = $('params-out');
  const inputs = {
    params: v => Math.max(7, v || 70), compute: v => Math.max(.01, v || 10), overlap: v => clamp((v || 0) / 100, 0, 1),
    measured: v => Math.max(0, v || 0), sticker: v => Math.max(.01, v || 2.5),
    gpus: v => Math.max(16, v || 512), radix: v => Math.max(16, v || 64), rails: v => Math.max(1, v || 8), optic: v => Math.max(0, v || 0)
  };
  Object.keys(inputs).forEach(key => {
    const input = $(key);
    input.value = key === 'overlap' ? Math.round(s.overlap * 100) : key === 'sticker' ? s.sticker.toFixed(2) : s[key];
    input.addEventListener('input', () => {
      if (input.value === '' || !input.validity.valid) return;
      s[key] = inputs[key](+input.value);
      paramsOut.textContent = s.params + 'B';
      time.update(); layoutFig.counts(); save();
    });
  });
  paramsOut.textContent = s.params + 'B';

  $('download-time').addEventListener('click', () => {
    desk.download('compute-desk-network.txt', ['Compute Desk — network tax', 'Fabric: ' + FABRICS[s.fabric].label, 'Oversubscription: ' + s.over + ':1', 'Placement: ' + SPANS[s.span].label, 'Model: ' + s.params + 'B parameters', 'Compute-only step: ' + s.compute + ' sec', 'Overlap: ' + Math.round(s.overlap * 100) + '%', 'Measured NCCL: ' + (s.measured ? s.measured + ' GB/s' : 'not supplied'), 'Sticker: $' + s.sticker.toFixed(2) + '/GPU-hour', 'Layout: ' + (s.topo === 'fat' ? 'fat-tree' : 'rails'), 'Scenario: ' + location.href].join('\n'));
  });
  $('download-bom').addEventListener('click', () => {
    const rows = ['topology,gpus,switch_radix,rails,oversubscription,planes,optic_allowance', '"' + s.topo + '",' + s.gpus + ',' + s.radix + ',' + s.rails + ',' + s.over + ',' + s.planes + ',' + s.optic, '', '', 'Planning estimate only. Obtain the vendor port map before procurement.', location.href];
    desk.download('compute-desk-topology-bom.csv', rows.join('\n'), 'text/csv;charset=utf-8');
  });

  time.update();
  layoutFig.rebuild();
  applyOver();
  save();
})();
