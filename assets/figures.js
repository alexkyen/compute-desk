/* The figure kit: isometric drawing, pinned labels, and one animation loop shared by every
   live figure on the site. Pages load this, then their own figure code, which uses window.Figures. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = getComputedStyle(document.documentElement);
  const v = name => root.getPropertyValue(name).trim();
  // Colors come from site.css, so a diagram and its legend can never disagree.
  const COL = {
    compute: v('--compute'), memory: v('--memory'), network: v('--network'), money: v('--money'),
    down: v('--down'), idle: v('--idle'), floor: v('--floor'), rule: v('--rule'),
    ink: v('--ink'), ink2: v('--ink-2'), surface: v('--surface'),
    steel: '#d9d4c8', steelDark: '#b9b3a5', power: '#a9a396'
  };

  // ---------- Small helpers ----------
  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return '#' + A.map((c, i) => Math.round(c + (B[i] - c) * t).toString(16).padStart(2, '0')).join('');
  }
  const light = (c, t) => mix(c, '#ffffff', t);
  const dark = (c, t) => mix(c, '#000000', t);
  const fmt = n => n.toLocaleString('en-US');
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------- Isometric drawing ----------
  // x runs right-down, y runs left-down, z runs up.
  const C = Math.cos(Math.PI / 6);
  const iso = (x, y, z) => [(x - y) * C, (x + y) * 0.5 - z];
  const pts = list => list.map(p => iso(p[0], p[1], p[2]).map(n => n.toFixed(1)).join(',')).join(' ');

  // A box with its three visible faces shaded from one color. paint() recolors it in place.
  function box(parent, x, y, z, w, d, h, color, opts) {
    opts = opts || {};
    const g = el('g', {}, parent);
    const stroke = opts.stroke || dark(color, .28);
    const common = { stroke, 'stroke-width': .8, 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' };
    const right = el('polygon', Object.assign({ points: pts([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]]), fill: dark(color, .14) }, common), g);
    const left = el('polygon', Object.assign({ points: pts([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]]), fill: color }, common), g);
    const top = el('polygon', Object.assign({ points: pts([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]]), fill: light(color, .22) }, common), g);
    return { g, top, left, right, paint(c) { top.setAttribute('fill', light(c, .22)); left.setAttribute('fill', c); right.setAttribute('fill', dark(c, .14)); [top, left, right].forEach(p => p.setAttribute('stroke', dark(c, .28))); } };
  }

  function floorGrid(parent, x0, y0, x1, y1, step) {
    const g = el('g', { class: 'floor', stroke: COL.rule, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, parent);
    for (let x = x0; x <= x1; x += step) { const a = iso(x, y0, 0), b = iso(x, y1, 0); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'vector-effect': 'non-scaling-stroke' }, g); }
    for (let y = y0; y <= y1; y += step) { const a = iso(x0, y, 0), b = iso(x1, y, 0); el('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'vector-effect': 'non-scaling-stroke' }, g); }
    return g;
  }

  // A floor grid sized to the content above it, fading out toward the frame's edges.
  let maskCount = 0;
  function addFloor(svg, inner, b) {
    const ex = Math.max(b.width, b.height) * .6;
    const sx0 = b.x - ex, sx1 = b.x + b.width + ex, sy0 = b.y - ex * .4, sy1 = b.y + b.height + ex;
    const unproject = (sx, sy) => [(sx / C + 2 * sy) / 2, (2 * sy - sx / C) / 2];
    const corners = [unproject(sx0, sy0), unproject(sx1, sy0), unproject(sx0, sy1), unproject(sx1, sy1)];
    const step = 40, snap = (n, f) => f(n / step) * step;
    const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
    const floor = floorGrid(inner, snap(Math.min(...xs), Math.floor), snap(Math.min(...ys), Math.floor), snap(Math.max(...xs), Math.ceil), snap(Math.max(...ys), Math.ceil), step);
    inner.insertBefore(floor, inner.firstChild);
    const defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
    const id = 'floor-fade-' + (++maskCount);
    const grad = el('radialGradient', { id: id + '-g', gradientUnits: 'userSpaceOnUse', cx: b.x + b.width / 2, cy: b.y + b.height * .62, r: Math.max(b.width, b.height) * .62 }, defs);
    [[0, 1], [.45, 1], [1, 0]].forEach(([o, a]) => el('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, grad));
    const mask = el('mask', { id, maskUnits: 'userSpaceOnUse', x: sx0 - ex, y: sy0 - ex, width: sx1 - sx0 + 2 * ex, height: sy1 - sy0 + 2 * ex }, defs);
    el('rect', { x: sx0 - ex, y: sy0 - ex, width: sx1 - sx0 + 2 * ex, height: sy1 - sy0 + 2 * ex, fill: `url(#${id}-g)` }, mask);
    floor.setAttribute('mask', `url(#${id})`);
  }

  // Scale a group so its content (not its floor) fills a target rectangle of the viewBox.
  // The first call adds the floor. Returns the transform so labels can follow it.
  function fit(inner, target) {
    const svg = inner.ownerSVGElement;
    const floor = inner.querySelector(':scope > .floor');
    if (floor) floor.style.display = 'none';
    const b = inner.getBBox();
    if (floor) floor.style.display = ''; else addFloor(svg, inner, b);
    const s = Math.min(target.w / b.width, target.h / b.height);
    const tx = target.x + (target.w - b.width * s) / 2 - b.x * s;
    const ty = target.y + (target.h - b.height * s) / 2 - b.y * s;
    inner.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(4)})`);
    return { s, tx, ty };
  }

  // ---------- Pinned labels ----------
  // HTML labels pinned to points in an SVG, so they stay a readable size at any width.
  function makeLabel(svg, text, side) {
    // Pins live in a wrapper sized exactly to the SVG, so percentages match its viewBox.
    let host = svg.parentNode;
    if (!host.classList.contains('art')) { host = document.createElement('div'); host.className = 'art'; svg.parentNode.insertBefore(host, svg); host.appendChild(svg); }
    const node = document.createElement('div');
    node.className = 'pin';
    node.dataset.side = side || 'right';
    node.innerHTML = '<i></i><span></span>';
    node.querySelector('span').textContent = text;
    host.appendChild(node);
    return node;
  }
  // Place a pin at a world point (or, without one, re-check its side at the current width).
  function placeLabel(node, svg, xform, world) {
    if (world) {
      const p = iso(world[0], world[1], world[2]);
      const vb = svg.viewBox.baseVal;
      node.dataset.x = (xform.tx + p[0] * xform.s) / vb.width;
      node.style.left = (node.dataset.x * 100) + '%';
      node.style.top = ((xform.ty + p[1] * xform.s) / vb.height * 100) + '%';
    }
    // Flip a label to the other side of its pin when it would run off the figure.
    const hostW = node.parentNode.clientWidth, x = node.dataset.x * hostW;
    const w = node.querySelector('span').offsetWidth + 18;
    let left = node.dataset.side === 'left';
    if (w > 18) { if (!left && x + w > hostW - 6) left = true; else if (left && x - w < 6) left = false; }
    node.classList.toggle('pin-left', left);
  }
  let pinTimer;
  addEventListener('resize', () => { clearTimeout(pinTimer); pinTimer = setTimeout(() => document.querySelectorAll('.pin:not([hidden])').forEach(n => placeLabel(n)), 150); });

  // ---------- One animation loop ----------
  // Figures tick only while on screen and not paused. Each gets the same Pause/Play control in
  // its header and starts paused, on a finished frame, when the reader prefers reduced motion.
  const ICON = {
    pause: '<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="2.6" height="9" rx="1"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="1"/></svg>',
    play: '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4c0 .5.5.8.9.5l6.6-4.2c.4-.3.4-.8 0-1L3.9 1.3c-.4-.3-.9 0-.9.5z"/></svg>'
  };
  const figures = [];
  // fig: { node: the <figure>, tick(dt, t), onPause?(paused) }. Returns fig with setPaused().
  function register(fig) {
    fig.visible = false;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'live';
    fig.node.querySelector('.fig-head').appendChild(btn);
    fig.setPaused = p => {
      fig.paused = p;
      btn.innerHTML = p ? ICON.play + 'Play' : ICON.pause + 'Pause';
      btn.classList.toggle('is-paused', p);
      if (fig.onPause) fig.onPause(p);
    };
    btn.addEventListener('click', () => fig.setPaused(!fig.paused));
    fig.setPaused(reduced);
    figures.push(fig);
    new IntersectionObserver(entries => entries.forEach(e => { fig.visible = e.isIntersecting; }), { threshold: .25 }).observe(fig.node);
    return fig;
  }
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - last) / 1000; last = now;
    if (!document.hidden) figures.forEach(f => { if (f.visible && !f.paused) f.tick(dt, now / 1000); });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // A point along a polyline of world points, u from 0 to 1, in screen coordinates.
  function along(path, u) {
    const seg = path.length - 1, f = clamp(u, 0, 1) * seg, k = Math.min(seg - 1, Math.floor(f)), w = f - k;
    const a = path[k], b = path[k + 1];
    return iso(lerp(a[0], b[0], w), lerp(a[1], b[1], w), lerp(a[2], b[2], w));
  }

  // ---------- Shared figure: a stepped diagram ----------
  // Scenes zoom out one after another. Each step has a callout (.callout-step in the figure),
  // pinned labels, and particles that move along paths while its scene is showing.
  //   o.fig, o.svg            the <figure> (with .callout-step, .step-dots, .step-prev, .step-next) and its <svg>
  //   o.scenes                [build(g) -> { labels: [{ text, at, side, id }], particles: [{ from, to } or { path },
  //                            color, speed, r, ring, off }], ...anything the hooks need }]  (set off to hide one)
  //   o.wide, o.narrow        { viewBox, rect } framing for each layout
  //   o.start                 first step; o.advance: false starts with auto-advance off
  //   o.onShow(scene, i, paused, user)   o.onTick(scene, dt, t, sceneTime)
  // Returns { show(i), live }. Navigating by hand stops auto-advance; Play turns it back on.
  function stepper(o) {
    const { fig, svg } = o;
    const steps = [...fig.querySelectorAll('.callout-step')], callout = fig.querySelector('.callout');
    const scenes = o.scenes.map(build => {
      const outer = el('g', { class: 'scene' }, svg), inner = el('g', {}, outer);
      const api = build(inner) || {};
      const fx = el('g', {}, inner); // particles draw over the boxes
      const particles = (api.particles || []).map(p => {
        const start = iso(...(p.path ? p.path[0] : p.from));
        return Object.assign({ phase: Math.random(), node: el('circle', { cx: start[0], cy: start[1], opacity: 0, r: p.r || 3, fill: p.color, stroke: p.ring === false ? 'none' : COL.surface, 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, fx) }, p);
      });
      const labels = (api.labels || []).map(l => { const node = makeLabel(svg, l.text, l.side); node.hidden = true; return Object.assign({ node }, l); });
      return Object.assign({}, api, { outer, inner, particles, labels });
    });
    const narrow = matchMedia('(max-width: 760px)');
    function layout() {
      const frame = narrow.matches ? o.narrow : o.wide;
      svg.setAttribute('viewBox', frame.viewBox);
      scenes.forEach(s => { s.xf = fit(s.inner, frame.rect); s.labels.forEach(l => placeLabel(l.node, svg, s.xf, l.at)); });
    }
    layout();
    narrow.addEventListener('change', layout);

    const dots = steps.map((s, i) => {
      const b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', 'Step ' + (i + 1) + ': ' + s.querySelector('h3').textContent);
      fig.querySelector('.step-dots').appendChild(b);
      return b;
    });
    let step = 0, advancing = o.advance !== false, clock = 0, sceneTime = 0, live = null;
    const DWELL = o.dwell || 7.5;
    function show(i, user) {
      step = (i + steps.length) % steps.length;
      sceneTime = 0; clock = 0;
      steps.forEach((s, k) => { s.hidden = k !== step; });
      dots.forEach((d, k) => d.setAttribute('aria-current', String(k === step)));
      scenes.forEach((s, k) => {
        s.outer.classList.toggle('is-on', k === step); s.outer.classList.toggle('is-past', k < step);
        s.labels.forEach(l => { l.node.hidden = k !== step; if (k === step) placeLabel(l.node); });
      });
      if (o.onShow) o.onShow(scenes[step], step, !live || live.paused, !!user);
      if (user) callout.setAttribute('aria-live', 'polite');
    }
    const take = i => { advancing = false; show(i, true); };
    fig.querySelector('.step-prev').addEventListener('click', () => take(step - 1));
    fig.querySelector('.step-next').addEventListener('click', () => take(step + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => take(i)));

    let armed = false; // register() sets the initial pause state; only a later Play turns advancing on
    live = register({
      node: fig,
      onPause(p) { if (armed && !p) advancing = true; },
      tick(dt, t) {
        sceneTime += dt;
        if (advancing) { clock += dt; if (clock > DWELL) show(step + 1); }
        const scene = scenes[step];
        if (o.onTick) o.onTick(scene, dt, t, sceneTime);
        scenes.forEach((s, k) => s.particles.forEach(p => {
          if (k !== step || p.off) { p.node.setAttribute('opacity', 0); return; }
          p.phase = (p.phase + dt * (p.speed || .8)) % 1;
          const pos = along(p.path || [p.from, p.to], p.phase);
          p.node.setAttribute('cx', pos[0].toFixed(1)); p.node.setAttribute('cy', pos[1].toFixed(1));
          p.node.setAttribute('opacity', Math.sin(p.phase * Math.PI).toFixed(2));
        }));
      }
    });
    armed = true;
    show(o.start || 0);
    return { show: i => show(i, true), live, scenes, get step() { return step; } };
  }

  // ---------- Shared figure: a month of failures across a fleet ----------
  // 1,024 tiles stand for the fleet; servers (blocks of eight tiles) fail and recover over a
  // 730-hour month while a separate platform box keeps answering. One fixed failure pattern is
  // stretched or shrunk so the month's losses come to whatever the page's scenario says.
  //   o.svg, o.fig           the <svg> and its <figure>
  //   o.day, o.bar           clock text and progress elements
  //   o.scenario()           -> { nodeHours, platformHours, fleet }   (read every frame)
  //   o.onHour(h, lost)      lost = { node, platform } GPU-hours so far; for the page's readouts
  // Returns the registered figure, plus redraw() for when the scenario changes while paused.
  const MONTH = 730;
  function outageMonth(o) {
    const svg = o.svg, inner = el('g', {}, svg);
    const N = 32, T = 11, GAP = 2.5;
    const shade = { ok: light(COL.compute, .35), scar: light(COL.down, .62), down: COL.down, dim: COL.idle };
    box(inner, -150, 300, 0, 64, 64, 46, COL.steel);
    const lamp = box(inner, -131, 319, 46, 26, 26, 6, COL.compute);
    const tiles = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = c * (T + GAP), y = r * (T + GAP);
      tiles.push(el('polygon', { points: pts([[x, y, 0], [x + T, y, 0], [x + T, y + T, 0], [x, y + T, 0]]), fill: shade.ok }, inner));
    }
    const serverTiles = s => { const bc = s % 16, br = Math.floor(s / 16), out = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) out.push((br * 4 + r) * N + bc * 2 + c); return out; };
    // The pattern: one rack-sized event and thirteen single servers, 5,000 GPU-hours in all.
    const PATTERN = [{ start: 300, dur: 24, servers: [40, 41, 42, 43, 56, 57, 58, 59, 72] }];
    [[30, 18, 3], [75, 40, 77], [120, 30, 18], [170, 48, 101], [220, 24, 64], [260, 36, 9], [350, 14, 120], [400, 42, 33], [450, 32, 88], [500, 28, 112], [560, 44, 50], [610, 26, 5], [660, 27, 95]]
      .forEach(([start, dur, s]) => PATTERN.push({ start, dur, servers: [s] }));
    const PATTERN_HOURS = 5000, PLATFORM_START = 470;

    const pinPlatform = makeLabel(svg, 'Platform: responding', 'left');
    const pinFleet = makeLabel(svg, '1,024 GPUs', 'right');
    const narrow = matchMedia('(max-width: 760px)');
    function layout() {
      svg.setAttribute('viewBox', narrow.matches ? '0 0 600 420' : '0 0 960 400');
      const xf = fit(inner, narrow.matches ? { x: 30, y: 80, w: 540, h: 300 } : { x: 160, y: 70, w: 640, h: 290 });
      placeLabel(pinPlatform, svg, xf, [-118, 300, 52]);
      placeLabel(pinFleet, svg, xf, [N * (T + GAP), 0, 0]);
    }
    layout();
    narrow.addEventListener('change', layout);

    let hour = reduced ? MONTH : 0, hold = reduced ? 99 : 0, platformWasDown = null;
    const painted = new Map();
    function render(h) {
      const s = o.scenario();
      const k = s.nodeHours / PATTERN_HOURS;
      // Scaled incidents, clipped to the month; the counter is normalized so the month ends on s.nodeHours exactly.
      let drawn = 0, total = 0;
      const status = new Map();
      PATTERN.forEach(inc => {
        const dur = Math.min(inc.dur * k, MONTH - inc.start), width = inc.servers.length * 8;
        total += dur * width;
        drawn += clamp(h - inc.start, 0, dur) * width;
        if (dur > 0 && h >= inc.start) inc.servers.forEach(sv => status.set(sv, h < inc.start + dur ? 'down' : status.get(sv) === 'down' ? 'down' : 'scar'));
      });
      const platformDown = s.platformHours > 0 && h >= PLATFORM_START && h < PLATFORM_START + s.platformHours;
      for (let sv = 0; sv < 128; sv++) {
        let now = status.get(sv) || 'ok';
        if (platformDown && now !== 'down') now = 'dim';
        if (painted.get(sv) !== now) { painted.set(sv, now); serverTiles(sv).forEach(i => tiles[i].setAttribute('fill', shade[now])); }
      }
      if (platformDown !== platformWasDown) {
        platformWasDown = platformDown;
        lamp.paint(platformDown ? COL.down : COL.compute);
        pinPlatform.querySelector('span').textContent = platformDown ? 'Platform: not responding' : 'Platform: responding';
        pinPlatform.classList.toggle('pin-down', platformDown);
        placeLabel(pinPlatform);
      }
      const fleetText = fmt(s.fleet) + ' GPUs';
      if (pinFleet.querySelector('span').textContent !== fleetText) { pinFleet.querySelector('span').textContent = fleetText; placeLabel(pinFleet); }
      o.day.textContent = 'Day ' + Math.min(30, Math.floor(h / 24.33) + 1) + ' of 30';
      o.bar.style.width = (h / MONTH * 100) + '%';
      o.onHour(h, { node: total ? drawn / total * s.nodeHours : 0, platform: clamp(h - PLATFORM_START, 0, s.platformHours) * s.fleet });
    }
    render(hour);
    const live = register({
      node: o.fig,
      tick(dt, t) {
        if (!platformWasDown) lamp.top.setAttribute('fill', mix(light(COL.compute, .22), light(COL.compute, .6), .5 + .5 * Math.sin(t * 3)));
        if (hour >= MONTH) { hold += dt; if (hold > 3.5) { hold = 0; hour = 0; } render(MONTH); return; }
        hour = Math.min(MONTH, hour + dt * 36);
        render(hour);
      }
    });
    live.redraw = () => render(hour);
    return live;
  }

  // ---------- Section rail ----------
  // Appears once the intro scrolls away and marks the section being read.
  (function rail() {
    const nav = document.querySelector('.rail');
    const intro = document.querySelector('.intro');
    if (!nav || !intro) return;
    const links = [...nav.querySelectorAll('a')];
    const sections = links.map(a => { const h = a.getAttribute('href'); return h.startsWith('#') ? document.querySelector(h) : null; });
    new IntersectionObserver(es => es.forEach(e => nav.classList.toggle('is-visible', !e.isIntersecting)), { threshold: 0 }).observe(intro);
    function update() {
      let current = -1;
      sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .4) current = i; });
      links.forEach((a, i) => a.setAttribute('aria-current', i === current ? 'true' : 'false'));
    }
    addEventListener('scroll', update, { passive: true });
    update();
  })();

  window.Figures = { NS, COL, reduced, el, mix, light, dark, fmt, money, clamp, lerp, iso, pts, box, fit, along, makeLabel, placeLabel, register, stepper, outageMonth, MONTH };
})();
