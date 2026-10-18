/* What the contract covers. One scenario drives the month figure, the credit figure, and the
   fourteen clauses. URL parameters, CSV columns, and saved review statuses match the original
   sla-anatomy page, so old links and old reviews still open the same way. */
(function () {
  'use strict';
  const { fmt, clamp, reduced, outageMonth } = window.Figures;
  const desk = window.ComputeDesk;
  const $ = id => document.getElementById(id);

  // Credit schedules: below each threshold, this percentage of monthly fees is credited.
  const COMMITS = [
    { label: '99.0%', tiers: [[.990, 10], [.95, 25]] },
    { label: '99.5%', tiers: [[.995, 10], [.99, 25], [.95, 50]] },
    { label: '99.9%', tiers: [[.999, 10], [.99, 25], [.95, 100]] }
  ];
  const WINDOW_HOURS = { mo: 730, yr: 8760 };
  const GPUS = [256, 512, 1024, 2048, 4096], TERMS = [12, 24, 36];
  const HM = 730; // hours in the billing month

  // ---------- State, read from the address ----------
  const q = desk.params();
  const s = {
    sla: q.has('sla') ? clamp(Math.round(+q.get('sla') || 0), 0, COMMITS.length - 1) : 2,
    def: q.get('def') === 'inst' ? 'inst' : 'plat',
    win: q.get('win') === 'yr' ? 'yr' : 'mo',
    platform: q.has('platform') ? Math.max(0, +q.get('platform') || 0) : 0,
    node: q.has('node') ? Math.max(0, +q.get('node') || 0) : 5000,
    mult: q.has('mult') ? Math.max(1, +q.get('mult') || 3) : 3,
    excl: q.get('excl') === '1',
    g: GPUS.includes(+q.get('g')) ? +q.get('g') : 1024,
    term: TERMS.includes(+q.get('term')) ? +q.get('term') : 24,
    rate: q.has('rate') ? clamp(+q.get('rate') || 2.35, 1.75, 3.25) : 2.35,
    pre: q.has('pre') ? clamp(+q.get('pre') || 0, 0, 25) : 15
  };
  function save() {
    desk.setParams({ sla: s.sla, def: s.def, win: s.win, platform: s.platform, node: s.node, mult: s.mult, excl: s.excl ? 1 : null, g: s.g, term: s.term, rate: s.rate.toFixed(2), pre: s.pre });
  }

  // ---------- The arithmetic ----------
  const usd = x => x >= 1e6 ? '$' + (x / 1e6).toFixed(2) + 'M' : x >= 1e4 ? '$' + Math.round(x / 1e3) + 'k' : '$' + Math.round(x).toLocaleString('en-US');
  const pct = u => { const p = u * 100; return (p >= 99.9995 ? '100' : p.toFixed(p >= 99.99 ? 3 : 2)) + '%'; };
  function tierAt(uptime) { let t = 0; COMMITS[s.sla].tiers.forEach(([threshold, credit]) => { if (uptime < threshold) t = credit; }); return t; }
  function deal() { const monthly = s.g * s.rate * HM; return { monthly, tcv: monthly * s.term, prepay: monthly * s.term * s.pre / 100 }; }
  function outage() {
    const hrs = WINDOW_HOURS[s.win], spend = s.g * s.rate * HM;
    const down = { plat: s.platform, inst: s.platform + s.node / s.g };
    const uptime = { plat: 1 - down.plat / hrs, inst: 1 - down.inst / hrs };
    const tier = { plat: s.excl ? 0 : tierAt(uptime.plat), inst: s.excl ? 0 : tierAt(uptime.inst) };
    return {
      hrs, spend, uptime, tier,
      counted: { plat: s.platform * s.g, inst: s.platform * s.g + s.node },
      credit: { plat: spend * tier.plat / 100, inst: spend * tier.inst / 100 },
      loss: (s.platform * s.g + s.node) * s.rate * s.mult
    };
  }
  function allowed(hrs) {
    const mins = (1 - [.99, .995, .999][s.sla]) * hrs * 60;
    return (mins >= 120 ? (mins / 60).toFixed(1) + ' h' : Math.round(mins) + ' min') + (s.win === 'mo' ? ' a month' : ' a year');
  }

  // ---------- Figure 1: one month, two measures ----------
  const monthLost = $('month-lost');
  const month = outageMonth({
    fig: $('outage-experiment'), svg: $('month-svg'), day: $('month-day'), bar: $('month-progress'),
    scenario: () => ({ nodeHours: s.node, platformHours: s.platform, fleet: s.g }),
    onHour(h, lost) { monthLost.textContent = fmt(Math.round(lost.node + lost.platform)) + ' GPU-hours lost so far'; }
  });
  function renderVerdicts(o) {
    ['plat', 'inst'].forEach(def => {
      const card = document.querySelector(`.verdict[data-def="${def}"]`);
      card.classList.toggle('is-yours', s.def === def);
      card.classList.toggle('breach', o.tier[def] > 0);
      $('v-' + def).textContent = pct(o.uptime[def]);
      const counts = def === 'plat'
        ? (s.platform ? `Counts the platform outage: ${fmt(o.counted.plat)} GPU-hours.` : `Counts none of the ${fmt(s.node)} GPU-hours lost to failed servers.`)
        : `Counts every lost GPU-hour: ${fmt(o.counted.inst)}.`;
      const remedy = s.excl ? 'The provider excludes the incident, so no credit.'
        : o.tier[def] ? `Below ${COMMITS[s.sla].label}, so a ${o.tier[def]}% credit: ${usd(o.credit[def])}.` : 'Promise met. No credit.';
      $(`v-${def}-note`).textContent = counts + ' ' + remedy;
    });
  }

  // ---------- Figure 2: the credit against the loss ----------
  function renderCredit(o) {
    const credit = o.credit[s.def], tier = o.tier[s.def], scale = Math.max(o.loss, credit, 1);
    $('loss-bar').style.width = (o.loss / scale * 100) + '%';
    $('credit-bar').style.width = (credit / scale * 100) + '%';
    $('loss-val').textContent = usd(o.loss);
    $('credit-val').textContent = usd(credit);
    $('loss-working').textContent = `${fmt(o.counted.inst)} GPU-hours × $${s.rate.toFixed(2)} × ${s.mult.toFixed(1)}`;
    $('credit-working').textContent = `${tier}% of ${usd(o.spend)} monthly fees` + (s.excl ? ', incident excluded' : '');
    $('r-uptime').textContent = pct(o.uptime[s.def]);
    $('r-allowed').textContent = allowed(o.hrs);
    $('r-fees').textContent = usd(o.spend);
    const ratio = $('r-ratio');
    ratio.textContent = o.loss === 0 && credit === 0 ? '—' : o.loss === 0 ? '∞' : Math.round(credit / o.loss * 100) + '%';
    let msg;
    if (s.excl) msg = 'An exclusion removes this incident. The machines failed, but the promise pays nothing.';
    else if (s.def === 'plat' && s.node > 0 && s.platform === 0) msg = `The servers lost ${fmt(s.node)} GPU-hours, and a platform-only promise counts none of them. Switch Figure 1 to “GPU-hours delivered” to count them.`;
    else if (tier > 0) msg = `This definition counts the failure. The credit is ${tier}% of one month’s fees; what the loss is worth depends on the cost you assign to lost work.`;
    else if (o.loss > 0) msg = 'Work was lost, but there is no credit: the incident stays inside the downtime the promise allows.';
    else msg = 'No lost work in this scenario. Add some failures in your scenario to see what the promise covers.';
    $('status').textContent = msg;
  }

  // ---------- The clauses ----------
  // The definition row prices a bad year: four months whose node-level uptime breached the promise,
  // which the platform measure records as clean.
  const BAD_YEAR = [99.85, 99.7, 98.8, 99.87];
  const badYearCredits = () => BAD_YEAR.map(u => tierAt(u / 100) / 100).filter(Boolean);
  const STAKES = {
    delivery: d => 1.5 * d.monthly,
    accept: d => d.monthly,
    truedown: d => .15 * d.monthly * Math.max(0, s.term - 9),
    energy: d => .05 * 12 * d.monthly,
    prepay: d => d.prepay,
    def: d => s.def === 'inst' ? badYearCredits().reduce((a, b) => a + b, 0) * d.monthly : 0,
    excl: d => (16 / 730) * d.monthly * 12,
    ttr: d => .25 * d.monthly,
    cure: d => d.monthly,
    cap: d => 9 * d.monthly,
    fm: d => 1.5 * d.monthly
  };
  const list = $('clause-list');
  const rows = [...list.querySelectorAll('.clause')];
  const stakes = () => { const d = deal(); return rows.map(row => ({ row, k: row.dataset.k, ord: +row.dataset.ord, kind: row.dataset.kind, v: STAKES[row.dataset.k] ? STAKES[row.dataset.k](d) : null })); };
  let sortBy = 'stake';
  function renderClauses() {
    const all = stakes(), vals = all.filter(x => x.v > 0).map(x => x.v);
    const lo = Math.log(Math.min(...vals) / 2), hi = Math.log(Math.max(...vals) * 1.5);
    const X = v => clamp((Math.log(v) - lo) / (hi - lo) * 100, 0, 100);
    $('axis').innerHTML = [1e5, 1e6, 1e7, 1e8].filter(g => Math.log(g) >= lo && Math.log(g) <= hi)
      .map(g => `<span style="left:${X(g).toFixed(1)}%">${g >= 1e6 ? '$' + g / 1e6 + 'M' : '$' + g / 1e3 + 'k'}</span>`).join('');
    all.forEach(({ row, v }) => {
      if (v === null) return;
      row.querySelector('.c-stake b').textContent = usd(v);
      row.querySelector('.c-stake i').style.width = (v > 0 ? X(v) : 0) + '%';
    });
    const credits = badYearCredits();
    $('def-model').textContent = s.def !== 'inst'
      ? 'Measured at the platform, the same bad year comes out clean, so nothing is recovered. Switch Figure 1 to “GPU-hours delivered” to price what the draft’s definition leaves out.'
      : `(${credits.map(c => c.toFixed(2)).join(' + ') || '0'}) × monthly fees: ${['no', 'one', 'two', 'three', 'four'][credits.length]} breach month${credits.length === 1 ? '' : 's'} in a bad year at the ${COMMITS[s.sla].label} schedule. Measured at the platform, the same year earns nothing.`;
    document.querySelectorAll('[data-months-after-9]').forEach(n => { n.textContent = Math.max(0, s.term - 9); });
    document.querySelectorAll('select.lvl').forEach(sel => { sel.value = String(s.sla); });
    order(ready);
  }
  let ready = false;
  // Re-rank rows, sliding them from their old positions to their new ones.
  function order(animate) {
    const ranked = stakes().sort(sortBy === 'clause' ? (a, b) => a.ord - b.ord : (a, b) => ((b.v ?? -1) - (a.v ?? -1)) || a.ord - b.ord).map(x => x.row);
    if (ranked.every((row, i) => list.children[i] === row)) return;
    const before = animate && !reduced ? new Map(rows.map(r => [r, r.getBoundingClientRect().top])) : null;
    ranked.forEach(row => list.appendChild(row));
    if (!before) return;
    rows.forEach(r => { const dy = before.get(r) - r.getBoundingClientRect().top; if (dy) { r.style.transition = 'none'; r.style.transform = `translateY(${dy}px)`; } });
    void list.offsetHeight;
    rows.forEach(r => { r.style.transition = 'transform .35s ease'; r.style.transform = ''; });
  }

  // Review status and redline copy, kept in this browser under the original page's key.
  const STATUS_KEY = 'computeDeskIssueState';
  let review = {};
  try { review = JSON.parse(localStorage.getItem(STATUS_KEY) || '{}'); } catch (e) { review = {}; }
  rows.forEach(row => {
    const k = row.dataset.k, tools = document.createElement('div');
    tools.className = 'c-tools';
    tools.innerHTML = '<label>Review status <select><option value="open">Open</option><option value="priority">Priority</option><option value="accepted">Accepted</option><option value="parked">Parked</option></select></label><button type="button">Copy the redline</button>';
    const select = tools.querySelector('select'), copy = tools.querySelector('button');
    select.setAttribute('aria-label', 'Review status for ' + row.querySelector('.c-name').firstChild.textContent);
    select.value = review[k] || 'open';
    row.dataset.status = select.value;
    select.addEventListener('change', () => {
      review[k] = select.value; row.dataset.status = select.value;
      try { localStorage.setItem(STATUS_KEY, JSON.stringify(review)); } catch (e) { /* private mode: status lasts for this visit */ }
    });
    copy.addEventListener('click', () => {
      desk.copyText(row.querySelector('.redline').innerText.trim(), copy, 'Redline copied');
      copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy the redline'; }, 1800);
    });
    row.querySelector('.c-body').appendChild(tools);
  });

  // Links to a clause open it before scrolling, including links from other pages and old addresses.
  function arrive(id) {
    const row = document.getElementById(id);
    if (!row || !row.classList.contains('clause')) return;
    row.open = true;
    setTimeout(() => {
      row.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
    }, reduced ? 0 : 60);
  }
  addEventListener('hashchange', () => arrive(location.hash.slice(1)));
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#ir-"]');
    if (!a) return;
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    if (location.hash !== '#' + id) location.hash = id; else arrive(id);
  });

  // Printing the review prints every clause open, then puts the page back.
  let printState = null;
  addEventListener('beforeprint', () => {
    printState = rows.map(r => [r, r.open, r.getAttribute('name')]);
    rows.forEach(r => { r.removeAttribute('name'); r.open = true; });
  });
  addEventListener('afterprint', () => {
    if (!printState) return;
    printState.forEach(([r, open, name]) => { r.open = open; if (name) r.setAttribute('name', name); });
    printState = null;
  });

  $('export-issues').addEventListener('click', () => {
    const quote = v => '"' + String(v).replace(/"/g, '""') + '"';
    const lines = ['issue,status,exposure,label'];
    stakes().sort((a, b) => a.ord - b.ord).forEach(x => lines.push([x.k, review[x.k] || 'open', x.v === null ? '' : Math.round(x.v), x.kind].map(quote).join(',')));
    lines.push('', quote('Scenario') + ',' + quote(location.href));
    desk.download('compute-desk-issues.csv', lines.join('\n'), 'text/csv;charset=utf-8');
  });

  // ---------- Your scenario: controls ----------
  function segment(id, key, read) {
    const buttons = [...$(id).querySelectorAll('button')];
    const paint = () => buttons.forEach(b => b.setAttribute('aria-pressed', String(read(b) === s[key])));
    buttons.forEach(b => b.addEventListener('click', () => { s[key] = read(b); paint(); update(); }));
    return paint;
  }
  const paints = [
    segment('def-seg', 'def', b => b.dataset.def),
    segment('promise-seg', 'sla', b => +b.dataset.sla),
    segment('window-seg', 'win', b => b.dataset.win),
    segment('gpus-seg', 'g', b => +b.dataset.g),
    segment('term-seg', 'term', b => +b.dataset.term)
  ];
  $('sort-seg').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    sortBy = b.dataset.sort;
    $('sort-seg').querySelectorAll('button').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    order(true);
  }));
  const sliders = {
    node: v => fmt(v), platform: v => v.toFixed(1).replace(/\.0$/, '') + ' h', mult: v => v.toFixed(1) + '×',
    rate: v => '$' + v.toFixed(2), pre: v => v + '%'
  };
  Object.keys(sliders).forEach(key => {
    const input = $(key);
    input.value = s[key];
    input.addEventListener('input', () => { s[key] = +input.value; update(); });
  });
  const excl = $('excl');
  excl.addEventListener('click', () => { s.excl = !s.excl; update(); });
  document.querySelectorAll('select.lvl').forEach(sel => sel.addEventListener('change', () => { s.sla = +sel.value; update(); }));

  function update() {
    paints.forEach(p => p());
    Object.keys(sliders).forEach(key => { $(key + '-out').textContent = sliders[key](s[key]); });
    excl.setAttribute('aria-pressed', String(s.excl));
    const tiers = COMMITS[s.sla].tiers;
    $('schedule').textContent = 'Credits: ' + tiers.map(([threshold, credit], i) => `${credit}%${i ? '' : ' of monthly fees'} below ${+(threshold * 100).toFixed(1)}%`).join(', ') + '.';
    const d = deal(), o = outage();
    $('d-monthly').textContent = usd(d.monthly);
    $('d-tcv').textContent = usd(d.tcv);
    $('d-prepay').textContent = usd(d.prepay);
    renderVerdicts(o);
    renderCredit(o);
    renderClauses();
    if (month.paused) month.redraw();
    save();
  }
  update();
  ready = true;
  if (location.hash) arrive(location.hash.slice(1));
})();
