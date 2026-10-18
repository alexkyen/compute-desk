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

  window.Figures = { NS, COL, reduced, el, mix, light, dark, fmt, money, clamp, lerp, iso, pts, box, fit, makeLabel, placeLabel, register };
})();
