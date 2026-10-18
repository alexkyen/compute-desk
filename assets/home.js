/* The homepage's five figures. Drawing, labels, and the animation loop come from figures.js. */
(function () {
  'use strict';
  const { COL, reduced, el, mix, light, fmt, money, clamp, lerp, iso, pts, box, fit, makeLabel, placeLabel, register } = window.Figures;

  // ---------- Figure 1: price spread ----------
  (function prices() {
    const host = document.getElementById('price-plot');
    if (!host) return;
    const groups = [
      ['Hyperscalers', [['Google Cloud', 11.06, null, 'a3-highgpu, us-central1 list price'], ['Oracle', 10.00, null, 'Bare-metal list price'], ['Azure', 9.60, [6.98, 12.29], 'NC H100 NVL $6.98 to ND96isr $12.29'], ['AWS', 6.88, null, 'On-demand, after mid-2025 cuts']]],
      ['Neoclouds', [['CoreWeave', 6.16, null, 'Published list price'], ['Crusoe', 3.90, null, 'List price, per-minute billing'], ['Nebius', 3.85, null, 'Rate card, June 2026'], ['Lambda', 2.99, [2.49, 3.44], 'By configuration, $2.49 to $3.44'], ['Fluidstack', 2.10, null, 'Aggregator index']]],
      ['Marketplaces', [['Vast.ai', 1.87, null, 'On-demand tier, set by hosts']]]
    ];
    const max = 13;
    const pct = x => (x / max * 100) + '%';
    const moves = [];
    groups.forEach(([name, rows]) => {
      const head = document.createElement('div'); head.className = 'pp-group'; head.textContent = name; host.appendChild(head);
      rows.forEach(([seller, val, range, note]) => {
        const row = document.createElement('div'); row.className = 'pp-row'; row.title = `${seller}: $${val.toFixed(2)} per GPU-hour. ${note}.`;
        row.innerHTML = `<span class="pp-name"></span><span class="pp-lane"></span><span class="pp-val">$${val.toFixed(2)}</span>`;
        row.querySelector('.pp-name').textContent = seller;
        const lane = row.querySelector('.pp-lane');
        let bar = null;
        if (range) { bar = document.createElement('i'); bar.className = 'pp-range'; bar.style.left = '0%'; bar.style.width = '0%'; lane.appendChild(bar); }
        const dot = document.createElement('i'); dot.className = 'pp-dot'; dot.style.left = '0%'; lane.appendChild(dot);
        moves.push(() => { dot.style.left = pct(val); if (bar) { bar.style.left = pct(range[0]); bar.style.width = pct(range[1] - range[0]); } });
        host.appendChild(row);
      });
    });
    // Once the dots land, a bracket stretches from the cheapest to the most expensive seller.
    const lo = 1.87, hi = 11.06;
    const spread = document.createElement('div'); spread.className = 'pp-row pp-spread';
    spread.innerHTML = `<span class="pp-name">Spread</span><span class="pp-lane"><i class="pp-bracket"></i></span><span class="pp-val">${(hi / lo).toFixed(1)}×</span>`;
    const bracket = spread.querySelector('.pp-bracket'); bracket.style.left = pct(lo);
    moves.push(() => setTimeout(() => { bracket.style.width = pct(hi - lo); spread.classList.add('is-on'); }, reduced ? 0 : 500));
    host.appendChild(spread);
    const axis = document.createElement('div'); axis.className = 'pp-axis';
    axis.innerHTML = '<span>per GPU-hour</span><span class="pp-ticks"></span><span></span>';
    const ticks = axis.querySelector('.pp-ticks');
    [0, 2, 4, 6, 8, 10, 12].forEach(t => { const s = document.createElement('span'); s.style.left = pct(t); s.textContent = '$' + t; ticks.appendChild(s); });
    host.appendChild(axis);
    let done = false;
    const run = () => { if (done) return; done = true; moves.forEach((m, i) => setTimeout(m, reduced ? 0 : 90 * i)); };
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting && run()), { threshold: .3 }).observe(host);
  })();

  // ---------- Figure 2: from one GPU to a cluster ----------
  (function stack() {
    const fig = document.getElementById('fig-stack');
    const svg = document.getElementById('stack-svg');
    if (!fig || !svg) return;
    const steps = [...fig.querySelectorAll('.callout-step')];
    const scenes = [];
    const particles = [];

    function scene(build) {
      const outer = el('g', { class: 'scene' }, svg);
      const inner = el('g', {}, outer);
      const fx = el('g', {}, inner);
      const api = build(inner, fx) || {};
      scenes.push(Object.assign({ outer, inner, fx, labels: [] }, api));
      return scenes[scenes.length - 1];
    }

    // Step 1: one GPU package, memory filling with model weights.
    const hbmLayers = [];
    scene(function (g, fx) {
      box(g, 0, 0, 0, 260, 260, 10, COL.steel);
      box(g, 30, 30, 10, 200, 200, 5, COL.steelDark);
      // Draw back-to-front: far memory column, the dies, then the near column.
      const column = x => [50, 88, 126, 164].forEach(y => {
        for (let i = 0; i < 8; i++) hbmLayers.push({ i, layer: box(g, x, y, 15 + i * 3.4, 26, 30, 3.4, light(COL.memory, .72)) });
      });
      column(40);
      const dies = [box(g, 92, 55, 15, 34, 150, 12, COL.compute), box(g, 134, 55, 15, 34, 150, 12, COL.compute)];
      column(194);
      // Data flows from memory into the dies.
      [50, 88, 126, 164].forEach(y => {
        particles.push({ scene: 0, from: [66, y + 15, 30], to: [92, y + 15, 30], color: COL.memory, phase: Math.random() });
        particles.push({ scene: 0, from: [194, y + 15, 30], to: [168, y + 15, 30], color: COL.memory, phase: Math.random() });
      });
      return { dies, label: [
        { text: 'Compute dies', at: [130, 130, 27], side: 'right' },
        { text: 'Memory (HBM)', at: [53, 50, 42], side: 'left' },
        { text: 'Model weights: 0 GB', at: [207, 190, 42], side: 'right', id: 'weights' }
      ] };
    });

    // Step 2: a compute tray with four GPUs and two CPUs.
    scene(function (g, fx) {
      box(g, 0, 0, 0, 440, 200, 16, COL.steel);
      [[70, 30], [70, 120]].forEach(([x, y]) => { box(g, x, y, 16, 50, 50, 3, COL.steelDark); box(g, x + 10, y + 10, 19, 30, 30, 5, COL.power); });
      const gpus = [];
      [[200, 25], [200, 110], [300, 25], [300, 110]].forEach(([x, y]) => {
        box(g, x, y, 16, 70, 70, 3, COL.steelDark);
        box(g, x + 6, y + 14, 19, 10, 42, 7, COL.memory);
        gpus.push(box(g, x + 22, y + 12, 19, 26, 46, 6, COL.compute));
        box(g, x + 54, y + 14, 19, 10, 42, 7, COL.memory);
      });
      for (let i = 0; i < 6; i++) box(g, 412, 12 + i * 31, 16, 22, 26, 10, '#6f6a60');
      [[120, 55], [120, 145]].forEach(([x, y]) => [235, 335].forEach(tx => particles.push({ scene: 1, from: [x, y, 26], to: [tx, y - 5, 26], color: COL.ink2, phase: Math.random() })));
      return { dies: gpus, label: [
        { text: 'Grace CPUs', at: [95, 55, 26], side: 'left' },
        { text: 'Four GPUs', at: [335, 145, 26], side: 'right' }
      ] };
    });

    // Step 3: the rack, with switch trays in the middle.
    scene(function (g, fx) {
      const W = 130, D = 110;
      box(g, 0, 0, 0, W, D, 8, '#5f5a51');
      let z = 8;
      const order = [['power', 3], ['compute', 8], ['switch', 9], ['compute', 10], ['power', 3]];
      const switches = [], computes = [];
      order.forEach(([kind, n]) => {
        for (let i = 0; i < n; i++) {
          const color = kind === 'power' ? COL.power : kind === 'switch' ? COL.network : COL.compute;
          const b = box(g, 0, 0, z, W, D, 7, color);
          if (kind === 'switch') switches.push(z); else if (kind === 'compute') computes.push(b);
          z += 8;
        }
      });
      box(g, 0, 0, z, W, D, 5, '#5f5a51');
      // Signals sweep across the switch trays.
      switches.forEach((sz, i) => particles.push({ scene: 2, from: [8, D, sz + 3.5], to: [W - 8, D, sz + 3.5], color: '#ffffff', phase: i / 9, speed: .55 }));
      return { label: [
        { text: 'NVLink switch trays', at: [W, D / 2, 8 + 11 * 8 + 36], side: 'right' },
        { text: 'Compute trays', at: [W, D / 2, 8 + 20 * 8 + 40], side: 'right' },
        { text: 'Power shelves', at: [0, D, 20], side: 'left' }
      ] };
    });

    // Step 4: a row of racks joined to spine switches overhead.
    scene(function (g, fx) {
      // The row runs along the screen's horizontal (x = u, y = -u); spines stand one row behind.
      const R = 50, H = 150;
      const racks = [0, 1, 2, 3, 4, 5].map(i => [i * 78, -i * 78]);
      const spines = [1.4, 3.6].map(u => [u * 78 - 120, -u * 78 - 120]);
      spines.forEach(([x, y]) => box(g, x, y, 0, R, R, H, COL.network));
      // Overhead cables run above everything, so draw them before the racks only where they sit behind.
      const cables = el('g', { fill: 'none', stroke: COL.network, 'stroke-width': 1.4, 'stroke-opacity': .55, 'vector-effect': 'non-scaling-stroke' }, g);
      racks.forEach(([x, y]) => {
        box(g, x, y, 0, R, R, 64, COL.compute);
        box(g, x, y, 64, R, R, 20, COL.network);
        box(g, x, y, 84, R, R, 64, COL.compute);
      });
      g.appendChild(cables);
      racks.forEach(([x, y]) => spines.forEach(([sx, sy]) => {
        const path = [[x + R / 2, y + R / 2, 148], [x + R / 2, y + R / 2, 205], [sx + R / 2, sy + R / 2, 205], [sx + R / 2, sy + R / 2, H]];
        el('polyline', { points: pts(path), 'vector-effect': 'non-scaling-stroke' }, cables);
        particles.push({ scene: 3, path, color: COL.network, phase: Math.random(), speed: .35 });
      }));
      return { label: [
        { text: 'Spine switches', at: [spines[1][0] + R, spines[1][1] + R / 2, 110], side: 'right' },
        { text: 'Racks of GPUs', at: [racks[5][0] + R, racks[5][1] + R / 2, 40], side: 'right' }
      ] };
    });

    // Particles live in a top layer per scene so they draw over the boxes.
    particles.forEach(p => {
      const s = scenes[p.scene];
      const start = iso(...(p.path ? p.path[0] : p.from));
      p.node = el('circle', { cx: start[0], cy: start[1], opacity: 0, r: p.scene === 2 ? 1.6 : 3, fill: p.color, stroke: p.scene === 2 ? 'none' : COL.surface, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, s.fx);
    });
    scenes.forEach(s => s.inner.appendChild(s.fx));

    // Labels.
    scenes.forEach(s => (s.label || []).forEach(l => { const n = makeLabel(svg, l.text, l.side); n.hidden = true; s.labels.push(Object.assign({ node: n }, l)); }));

    const narrow = matchMedia('(max-width: 760px)');
    function layout() {
      svg.setAttribute('viewBox', narrow.matches ? '0 0 600 440' : '0 0 960 520');
      const target = narrow.matches ? { x: 50, y: 44, w: 500, h: 352 } : { x: 60, y: 60, w: 520, h: 400 };
      scenes.forEach(s => { s.xf = fit(s.inner, target); s.labels.forEach(l => placeLabel(l.node, svg, s.xf, l.at)); });
    }
    layout();
    narrow.addEventListener('change', layout);

    // Stepper state.
    const dotsHost = fig.querySelector('.step-dots');
    const dots = steps.map((_, i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + steps[i].querySelector('h3').textContent); dotsHost.appendChild(b); return b; });
    const callout = fig.querySelector('.callout');
    let step = 0, advancing = true, clock = 0, sceneTime = 0, live = null;
    const DWELL = 7.5;

    function show(i, user) {
      step = (i + steps.length) % steps.length;
      sceneTime = 0; clock = 0;
      steps.forEach((s, k) => { s.hidden = k !== step; });
      dots.forEach((d, k) => d.setAttribute('aria-current', k === step ? 'true' : 'false'));
      scenes.forEach((s, k) => { s.outer.classList.toggle('is-on', k === step); s.outer.classList.toggle('is-past', k < step); s.labels.forEach(l => { l.node.hidden = k !== step; if (k === step) placeLabel(l.node); }); });
      // While paused, memory shows as loaded; while playing, it fills again.
      if (step === 0) paintWeights(live && !live.paused ? 0 : 10);
      if (user) { callout.setAttribute('aria-live', 'polite'); }
    }
    const take = i => { advancing = false; show(i, true); };
    fig.querySelector('.step-prev').addEventListener('click', () => take(step - 1));
    fig.querySelector('.step-next').addEventListener('click', () => take(step + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => take(i)));

    const weightsLabel = scenes[0].labels.find(l => l.id === 'weights');
    function paintWeights(t) {
      // Fill the eight layers of each stack to 140 of 192 GB, then hold.
      const target = 140 / 192 * 8;
      const filled = Math.min(target, t * 1.6);
      const empty = light(COL.memory, .72);
      hbmLayers.forEach(h => h.layer.paint(h.i >= filled ? empty : mix(empty, COL.memory, Math.min(1, filled - h.i))));
      const gb = Math.round(Math.min(140, filled / target * 140));
      const text = gb >= 140 ? 'Weights: 140 of 192 GB' : 'Weights: ' + gb + ' GB';
      const span = weightsLabel.node.querySelector('span');
      if (span.textContent !== text) { span.textContent = text; placeLabel(weightsLabel.node); }
    }

    live = register({
      node: fig,
      onPause(p) { if (!p) advancing = true; },
      tick(dt, t) {
        sceneTime += dt;
        if (advancing) { clock += dt; if (clock > DWELL) show(step + 1); }
        if (step === 0) paintWeights(sceneTime);
        // Dies pulse while working.
        const pulse = .5 + .5 * Math.sin(t * 5);
        (scenes[step].dies || []).forEach(d => d.top.setAttribute('fill', mix(light(COL.compute, .22), light(COL.compute, .55), pulse)));
        particles.forEach(p => {
          if (p.scene !== step) { p.node.setAttribute('opacity', 0); return; }
          p.phase = (p.phase + dt * (p.speed || .8)) % 1;
          let pos;
          if (p.path) {
            const seg = p.path.length - 1, f = p.phase * seg, k = Math.min(seg - 1, Math.floor(f)), u = f - k;
            const a = p.path[k], b = p.path[k + 1];
            pos = iso(lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u));
          } else {
            pos = iso(lerp(p.from[0], p.to[0], p.phase), lerp(p.from[1], p.to[1], p.phase), lerp(p.from[2], p.to[2], p.phase));
          }
          p.node.setAttribute('cx', pos[0].toFixed(1)); p.node.setAttribute('cy', pos[1].toFixed(1));
          p.node.setAttribute('opacity', Math.sin(p.phase * Math.PI).toFixed(2));
        });
      }
    });
    show(0);
  })();

  // ---------- Figure 3: a training step, live ----------
  (function network() {
    const fig = document.getElementById('fig-net');
    const svg = document.getElementById('net-svg');
    if (!fig || !svg) return;
    const inner = el('g', {}, svg);

    // Servers sit along a diagonal so the row reads left to right.
    const S = 64, servers = [0, 84, 214, 298].map(u => ({ x: u, y: -u }));
    const center = (o, size) => [o.x + size / 2, o.y + size / 2];
    const leafs = [[0, 1], [2, 3]].map(([a, b]) => {
      const ca = center(servers[a], S), cb = center(servers[b], S);
      const cx = (ca[0] + cb[0]) / 2, cy = (ca[1] + cb[1]) / 2;
      return { cx, cy, z: 125 };
    });
    const mid = [(leafs[0].cx + leafs[1].cx) / 2, (leafs[0].cy + leafs[1].cy) / 2];
    const spines = [[-58, -58], [58, 58]].map(([dx, dy]) => ({ cx: mid[0] + dx, cy: mid[1] - dy, z: 255 }));
    const cables = el('g', { stroke: COL.network, 'stroke-opacity': .45, 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }, inner);
    const line = (a, b, g) => { const p = iso(...a), q = iso(...b); return el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], 'vector-effect': 'non-scaling-stroke' }, g || cables); };

    const gpuTiles = [];
    servers.forEach((s, i) => {
      box(inner, s.x, s.y, 0, S, S, 26, COL.steel);
      [[6, 6], [34, 6], [6, 34], [34, 34]].forEach(([dx, dy]) => gpuTiles.push(box(inner, s.x + dx, s.y + dy, 26, 24, 24, 5, COL.compute)));
    });
    const SW = 30; // half the footprint of a switch
    const leafBoxes = leafs.map(l => box(inner, l.cx - SW, l.cy - SW, l.z, SW * 2, SW * 2, 12, COL.network));
    const spineLines = [];
    servers.forEach((s, i) => { const c = center(s, S), l = leafs[i < 2 ? 0 : 1]; line([c[0], c[1], 31], [l.cx, l.cy, l.z]); });
    leafs.forEach(l => spines.forEach((sp, k) => { spineLines.push({ k, node: line([l.cx, l.cy, l.z + 12], [sp.cx, sp.cy, sp.z]) }); }));
    const spineBoxes = spines.map(sp => box(inner, sp.cx - SW, sp.cy - SW, sp.z, SW * 2, SW * 2, 12, COL.network));
    const fx = el('g', {}, inner);

    const labels = [
      { text: 'Spine switches', at: [spines[1].cx + SW, spines[1].cy, spines[1].z + 6], side: 'right' },
      { text: 'Leaf switches', at: [leafs[1].cx + SW, leafs[1].cy, leafs[1].z + 6], side: 'right' },
      { text: 'Servers, 4 GPUs each', at: [servers[0].x, servers[0].y + S, 14], side: 'left' }
    ].map(l => Object.assign({ node: makeLabel(svg, l.text, l.side) }, l));
    const offline = makeLabel(svg, 'Offline', 'left'); offline.classList.add('pin-down'); offline.hidden = true;
    const narrow = matchMedia('(max-width: 760px)');
    let xf;
    function layout() {
      svg.setAttribute('viewBox', narrow.matches ? '0 0 600 560' : '0 0 960 470');
      xf = fit(inner, narrow.matches ? { x: 30, y: 90, w: 540, h: 420 } : { x: 180, y: 80, w: 600, h: 340 });
      labels.forEach(l => placeLabel(l.node, svg, xf, l.at));
      placeLabel(offline, svg, xf, [spines[0].cx - SW, spines[0].cy + SW, spines[0].z + 6]);
    }
    layout();
    narrow.addEventListener('change', layout);

    // Packets: each server sends to a server under the other leaf, through a spine.
    const packets = [];
    const route = (from, to, k) => {
      const a = center(servers[from], S), b = center(servers[to], S);
      const la = leafs[from < 2 ? 0 : 1], lb = leafs[to < 2 ? 0 : 1], sp = spines[k];
      return [[a[0], a[1], 31], [la.cx, la.cy, la.z + 6], [sp.cx, sp.cy, sp.z + 6], [lb.cx, lb.cy, lb.z + 6], [b[0], b[1], 31]];
    };
    for (let i = 0; i < 4; i++) for (let n = 0; n < 3; n++) {
      packets.push({ i, n, node: el('circle', { r: 6, fill: COL.network, stroke: COL.surface, 'stroke-width': 1.5, opacity: 0, 'vector-effect': 'non-scaling-stroke' }, fx) });
    }

    // State and the arithmetic behind the readouts.
    let bw = 1, failed = false;
    const COMPUTE = 10, BASE_X = 3, SEC = .22; // modeled seconds; real seconds per modeled second
    const exchange = () => BASE_X * bw * (failed ? 2 : 1);
    const els = { phase: document.getElementById('net-phase'), tc: document.getElementById('t-compute'), tw: document.getElementById('t-wait'), rc: document.getElementById('r-compute'), rw: document.getElementById('r-wait'), rs: document.getElementById('r-share'), rk: document.getElementById('r-cost') };
    const MAXT = COMPUTE + BASE_X * 4 * 2;
    function readouts() {
      const x = exchange(), total = COMPUTE + x;
      els.rw.textContent = x + ' s';
      els.rs.textContent = Math.round(x / total * 100) + '%';
      els.rk.textContent = '$' + (3 * total / COMPUTE).toFixed(2);
    }
    function paintFailure() {
      spineBoxes[0].paint(failed ? COL.down : COL.network);
      spineLines.forEach(s => { if (s.k === 0) s.node.setAttribute('stroke-opacity', failed ? .1 : .45); });
      offline.hidden = !failed;
    }
    fig.querySelectorAll('[data-bw]').forEach(b => b.addEventListener('click', () => {
      bw = Number(b.dataset.bw);
      fig.querySelectorAll('[data-bw]').forEach(o => o.setAttribute('aria-pressed', o === b ? 'true' : 'false'));
      readouts(); t0 = 0; settle();
    }));
    const failBtn = document.getElementById('net-fail');
    failBtn.addEventListener('click', () => {
      failed = !failed; failBtn.setAttribute('aria-pressed', failed); failBtn.textContent = failed ? 'Bring the switch back' : 'Take a spine switch offline';
      paintFailure(); readouts(); t0 = 0; settle();
    });
    readouts();

    let t0 = 0;
    function setPhase(name) {
      if (els.phase.dataset.name === name) return;
      els.phase.dataset.name = name;
      els.phase.innerHTML = name === 'compute' ? '<i class="sw compute"></i>Computing' : '<i class="sw network"></i>Exchanging results';
    }
    function drawStep(t) {
      const x = exchange();
      const tc = COMPUTE * SEC, tx = x * SEC, pause = .6;
      const cycle = tc + tx + pause;
      const local = t % cycle;
      const computeDone = Math.min(1, local / tc);
      const exchangeDone = clamp((local - tc) / tx, 0, 1);
      els.tc.style.width = (COMPUTE * computeDone / MAXT * 100) + '%';
      els.tw.style.width = (x * exchangeDone / MAXT * 100) + '%';
      const computing = local < tc;
      setPhase(computing ? 'compute' : 'exchange');
      const pulse = computing ? .5 + .5 * Math.sin(t * 9) : 0;
      gpuTiles.forEach((g, i) => g.top.setAttribute('fill', computing ? mix(light(COL.compute, .22), light(COL.compute, .6), (pulse + (i % 4) * .2) % 1) : light(COL.compute, .5)));
      packets.forEach(p => {
        if (computing || local > tc + tx) { p.node.setAttribute('opacity', 0); return; }
        const k = failed ? 1 : (p.i + p.n) % 2;
        const path = route(p.i, (p.i + 2) % 4, k);
        const u = clamp(exchangeDone * 1.25 - p.n * .12, 0, 1);
        const seg = path.length - 1, f = u * seg, s = Math.min(seg - 1, Math.floor(f)), w = f - s;
        const a = path[s], b = path[s + 1];
        const pos = iso(lerp(a[0], b[0], w), lerp(a[1], b[1], w), lerp(a[2], b[2], w));
        p.node.setAttribute('cx', pos[0].toFixed(1)); p.node.setAttribute('cy', pos[1].toFixed(1));
        p.node.setAttribute('opacity', u > 0 && u < 1 ? 1 : 0);
      });
    }
    // Paused: packets mid-flight, and the whole step drawn on the timeline.
    function settle() {
      if (!live || !live.paused) return;
      drawStep(COMPUTE * SEC + exchange() * SEC * .5);
      els.tw.style.width = (exchange() / MAXT * 100) + '%';
    }
    const live = register({ node: fig, tick(dt) { t0 += dt; drawStep(t0); } });
    settle();
  })();

  // ---------- Figure 4: a month of demand and a reservation line ----------
  (function bill() {
    const fig = document.getElementById('fig-bill');
    const svg = document.getElementById('bill-svg');
    if (!fig || !svg) return;
    const H = 720, RES = 2, OD = 6;
    // Deterministic illustrative demand: a daily cycle, quieter weekends, and bursts of work.
    let seed = 7;
    const rand = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const raw = [];
    for (let h = 0; h < H; h++) { const wk = (Math.floor(h / 24) % 7) >= 5 ? .75 : 1; raw.push(wk * (62 + 22 * Math.sin(2 * Math.PI * (h - 9) / 24)) + (rand() - .5) * 10); }
    [[40, 30, 170], [130, 20, 90], [200, 44, 140], [290, 14, 390], [352, 36, 120], [430, 26, 210], [505, 50, 95], [575, 18, 300], [640, 30, 150], [690, 16, 80]]
      .forEach(([s, len, ht]) => { for (let h = s; h < Math.min(H, s + len); h++) raw[h] += ht * Math.min(1, (h - s + 1) / 4, (s + len - h) / 4); });
    const mean = raw.reduce((a, b) => a + b) / H;
    const demand = raw.map(x => Math.max(0, Math.round(x * 100 / mean)));
    const totalUsed = demand.reduce((a, b) => a + b);
    const billFor = R => { let b = R * H * RES; for (const d of demand) if (d > R) b += (d - R) * OD; return b; };
    let best = 0, bestBill = Infinity;
    for (let R = 0; R <= 420; R++) { const b = billFor(R); if (b < bestBill) { bestBill = b; best = R; } }

    const slider = document.getElementById('bill-r'), out = document.getElementById('bill-r-out');
    const els = { util: document.getElementById('b-util'), bill: document.getElementById('b-bill'), eff: document.getElementById('b-eff'), gap: document.getElementById('b-gap') };
    let W = 960, Ht = 300, m = { l: 52, r: 16, t: 14, b: 30 };
    let xs, ys, gIdle, gUsed, gOver, lineR, labelR, hover;
    const YMAX = 420;

    function build() {
      W = Math.max(320, Math.round(svg.parentNode.clientWidth));
      Ht = W < 560 ? 240 : 300;
      m = W < 560 ? { l: 40, r: 10, t: 14, b: 28 } : { l: 52, r: 16, t: 14, b: 30 };
      svg.setAttribute('viewBox', `0 0 ${W} ${Ht}`);
      svg.textContent = '';
      xs = h => m.l + h / (H - 1) * (W - m.l - m.r);
      ys = d => Ht - m.b - d / YMAX * (Ht - m.t - m.b);
      const axis = el('g', { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 13, fill: COL.ink2 }, svg);
      [0, 100, 200, 300, 400].forEach(d => {
        el('line', { x1: m.l, x2: W - m.r, y1: ys(d), y2: ys(d), stroke: COL.rule, 'stroke-width': 1 }, axis);
        el('text', { x: m.l - 8, y: ys(d) + 4, 'text-anchor': 'end' }, axis).textContent = d;
      });
      [0, 7, 14, 21, 28].forEach(day => {
        const t = el('text', { x: xs(day * 24), y: Ht - 8, 'text-anchor': day === 0 ? 'start' : 'middle' }, axis);
        t.textContent = day === 0 ? 'Day 1' : 'Day ' + (day + 1);
      });
      el('text', { x: m.l + 6, y: m.t + 12, fill: COL.ink2 }, axis).textContent = 'GPUs needed';
      gIdle = el('path', { fill: light(COL.idle, .35) }, svg);
      gUsed = el('path', { fill: COL.compute, 'fill-opacity': .85 }, svg);
      gOver = el('path', { fill: COL.money, 'fill-opacity': .85 }, svg);
      const dline = demand.map((d, h) => (h ? 'L' : 'M') + xs(h).toFixed(1) + ' ' + ys(d).toFixed(1)).join('');
      el('path', { d: dline, fill: 'none', stroke: COL.ink, 'stroke-width': 1, 'stroke-opacity': .5 }, svg);
      const bestY = ys(best);
      el('line', { x1: m.l, x2: W - m.r, y1: bestY, y2: bestY, stroke: COL.ink, 'stroke-dasharray': '3 4', 'stroke-width': 1, 'stroke-opacity': .6 }, svg);
      lineR = el('line', { x1: m.l, x2: W - m.r, stroke: COL.ink, 'stroke-width': 2 }, svg);
      labelR = el('g', {}, svg);
      el('rect', { rx: 6, height: 24, fill: COL.ink }, labelR);
      el('text', { x: 10, y: 16.5, 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 13, 'font-weight': 600, fill: '#fff' }, labelR);
      const bestTag = el('g', {}, svg);
      const bestRect = el('rect', { rx: 6, height: 24, fill: COL.surface, stroke: COL.ink, 'stroke-dasharray': '3 3' }, bestTag);
      const bestText = el('text', { x: 10, y: 16.5, 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 13, 'font-weight': 500, fill: COL.ink }, bestTag);
      bestText.textContent = 'Lowest bill: ' + best + ' reserved';
      const bw = bestText.getComputedTextLength() + 20;
      bestRect.setAttribute('width', bw);
      bestTag.setAttribute('transform', `translate(${W - m.r - bw - 8} ${bestY - 12})`);
      hover = el('g', { opacity: 0, 'pointer-events': 'none' }, svg);
      el('line', { y1: m.t, y2: Ht - m.b, stroke: COL.ink, 'stroke-width': 1 }, hover);
      el('circle', { r: 4, fill: COL.ink, stroke: '#fff', 'stroke-width': 1.5 }, hover);
      const tip = el('g', {}, hover);
      el('rect', { rx: 6, height: 24, fill: COL.surface, stroke: COL.rule }, tip);
      el('text', { x: 8, y: 16.5, 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 13, fill: COL.ink }, tip);
      draw(R);
    }

    function draw(Rv) {
      const R = Math.round(Rv);
      const yR = ys(R);
      let used = 'M' + xs(0) + ' ' + ys(0), over = '';
      demand.forEach((d, h) => { used += 'L' + xs(h).toFixed(1) + ' ' + ys(Math.min(d, R)).toFixed(1); });
      used += 'L' + xs(H - 1) + ' ' + ys(0) + 'Z';
      // On-demand area: the part of demand above the line.
      over = 'M' + xs(0) + ' ' + yR.toFixed(1);
      demand.forEach((d, h) => { over += 'L' + xs(h).toFixed(1) + ' ' + ys(Math.max(d, R)).toFixed(1); });
      over += 'L' + xs(H - 1) + ' ' + yR.toFixed(1) + 'Z';
      gIdle.setAttribute('d', `M${xs(0)} ${yR}L${xs(H - 1)} ${yR}L${xs(H - 1)} ${ys(0)}L${xs(0)} ${ys(0)}Z`);
      gUsed.setAttribute('d', used); gOver.setAttribute('d', over);
      lineR.setAttribute('y1', yR); lineR.setAttribute('y2', yR);
      const txt = labelR.querySelector('text'); txt.textContent = R + ' reserved';
      const tw = txt.getComputedTextLength() + 20;
      labelR.querySelector('rect').setAttribute('width', tw);
      labelR.setAttribute('transform', `translate(${m.l + 8} ${clamp(yR - 12, m.t, Ht - m.b - 24)})`);
      // Readouts.
      const b = billFor(R);
      let usedReserved = 0; for (const d of demand) usedReserved += Math.min(d, R);
      els.util.textContent = R ? Math.round(usedReserved / (R * H) * 100) + '%' : '—';
      els.bill.textContent = money(b);
      els.eff.textContent = '$' + (b / totalUsed).toFixed(2);
      const gap = b - bestBill;
      els.gap.textContent = gap < bestBill * .004 ? 'Lowest' : '+' + money(gap);
      out.textContent = R;
      if (Number(slider.value) !== R) slider.value = R;
    }

    // Autoplay sweeps the line until someone takes over.
    let R = 120, t = 0, live = null;
    const sweep = time => 190 - 140 * Math.cos(time * 2 * Math.PI / 12);
    slider.addEventListener('input', () => { live.setPaused(true); R = Number(slider.value); draw(R); });
    document.getElementById('bill-best').addEventListener('click', () => {
      live.setPaused(true);
      if (reduced) { R = best; draw(R); return; }
      const from = R, start = performance.now();
      (function ease(now) {
        const k = Math.min(1, (now - start) / 600), e = 1 - Math.pow(1 - k, 3);
        R = lerp(from, best, e); draw(R);
        if (k < 1) requestAnimationFrame(ease);
      })(start);
    });
    svg.addEventListener('pointermove', e => {
      const box = svg.getBoundingClientRect();
      const x = (e.clientX - box.left) / box.width * W;
      const h = clamp(Math.round((x - m.l) / (W - m.l - m.r) * (H - 1)), 0, H - 1);
      const d = demand[h];
      hover.setAttribute('opacity', 1);
      hover.querySelector('line').setAttribute('x1', xs(h)); hover.querySelector('line').setAttribute('x2', xs(h));
      hover.querySelector('circle').setAttribute('cx', xs(h)); hover.querySelector('circle').setAttribute('cy', ys(d));
      const tip = hover.querySelector('g'), tt = tip.querySelector('text');
      tt.textContent = `Day ${Math.floor(h / 24) + 1}, ${String(h % 24).padStart(2, '0')}:00 · ${d} GPUs needed`;
      const tw = tt.getComputedTextLength() + 16;
      tip.querySelector('rect').setAttribute('width', tw);
      tip.setAttribute('transform', `translate(${clamp(xs(h) + 10, m.l, W - m.r - tw)} ${m.t + 18})`);
    });
    svg.addEventListener('pointerleave', () => hover.setAttribute('opacity', 0));
    build();
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 120); });

    live = register({
      node: fig,
      // Resume the sweep from wherever the line was left.
      onPause(p) { if (!p) { const c = clamp((190 - R) / 140, -1, 1); t = Math.acos(c) * 12 / (2 * Math.PI); } },
      tick(dt) { t += dt; R = sweep(t); draw(R); }
    });
  })();

  // ---------- Figure 5: one month of failures, measured two ways ----------
  (function contract() {
    const fig = document.getElementById('fig-sla');
    const svg = document.getElementById('sla-svg');
    if (!fig || !svg) return;
    const inner = el('g', {}, svg);
    const N = 32, T = 11, GAP = 2.5;
    const healthy = light(COL.compute, .35), scar = light(COL.down, .62);
    const tiles = [];
    // The platform: a separate box that keeps answering all month.
    box(inner, -150, 300, 0, 64, 64, 46, COL.steel);
    const lamp = box(inner, -131, 319, 46, 26, 26, 6, COL.compute);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = c * (T + GAP), y = r * (T + GAP);
      tiles.push(el('polygon', { points: pts([[x, y, 0], [x + T, y, 0], [x + T, y + T, 0], [x, y + T, 0]]), fill: healthy }, inner));
    }
    // Servers are 2×4 blocks of eight GPUs.
    const serverTiles = s => { const bc = s % 16, br = Math.floor(s / 16), out = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) out.push((br * 4 + r) * N + bc * 2 + c); return out; };
    // Incidents total exactly 5,000 GPU-hours: one rack-sized event and thirteen single servers.
    const incidents = [{ start: 300, dur: 24, servers: [40, 41, 42, 43, 56, 57, 58, 59, 72] }];
    const singles = [[18, 3], [40, 77], [30, 18], [48, 101], [24, 64], [36, 9], [14, 120], [42, 33], [32, 88], [28, 112], [44, 50], [26, 5], [27, 95]];
    const starts = [30, 75, 120, 170, 220, 260, 350, 400, 450, 500, 560, 610, 660];
    singles.forEach(([dur, s], i) => incidents.push({ start: starts[i], dur, servers: [s] }));
    const LOST = incidents.reduce((a, i) => a + i.dur * i.servers.length * 8, 0); // 5,000
    const HOURS = 730, FLEET = 1024, CAP = HOURS * FLEET, RATE = 2.35;
    const credit = .10 * CAP * RATE;

    const labels = [
      { text: 'Platform: responding', at: [-118, 300, 52], side: 'left' },
      { text: '1,024 GPUs', at: [N * (T + GAP), 0, 0], side: 'right' }
    ].map(l => Object.assign({ node: makeLabel(svg, l.text, l.side) }, l));
    const narrow = matchMedia('(max-width: 760px)');
    function layout() {
      svg.setAttribute('viewBox', narrow.matches ? '0 0 600 420' : '0 0 960 400');
      const xf = fit(inner, narrow.matches ? { x: 30, y: 80, w: 540, h: 300 } : { x: 160, y: 70, w: 640, h: 290 });
      labels.forEach(l => placeLabel(l.node, svg, xf, l.at));
    }
    layout();
    narrow.addEventListener('change', layout);

    const day = document.getElementById('sla-day'), bar = document.getElementById('sla-progress');
    const vGpu = document.getElementById('v-gpu'), vGpuNote = document.getElementById('v-gpu-note');
    const gpuCard = vGpu.closest('.verdict');
    let hour = 0, hold = 0;
    const state = new Map();
    function render(h) {
      let lost = 0;
      const status = new Map();
      incidents.forEach(inc => {
        const elapsed = clamp(h - inc.start, 0, inc.dur);
        lost += elapsed * inc.servers.length * 8;
        if (h >= inc.start) inc.servers.forEach(s => status.set(s, h < inc.start + inc.dur ? 'down' : status.get(s) === 'down' ? 'down' : 'scar'));
      });
      // Servers that already recovered stay tinted, so the month's losses accumulate on screen.
      for (let s = 0; s < 128; s++) {
        const now = status.get(s) || 'ok';
        if (state.get(s) !== now) { state.set(s, now); serverTiles(s).forEach(i => tiles[i].setAttribute('fill', now === 'down' ? COL.down : now === 'scar' ? scar : healthy)); }
      }
      const up = 1 - lost / CAP;
      vGpu.textContent = (Math.floor(up * 10000) / 100).toFixed(2) + '%';
      const breach = up < .999;
      gpuCard.classList.toggle('breach', breach);
      vGpuNote.textContent = breach
        ? `${fmt(Math.round(lost))} GPU-hours lost. Below 99.9%, so a 10% credit: ${money(credit)}.`
        : `${fmt(Math.round(lost))} GPU-hours lost so far. Promise still met.`;
      day.textContent = 'Day ' + Math.min(30, Math.floor(h / 24.33) + 1) + ' of 30';
      bar.style.width = (h / HOURS * 100) + '%';
    }
    lamp.paint(COL.compute);
    if (reduced) { hour = HOURS; hold = 99; }
    render(hour);
    register({
      node: fig,
      tick(dt, t) {
        lamp.top.setAttribute('fill', mix(light(COL.compute, .22), light(COL.compute, .6), .5 + .5 * Math.sin(t * 3)));
        if (hour >= HOURS) { hold += dt; if (hold > 3.5) { hold = 0; hour = 0; } render(HOURS); return; }
        hour = Math.min(HOURS, hour + dt * 36);
        render(hour);
      }
    });
    if (LOST !== 5000) console.warn('Contract figure: incidents total', LOST, 'GPU-hours');
  })();
})();
