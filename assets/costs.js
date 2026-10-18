/* What you actually pay. Two models on one page: the price board (Figure 1) and the
   commitment model (Figure 2). Their calculations, URL parameters, and downloads match the
   original price atlas and capacity planning pages, so old links reopen the same views. */
(function () {
  'use strict';
  const { COL, reduced, el, clamp, lerp } = window.Figures;
  const desk = window.ComputeDesk;
  const $ = id => document.getElementById(id);
  const q = desk.params();
  const save = values => desk.setParams(values);

  // ======================= Figure 1: the price board =======================
  const { SOURCES, PROV, SKUS, DOS, CH, M, PROVREF, verified } = window.PriceData;
  const COLS = ['l40s', 'a100', 'h100', 'h200', 'b200', 'b300', 'gb200', 'gb300']; // oldest to newest
  const SHORT = { l40s: 'L40S / RTX', a100: 'A100', h100: 'H100', h200: 'H200', b200: 'B200', b300: 'B300', gb200: 'GB200 NVL72', gb300: 'GB300 NVL72' };
  const SKUMAP = {}; SKUS.forEach(s => { SKUMAP[s.id] = s; });
  const checkedOn = new Date(verified + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const PMAP = {}; PROV.forEach((p, i) => { PMAP[p.id] = p; p.i = i; });
  const CHIDS = ['od', 'co', 'sp'];
  const CHLABEL = {}; CH.forEach(c => { CHLABEL[c.id] = c.l; });
  const CSV_CHANNEL = { od: 'on-demand', co: 'committed / reserved', sp: 'spot / interruptible' };
  const CH_PHRASE = { od: 'pay-as-you-go', co: 'commit-ahead', sp: 'interruptible' };
  const BAND = { hyp: 'Hyperscaler', neo: 'Neocloud', mkt: 'Marketplace', idx: 'Price index' };
  const isSeller = p => p.g !== 'idx'; // the index row is a reference line, not a seller

  const parseRange = v => { const m = (v || '').replace(/~/g, '').match(/(\d+(?:\.\d+)?)\s*–\s*(\d+(?:\.\d+)?)/); return m ? { lo: +m[1], hi: +m[2] } : null; };
  // One log scale for every accelerator, so switching keeps the axis still and moves the marks.
  let MINV = Infinity, MAXV = 0;
  CHIDS.forEach(ch => COLS.forEach(sku => { const row = M[ch][sku] || {}; PROV.forEach(pr => {
    const c = row[pr.id]; if (!c || c.s !== 'p' || !isFinite(c.n)) return;
    const r = parseRange(c.v), lo = r ? r.lo : c.n, hi = r ? r.hi : c.n;
    MINV = Math.min(MINV, lo); MAXV = Math.max(MAXV, hi);
  }); }));
  MINV /= 1.1; MAXV *= 1.1;
  const xp = v => Math.log(Math.max(v, MINV) / MINV) / Math.log(MAXV / MINV) * 100;
  const TICKS = [0.25, 0.5, 1, 2, 4, 8, 16, 32].filter(v => v >= MINV && v <= MAXV);

  // State, read from the address.
  let skuI = Math.max(0, COLS.indexOf(q.get('sku') || 'h100'));
  let chSel = ['od', 'co', 'sp', 'all'].includes(q.get('channel')) ? q.get('channel') : 'od';
  let sortMode = q.get('sort') === 'band' ? 'band' : 'price';
  const shortlist = new Set((q.get('compare') || '').split(',').filter(id => PMAP[id]));
  const syncBoard = () => save({ sku: COLS[skuI], channel: chSel, sort: sortMode, evidence: null, compare: [...shortlist].join(',') || null });

  const sourceFor = c => SOURCES.find(s => s.id === c.src);
  const activeChans = () => chSel === 'all' ? CHIDS : [chSel];
  const cellFor = (ch, sku, prov) => (M[ch][sku] || {})[prov];
  function laneState(prov) {
    const sku = COLS[skuI], marks = [], gated = [];
    activeChans().forEach(ch => {
      const c = cellFor(ch, sku, prov);
      if (!c || c.s === 'n') return;
      if (c.s === 'p' && isFinite(c.n)) { const r = parseRange(c.v); marks.push({ ch, lo: r ? r.lo : c.n, hi: r ? r.hi : c.n, cell: c }); }
      else if (c.s === 'q') gated.push({ ch, v: c.v || 'quote', t: c.t || 'sold, price gated', src: c.src });
    });
    return { marks, gated: !marks.length && gated.length ? gated : null, empty: !marks.length && !gated.length };
  }
  function stripStatus(sku, prov) { // across all rental types, regardless of filters
    let p = false, g = false;
    CHIDS.forEach(ch => { const c = cellFor(ch, sku, prov); if (c) { if (c.s === 'p') p = true; else if (c.s === 'q') g = true; } });
    return p ? 'p' : g ? 'g' : 'n';
  }
  const lowOf = c => { const r = parseRange(c.v); return r ? r.lo : c.n; }; // a published range counts from its low end
  function bestVal(prov) { // on demand if priced, else the lowest visible price
    const sku = COLS[skuI], chans = activeChans();
    if (chans.includes('od')) { const c = cellFor('od', sku, prov); if (c && c.s === 'p') return lowOf(c); }
    let best = null;
    chans.forEach(ch => { if (ch === 'od') return; const c = cellFor(ch, sku, prov); if (c && c.s === 'p' && (best === null || lowOf(c) < best)) best = lowOf(c); });
    return best;
  }
  function orderIds() {
    const key = id => { const v = bestVal(id); return v === null ? Infinity : v; };
    const ids = PROV.map(p => p.id);
    if (sortMode === 'price') return ids.sort((a, b) => key(a) - key(b) || PMAP[a].i - PMAP[b].i);
    const G = ['hyp', 'neo', 'mkt', 'idx'];
    return ids.sort((a, b) => G.indexOf(PMAP[a].g) - G.indexOf(PMAP[b].g) || key(a) - key(b) || PMAP[a].i - PMAP[b].i);
  }

  // Build the controls, axis, and one row per seller.
  const skuSeg = $('sku-seg'), chSeg = $('channel-seg'), sortSeg = $('sort-seg');
  COLS.forEach((sku, i) => { const b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.textContent = SHORT[sku]; skuSeg.appendChild(b); });
  [{ id: 'all', l: 'All types' }].concat(CHIDS.map(id => ({ id, l: CHLABEL[id] }))).forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.dataset.c = c.id; b.textContent = c.l; chSeg.appendChild(b); });
  $('axis').innerHTML = TICKS.map(v => `<span style="left:${xp(v).toFixed(2)}%">$${v}</span>`).join('');
  $('strip-head').textContent = 'All 8 GPUs';
  const list = $('sellers'), ROW = {};
  PROV.forEach(p => {
    const row = document.createElement('div');
    row.className = 'seller'; row.dataset.p = p.id;
    row.innerHTML = `<button type="button" class="row-head" aria-expanded="false"><span class="s-name"></span><span class="lane">${TICKS.map(v => `<i class="gl" style="left:${xp(v).toFixed(2)}%"></i>`).join('')}${CHIDS.map(ch => `<span class="mark ${ch}" data-ch="${ch}" hidden><i></i><i></i></span>`).join('')}<span class="lane-note" hidden></span></span><span class="s-low"></span><span class="strip">${COLS.map(sk => `<span class="cell" data-sku="${sk}"></span>`).join('')}</span></button><div class="dossier"></div>`;
    row.querySelector('.s-name').innerHTML = '';
    row.querySelector('.s-name').append(p.name, Object.assign(document.createElement('small'), { textContent: BAND[p.g] }));
    row.querySelectorAll('.cell').forEach(cell => {
      const st = stripStatus(cell.dataset.sku, p.id);
      if (st === 'p') cell.classList.add('on'); else if (st === 'g') cell.textContent = '×';
      cell.title = `${SHORT[cell.dataset.sku]}: ${st === 'p' ? 'priced' : st === 'g' ? 'sold, price on request' : 'not listed'}`;
    });
    row.querySelector('.row-head').addEventListener('click', () => toggleOpen(p.id));
    list.appendChild(row); ROW[p.id] = row;
  });

  let openId = null;
  function toggleOpen(id) {
    if (openId && openId !== id) { ROW[openId].classList.remove('open'); ROW[openId].querySelector('.row-head').setAttribute('aria-expanded', 'false'); }
    openId = openId === id ? null : id;
    const row = ROW[id];
    if (openId) renderDossier(openId);
    row.classList.toggle('open', openId === id);
    row.querySelector('.row-head').setAttribute('aria-expanded', String(openId === id));
  }
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  function sourceText(c) {
    const s = c.src ? sourceFor(c) : null;
    if (!s) return '';
    return s.url ? ` · <a href="${esc(s.url)}" rel="noopener">source ${esc(s.id)}</a>` : ` · source ${esc(s.id)}`;
  }
  // A seller's file: every price for this accelerator in words, how they sell, and what to ask.
  function renderDossier(id) {
    const p = PMAP[id], d = DOS[id], sku = COLS[skuI];
    const badges = (d.strip[0] !== p.arch ? [p.arch] : []).concat(d.strip);
    const prices = CHIDS.map(ch => {
      const c = cellFor(ch, sku, id);
      const value = !c || c.s === 'n' ? 'Not listed' : c.s === 'q' ? 'On request' : '$' + c.v;
      return `<li><span>${CHLABEL[ch]}</span><b>${esc(value)}</b><small>${c && c.t ? esc(c.t) : ''}${c ? sourceText(c) : ''}</small></li>`;
    }).join('');
    const refs = (PROVREF[id] || []).map(([label, url]) => `<a href="${esc(url)}" rel="noopener">${esc(label)}</a>`).join('');
    const on = shortlist.has(id);
    ROW[id].querySelector('.dossier').innerHTML =
      `<div class="badges">${badges.map(b => `<span>${esc(b)}</span>`).join('')}</div>` +
      `<ul class="prices" aria-label="${esc(p.name)} prices for ${esc(SHORT[sku])}">${prices}</ul>` +
      `<p><strong>${isSeller(p) ? 'How they sell.' : 'How it works.'}</strong> ${esc(d.buy)}</p>` +
      `<p class="ask"><strong>${isSeller(p) ? 'Ask them:' : 'Ask a seller:'}</strong> ${esc(d.ask)}</p>` +
      (refs ? `<p class="links">${refs}</p>` : '') +
      `<button type="button" class="toggle" data-shortlist="${id}" aria-pressed="${on}">${on ? 'In your comparison' : 'Add to comparison'}</button>`;
  }
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-shortlist]'); if (!b) return;
    const id = b.dataset.shortlist;
    shortlist.has(id) ? shortlist.delete(id) : shortlist.add(id);
    renderDossier(id); renderCompare(); syncBoard();
  });

  let ready = false;
  function reorder() {
    const ids = orderIds();
    if (ids.every((id, i) => list.children[i] === ROW[id])) return;
    const before = ready && !reduced ? new Map(ids.map(id => [id, ROW[id].getBoundingClientRect().top])) : null;
    ids.forEach(id => list.appendChild(ROW[id]));
    if (!before) return;
    ids.forEach(id => { const dy = before.get(id) - ROW[id].getBoundingClientRect().top; if (dy) { ROW[id].style.transition = 'none'; ROW[id].style.transform = `translateY(${dy}px)`; } });
    void list.offsetHeight;
    ids.forEach(id => { ROW[id].style.transition = ''; ROW[id].style.transform = ''; });
  }
  function renderBoard() {
    const sku = COLS[skuI];
    skuSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.i === skuI)));
    chSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.c === chSel)));
    sortSeg.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sort === sortMode)));
    let all = [], count = 0;
    PROV.forEach(p => {
      const row = ROW[p.id], ls = laneState(p.id);
      all = all.concat(ls.marks); if (ls.marks.length && isSeller(p)) count++;
      row.classList.toggle('empty', !ls.marks.length);
      row.querySelectorAll('.mark').forEach(mk => {
        const m = ls.marks.find(x => x.ch === mk.dataset.ch);
        if (!m) { mk.hidden = true; return; }
        const lo = xp(m.lo), hi = xp(m.hi);
        mk.hidden = false;
        mk.classList.toggle('range', m.hi > m.lo);
        mk.style.left = `calc(${lo}% - 6px)`;
        mk.style.width = m.hi > m.lo ? `calc(${hi - lo}% + 12px)` : '12px';
      });
      const note = row.querySelector('.lane-note');
      note.hidden = !!ls.marks.length;
      note.textContent = ls.gated ? 'Price on request' : 'Not listed';
      const best = bestVal(p.id);
      row.querySelector('.s-low').textContent = best === null ? '—' : '$' + best.toFixed(2);
      row.querySelectorAll('.cell').forEach(cell => cell.classList.toggle('here', cell.dataset.sku === sku));
    });
    if (all.length) {
      const lo = Math.min(...all.map(m => m.lo)), hi = Math.max(...all.map(m => m.hi));
      $('r-range').textContent = '$' + lo.toFixed(2) + (hi !== lo ? ' – $' + hi.toFixed(2) : '');
      $('r-spread').textContent = (hi / lo).toFixed(1) + '×';
    } else { $('r-range').textContent = 'On request'; $('r-spread').textContent = '—'; }
    $('r-count').textContent = count + ' of ' + PROV.filter(isSeller).length;
    $('board-status').textContent = count
      ? (chSel === 'all' ? 'Rental types are mixed in this view. Pick one before comparing sellers.' : `These are ${CH_PHRASE[chSel]} prices for ${SHORT[sku]}. Configurations, regions, and terms can still differ, so open a seller before comparing.`)
      : 'No published price matches this view. Try another rental type.';
    if (openId) renderDossier(openId);
    reorder();
    renderCompare();
    syncBoard();
  }
  skuSeg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { skuI = +b.dataset.i; renderBoard(); } });
  chSeg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { chSel = b.dataset.c; renderBoard(); } });
  sortSeg.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { sortMode = b.dataset.sort; renderBoard(); } });

  // Hover or focus detail for one mark.
  const tip = $('tip');
  list.addEventListener('mousemove', e => {
    const mk = e.target.closest('.mark');
    if (!mk || mk.hidden) { tip.hidden = true; return; }
    const p = PMAP[mk.closest('.seller').dataset.p], c = cellFor(mk.dataset.ch, COLS[skuI], p.id), s = c.src ? sourceFor(c) : null;
    tip.innerHTML = `<strong>${esc(p.name)} · ${esc(SHORT[COLS[skuI]])}</strong>${esc(CHLABEL[mk.dataset.ch])}: $${esc(c.v)} per GPU-hour<br>${esc(c.t || '')}${s ? '<br>' + esc(s.label) : ''}`;
    tip.hidden = false;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, e.clientX + 14)) + 'px';
    tip.style.top = Math.max(8, e.clientY + h + 24 > innerHeight ? e.clientY - h - 12 : e.clientY + 14) + 'px';
  });
  list.addEventListener('mouseleave', () => { tip.hidden = true; });

  // Your comparison: the shortlisted sellers' visible prices, and the CSV the atlas exported.
  function renderCompare() {
    const ids = [...shortlist], panel = $('comparePanel');
    panel.hidden = !ids.length;
    if (!ids.length) return;
    const sku = COLS[skuI];
    $('compare-table').innerHTML = `<table><thead><tr><th>Seller</th><th>Accelerator</th><th>Prices in this view</th><th>Checked</th></tr></thead><tbody>${ids.map(id => {
      const cells = activeChans().map(ch => { const c = cellFor(ch, sku, id); return c && c.s === 'p' ? `${CHLABEL[ch]}: $${esc(c.v)}` : null; }).filter(Boolean);
      return `<tr><th>${esc(PMAP[id].name)}</th><td>${esc(SHORT[sku])}</td><td>${cells.join('<br>') || 'No visible price'}</td><td>${esc(checkedOn)}</td></tr>`;
    }).join('')}</tbody></table>`;
  }
  $('clear-compare').addEventListener('click', () => { shortlist.clear(); if (openId) renderDossier(openId); renderCompare(); syncBoard(); });
  $('export-compare').addEventListener('click', () => {
    const quote = v => '"' + String(v).replace(/"/g, '""') + '"';
    const rows = ['seller,accelerator,channel,price,source,source_url,verified_date,snapshot_status'];
    [...shortlist].forEach(id => activeChans().forEach(ch => {
      const c = cellFor(ch, COLS[skuI], id);
      if (c && c.s === 'p') { const s = sourceFor(c); rows.push([PMAP[id].name, SKUMAP[COLS[skuI]].l, CSV_CHANNEL[ch], c.v, c.src || '', s && s.url || '', verified, 'list price on the checked date; confirm with the seller'].map(quote).join(',')); }
    }));
    rows.push('', quote('Scenario') + ',' + quote(location.href));
    desk.download('compute-desk-seller-comparison.csv', rows.join('\n'), 'text/csv;charset=utf-8');
  });

  // Sources, listed in full.
  $('source-list').innerHTML = SOURCES.map(s => `<li>${esc(s.id)}: ${esc(s.label)}${s.note ? ' (' + esc(s.note) + ')' : ''}.${s.url ? ` <a href="${esc(s.url)}" rel="noopener">${esc(s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>` : ''}</li>`).join('') +
    '<li>Commitment model: newsvendor critical ratio, with load-duration framing after Modal, “How to price serverless” (2026). <a href="https://modal.com/blog/how-to-price-serverless" rel="noopener">modal.com/blog/how-to-price-serverless</a></li>';

  // ======================= Figure 2: the commitment model =======================
  // Synthetic demand is a load-duration curve, D(h) = avg × ρ × (1 − h)^(ρ − 1), for h from the
  // busiest (0) to the quietest (1) share of hours. Imported demand replaces it with observations.
  let d = 6, r = 2, rho = 4, K = 100, AVG = 100, N = 180, imported = null;
  if (q.has('avg')) AVG = Math.max(1, +q.get('avg') || 100);
  if (q.has('od')) d = Math.max(.01, +q.get('od') || 6);
  if (q.has('res')) r = Math.max(.01, +q.get('res') || 2);
  if (q.has('rho')) rho = Math.max(1.3, +q.get('rho') || 4);
  const savedK = q.has('k');
  if (savedK) K = Math.max(0, Number(q.get('k')) || 0);
  const peak = () => AVG * rho;
  const D = h => imported ? imported[clamp(Math.floor(h * imported.length), 0, imported.length - 1)] : AVG * rho * Math.pow(1 - h, rho - 1);
  function hOf(k) { // share of hours with demand above k
    if (!imported) { const p = peak(); if (k >= p) return 0; if (k <= 0) return 1; return 1 - Math.pow(k / p, 1 / (rho - 1)); }
    let above = 0; for (const v of imported) if (v > k) above++; return above / imported.length;
  }
  const capacityMax = () => Math.ceil(imported ? imported[0] : peak());
  const capacityCost = k => { const h = hOf(k); return r * k + d * Math.max(0, AVG - (k * h + AVG * Math.pow(1 - h, rho))); };
  function Kopt() {
    if (imported) return ComputeDeskDemand.bestCommitment(imported, r, d);
    if (r >= d) return 0;
    const ideal = D(Math.min(.999, r / d)), lo = Math.floor(ideal), hi = Math.ceil(ideal);
    return capacityCost(hi) < capacityCost(lo) ? hi : lo;
  }
  const kInput = $('k');
  function normalizeCapacity() { K = ComputeDeskDemand.clampCommitment(K, capacityMax()); kInput.max = capacityMax(); kInput.value = K; }
  function model() {
    const hK = hOf(K);
    let S = 0;
    if (imported) { for (const v of imported) S += Math.min(v, K); S /= imported.length; }
    else S = K * hK + AVG * Math.pow(1 - hK, rho);
    const OD = Math.max(0, AVG - S), cost = r * K + d * OD;
    return { S, OD, cost, blended: cost / AVG, util: K > 0 ? S / K : 0, sav: 1 - cost / (d * AVG), ko: Kopt(), hK };
  }
  const money2 = v => '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // The chart is redrawn at the figure's real width so its labels stay at text size.
  const svg = $('commit-svg');
  let W = 960, H = 320, m = { l: 52, r: 16, t: 16, b: 34 }, x, y, Dmax;
  function draw(o) {
    W = Math.max(320, Math.round(svg.parentNode.clientWidth));
    H = W < 560 ? 260 : 320;
    m = W < 560 ? { l: 40, r: 10, t: 14, b: 30 } : { l: 52, r: 16, t: 16, b: 34 };
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.textContent = '';
    Dmax = capacityMax() * 1.05;
    x = h => m.l + h * (W - m.l - m.r);
    y = v => H - m.b - v / Dmax * (H - m.t - m.b);
    const font = { 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 13 };
    const p = imported ? imported[0] : peak();
    const axis = el('g', Object.assign({ fill: COL.ink2 }, font), svg);
    [0, p / 2, p].forEach(v => {
      el('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: COL.rule }, axis);
      el('text', { x: m.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, axis).textContent = Math.round(v);
    });
    el('text', { x: m.l, y: H - 8 }, axis).textContent = 'Busiest hours';
    el('text', { x: W - m.r, y: H - 8, 'text-anchor': 'end' }, axis).textContent = 'Quietest hours';
    const steps = [], n = N;
    for (let i = 0; i <= n; i++) steps.push(i / n);
    const curve = steps.map(h => [x(h), y(D(h))]);
    const used = 'M' + x(0) + ' ' + y(0) + steps.map(h => 'L' + x(h).toFixed(1) + ' ' + y(Math.min(D(h), K)).toFixed(1)).join('') + 'L' + x(1) + ' ' + y(0) + 'Z';
    const over = 'M' + x(0) + ' ' + y(K) + steps.map(h => 'L' + x(h).toFixed(1) + ' ' + y(Math.max(D(h), K)).toFixed(1)).join('') + 'L' + x(1) + ' ' + y(K) + 'Z';
    el('path', { d: `M${x(0)} ${y(K)}L${x(1)} ${y(K)}L${x(1)} ${y(0)}L${x(0)} ${y(0)}Z`, fill: COL.floor }, svg); // reserved, idle
    el('path', { d: used, fill: COL.compute, 'fill-opacity': .85 }, svg);
    el('path', { d: over, fill: COL.money, 'fill-opacity': .85 }, svg);
    el('path', { d: 'M' + curve.map(c => c[0].toFixed(1) + ' ' + c[1].toFixed(1)).join('L'), fill: 'none', stroke: COL.ink, 'stroke-width': 1.25, 'stroke-opacity': .6 }, svg);
    // The lowest-cost commitment, then the current one.
    const by = y(o.ko);
    el('line', { x1: m.l, x2: W - m.r, y1: by, y2: by, stroke: COL.ink, 'stroke-dasharray': '3 4', 'stroke-opacity': .6 }, svg);
    pill(`Lowest cost: ${Math.round(o.ko)} reserved`, W - m.r - 8, by, 'end', false);
    el('line', { x1: m.l, x2: W - m.r, y1: y(K), y2: y(K), stroke: COL.ink, 'stroke-width': 2 }, svg);
    pill(`${Math.round(K)} reserved`, m.l + 8, y(K), 'start', true);
    function pill(text, px, py, anchor, solid) {
      const g = el('g', {}, svg), rect = el('rect', { rx: 6, height: 24, fill: solid ? COL.ink : COL.surface, stroke: solid ? 'none' : COL.ink, 'stroke-dasharray': solid ? '' : '3 3' }, g);
      const t = el('text', Object.assign({ x: 10, y: 16.5, 'font-weight': solid ? 600 : 500, fill: solid ? '#fff' : COL.ink }, font), g);
      t.textContent = text;
      const w = t.getComputedTextLength() + 20;
      rect.setAttribute('width', w);
      g.setAttribute('transform', `translate(${anchor === 'end' ? px - w : px} ${clamp(py - 12, m.t, H - m.b - 24)})`);
    }
  }

  function render(writeUrl) {
    const o = model();
    draw(o);
    kInput.value = K; $('k-out').textContent = Math.round(K);
    $('c-blended').textContent = money2(o.blended);
    const savPct = Math.round(o.sav * 100);
    $('c-saving').textContent = (savPct > 0 ? '−' + savPct : savPct < 0 ? '+' + Math.abs(savPct) : '0') + '%';
    $('c-util').textContent = Math.round(o.util * 100) + '%';
    $('c-od').textContent = Math.round(o.OD / AVG * 100) + '%';
    $('c-working').innerHTML = `Reserved <b>${money2(r * K)}</b> + on demand <b>${money2(d * o.OD)}</b> = <b>${money2(o.cost)}</b> per modeled hour, for ${AVG.toLocaleString('en-US', { maximumFractionDigits: 1 })} GPUs of average demand.`;
    let msg;
    if (r >= d) msg = K === 0 ? 'No commitment is needed at these prices: the reserved rate is at least the on-demand rate.' : 'Renting is cheaper here: the reserved rate is at least the on-demand rate.';
    else if (K === o.ko) msg = 'This is the lowest-cost whole-GPU commitment for this demand and these prices.';
    else if (K < o.ko) msg = 'Reserving more lowers the bill at these prices. The extra GPUs would be busy often enough to earn their discount.';
    else msg = 'Reserving less lowers the bill. The top reserved GPUs sit idle too often to earn their discount.';
    $('commit-status').textContent = msg;
    const out = { res: money2(r), od: money2(d), breakeven: (r / d * 100).toFixed(1) + '%', hundred: money2(r * 100), fifty: money2(d * 50) };
    document.querySelectorAll('[data-out]').forEach(n => { n.textContent = out[n.dataset.out]; });
    $('rule').textContent = `Reserve a GPU only if it will be busy at least ${money2(r)} ÷ ${money2(d)} = ${Math.round(r / d * 100)}% of hours.`;
    $('demand-basis').textContent = imported
      ? `${imported.length.toLocaleString('en-US')} imported hours, ${AVG.toFixed(1)} GPUs on average`
      : `Illustrative: ${Math.round(AVG)} GPUs on average, ${Math.round(peak())} at the peak`;
    $('rho-out').textContent = imported ? 'from file' : rho.toFixed(1) + '×';
    if (writeUrl === false || introPending) return;
    if (!imported) save({ avg: Math.round(AVG), od: d.toFixed(2), res: r.toFixed(2), rho: rho.toFixed(1), k: Math.round(K), mode: null });
    else save({ avg: null, rho: null, k: null, mode: 'imported', od: d.toFixed(2), res: r.toFixed(2) });
  }

  // Controls
  kInput.addEventListener('input', () => { stopIntro(); K = +kInput.value; render(); });
  $('snap').addEventListener('click', () => { stopIntro(); K = Math.round(Kopt()); render(); });
  let dragging = false;
  function setFromPointer(e) {
    const box = svg.getBoundingClientRect(), vy = (e.clientY - box.top) / box.height * H;
    K = ComputeDeskDemand.clampCommitment((H - m.b - vy) / (H - m.t - m.b) * Dmax, capacityMax());
    render();
  }
  svg.addEventListener('pointerdown', e => { stopIntro(); dragging = true; svg.setPointerCapture(e.pointerId); setFromPointer(e); });
  svg.addEventListener('pointermove', e => { if (dragging) setFromPointer(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });
  const rateInput = (id, set) => $(id).addEventListener('input', function () { if (this.value === '' || !this.validity.valid) return; set(+this.value); render(); });
  rateInput('res', v => { r = Math.max(.01, v); });
  rateInput('od', v => { d = Math.max(.01, v); });
  $('avg').addEventListener('input', function () { if (this.value === '' || !this.validity.valid || imported) return; AVG = Math.max(1, +this.value || 100); normalizeCapacity(); render(); });
  $('rho').addEventListener('input', function () { if (imported) return; rho = +this.value; normalizeCapacity(); render(); });

  // Imported demand: parsed in the browser, never sent anywhere or put in the address.
  const share = $('share');
  $('csv').addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let vals;
      try { vals = ComputeDeskDemand.parse(reader.result); }
      catch (error) { $('csv-status').textContent = error.message; desk.announce(error.message); return; }
      stopIntro();
      imported = vals.sort((a, b) => b - a); N = Math.min(360, Math.max(60, imported.length));
      AVG = imported.reduce((a, b) => a + b, 0) / imported.length; rho = imported[0] / AVG;
      K = Math.round(Kopt());
      $('avg').value = AVG.toFixed(1); $('avg').disabled = true; $('rho').disabled = true;
      kInput.max = Math.ceil(imported[0]);
      $('csv-status').textContent = `${file.name}: ${imported.length.toLocaleString('en-US')} observations, ${AVG.toFixed(1)} GPUs on average.`;
      share.disabled = true; share.textContent = 'File scenarios can’t be shared';
      $('reset-demand').hidden = false;
      render(); desk.announce(`Imported ${imported.length} demand observations`);
    };
    reader.readAsText(file);
  });
  $('reset-demand').addEventListener('click', function () {
    imported = null; N = 180;
    AVG = Math.round(Math.max(1, +$('avg').value || 100)); rho = Math.max(1.3, +$('rho').value || 4);
    $('avg').disabled = false; $('rho').disabled = false; $('avg').value = AVG; $('csv').value = '';
    $('csv-status').textContent = 'Using an illustrative curve.';
    share.disabled = false; share.textContent = 'Copy scenario link';
    this.hidden = true;
    normalizeCapacity(); render();
  });
  $('download-summary').addEventListener('click', () => {
    const lines = ['Compute Desk — capacity commitment', 'Average demand: ' + AVG.toFixed(1) + ' GPUs', 'Committed rate: $' + r.toFixed(2) + '/GPU-hour', 'Elastic rate: $' + d.toFixed(2) + '/GPU-hour', 'Recommended commitment: ' + Math.round(Kopt()) + ' GPUs', 'Selected commitment: ' + Math.round(K) + ' GPUs', 'Mode: ' + (imported ? 'imported observations' : 'synthetic curve'), 'Scenario: ' + location.href];
    if (imported) { lines.push('Imported demand observations (GPUs, sorted):'); lines.push(imported.join('\n')); }
    desk.download('compute-desk-supply.txt', lines.join('\n'));
  });

  // On first view, unless the address names a commitment, the line glides up to the cheapest one.
  let intro = null, introPending = false;
  function stopIntro() { introPending = false; if (intro) { intro.done = true; intro = null; } }
  const figure = $('fig-commit');
  if (!savedK && !reduced) {
    // Until the glide runs, the address keeps no commitment, so a reload replays it rather than saving zero.
    K = 0; introPending = true;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (!introPending) return;
      const target = Math.round(Kopt()), start = performance.now(), run = { done: false };
      intro = run;
      (function glide(now) {
        if (run.done) return;
        const k = Math.min(1, (now - start) / 1600), ease = 1 - Math.pow(1 - k, 3);
        K = Math.round(lerp(0, target, ease));
        if (k >= 1) introPending = false;
        render(k >= 1);
        if (k < 1) requestAnimationFrame(glide); else intro = null;
      })(start);
    }), { threshold: .4 });
    io.observe(figure);
  } else if (!savedK) K = Math.round(Kopt());

  $('res').value = r.toFixed(2); $('od').value = d.toFixed(2); $('avg').value = AVG; $('rho').value = rho;
  normalizeCapacity();
  renderBoard();
  render();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => render(false), 120); });
  ready = true;
})();
