/* What you rent: Figure 1 (will the model fit?) and Figure 2 (how the GPUs compare).
   Figure 3, the 3D rack, lives in rack3d.js. */
(function () {
  'use strict';

  /* Vendor specifications, verified 22 July 2026. Rubin bandwidth and power (est) are planning figures. */
  const GPUS = [
    { id: 'H100', arch: 'Hopper', year: '2022', mem: 80, memT: 'HBM3', bw: 3.35, comp: 4, prec: 'FP8', pw: 700, nvl: 900, nvlG: 'NVLink 4', dom: 8,
      t: 'The unit of account',
      p1: 'The reference unit for much of today’s rental market: broad provider coverage, relatively visible pricing, and a larger secondary supply base than newer products.',
      p2: 'Its price history is the market’s core lesson: available supply, contract structure, and fleet quality matter alongside successor announcements. A quoted H100-hour is incomplete without age, form factor, host, and fabric.',
      ask: 'How old is the fleet, what fabric is it wired with, and how does my rate track a reference index as H100 pricing keeps sliding?' },
    { id: 'H200', arch: 'Hopper refresh', year: '2024', mem: 141, memT: 'HBM3e', bw: 4.8, comp: 4, prec: 'FP8', pw: 700, nvl: 900, nvlG: 'NVLink 4', dom: 8,
      t: 'More memory within the Hopper generation',
      p1: 'The main upgrade is memory: 141 GB of HBM3e at 4.8 TB/s. A 70B-parameter model’s 16-bit weights nominally fit on one GPU, though the cache, runtime, and framework still decide whether the work fits without splitting it.',
      p2: 'A generation’s value can live entirely in its memory. Price per FLOP and price per GB rank the same chip very differently, so the right ranking depends on which resource your work runs out of first.',
      ask: 'Is my work limited by compute or by memory, and is the H200 premium over the H100 smaller than the cost of the splitting it removes?' },
    { id: 'B200', arch: 'Blackwell', year: '2024', mem: 192, memT: 'HBM3e', bw: 8, comp: 20, prec: 'FP4', pw: 1000, nvl: 1800, nvlG: 'NVLink 5', dom: 72, rack: true,
      t: 'The rack becomes the product',
      p1: 'A true architecture change: FP4 tensor cores, NVLink 5 at 1.8 TB/s, and a directly connected domain that grows from 8 GPUs in an HGX server to 72 in the GB200 NVL72. For rack-scale offers, power, cooling, and the NVLink domain become part of the quoted product.',
      p2: 'At 1,000 W per GPU it needs liquid cooling, which is when the industry’s binding constraint moved from chip supply to power and facility readiness. Two suppliers quoting the same B200 price can differ entirely in whether their buildings can run it.',
      ask: 'Is the facility ready for NVL72 racks, with power density and liquid cooling delivered rather than planned?' },
    { id: 'B300', arch: 'Blackwell Ultra', year: '2025', mem: 288, memT: 'HBM3e', bw: 8, comp: 30, prec: 'FP4', pw: 1400, nvl: 1800, nvlG: 'NVLink 5', dom: 72,
      t: 'Contract length meets the product cycle',
      p1: 'A mid-cycle change in memory and power: 288 GB of HBM3e and a 1.4 kW planning figure, following the B200 on NVIDIA’s recent yearly product cadence.',
      p2: 'A multi-year reserved term can overlap one or more successor launches. Weigh the discount together with refresh, substitution, rate-review, and early-exit rights rather than treating term length alone as savings.',
      ask: 'What refresh, substitution, or early-exit rights can be written into a multi-year term, and what are they worth?' },
    { id: 'Rubin', arch: 'Vera Rubin', year: 'H2 2026', mem: 288, memT: 'HBM4', bw: 22, comp: 50, prec: 'FP4', pw: 2300, nvl: 3600, nvlG: 'NVLink 6', dom: 72, est: true,
      t: 'The next contract checkpoint',
      p1: 'NVIDIA specifies 336 billion transistors, 288 GB of HBM4 at 22 TB/s, NVLink 6, and expanded low-precision tensor capability. Vendor throughput claims are workload-specific and should not be turned straight into a cost multiplier.',
      p2: 'Partner systems are expected in the second half of 2026. For a buyer, Rubin is both an allocation question and a contract question: how its ramp affects substitution, refresh, renewal, and residual-value terms on earlier generations.',
      ask: 'Where do I sit in the allocation queue, and how will Rubin availability affect renewal pricing and substitution rights on earlier commitments?' }
  ];

  const dagger = (g) => (g.est ? ' †' : '');
  const METRICS = [
    { k: 'mem', label: 'Memory', color: 'memory', val: (g) => g.mem, fmt: (g) => `${g.mem} GB ${g.memT}`,
      cap: 'Memory capacity limits how much of the model and its working state can sit on one GPU.' },
    { k: 'bw', label: 'Memory speed', color: 'memory', val: (g) => g.bw, fmt: (g) => `${g.bw} TB/s${dagger(g)}`,
      cap: 'Memory bandwidth is how fast a GPU reads and writes its own memory, which often limits serving speed.' },
    { k: 'comp', label: 'Compute', color: 'compute', val: (g) => g.comp, fmt: (g) => `${g.comp} PF ${g.prec}`,
      cap: 'Headline arithmetic throughput. The figures use different precisions and may include sparsity, so they are not workload speeds.' },
    { k: 'pw', label: 'Power', color: 'power', val: (g) => g.pw, fmt: (g) => (g.pw >= 1000 ? `${(g.pw / 1000).toFixed(1)} kW` : `${g.pw} W`) + dagger(g),
      cap: 'Power per GPU drives cooling and rack density. These planning figures leave out the rest of the server and the building.' },
    { k: 'nvl', label: 'GPU-to-GPU speed', color: 'network', val: (g) => g.nvl, fmt: (g) => `${(g.nvl / 1000).toFixed(1)} TB/s`,
      cap: 'NVLink bandwidth is how fast one GPU exchanges data with the others it connects to directly.' },
    { k: 'dom', label: 'Connected GPUs', color: 'network', val: (g) => g.dom, fmt: (g) => `${g.dom} · ${g.nvlG}`,
      cap: 'How many GPUs NVLink joins directly. It is a property of the server or rack, so confirm the system, not just the GPU.' }
  ];

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (id) => document.getElementById(id);
  const q = ComputeDesk.params();

  /* ---------- Figure 1: will the model fit? ---------- */
  const MIN_B = 7, MAX_B = 405;
  const toSlider = (b) => Math.log(b / MIN_B) / Math.log(MAX_B / MIN_B);
  const fromSlider = (v) => Math.round(MIN_B * Math.pow(MAX_B / MIN_B, v));
  const fit = {
    model: clamp(Math.round(+q.get('model') || 70), MIN_B, MAX_B),
    bits: [16, 8, 4].includes(+q.get('bits')) ? +q.get('bits') : 16
  };
  const modelInput = $('model');
  modelInput.value = toSlider(fit.model);

  const fitRows = $('fit-rows');
  fitRows.innerHTML = GPUS.map((g, i) =>
    `<div class="fit-row"><span class="fit-name">${g.id}<small>${g.mem} GB${g.est ? ' †' : ''}</small></span>` +
    `<span class="fit-lane" id="lane${i}"></span><span class="fit-count" id="count${i}"></span></div>`).join('');
  const pools = GPUS.map(() => []);

  function bucket(i, n) {
    const lane = $('lane' + i);
    while (pools[i].length < n) {
      const b = document.createElement('span');
      b.className = 'fit-gpu';
      b.innerHTML = '<i></i>';
      lane.appendChild(b);
      pools[i].push(b);
    }
    return pools[i];
  }

  function renderFit() {
    const bytes = fit.bits / 8;
    const w = fit.model * bytes;                       /* GB of weights */
    const need = GPUS.map((g) => Math.max(1, Math.ceil(w / g.mem)));
    const scale = Math.max(288, ...GPUS.map((g, i) => need[i] * g.mem));

    GPUS.forEach((g, i) => {
      const n = need[i];
      const blocks = bucket(i, n);
      const step = (g.mem / scale) * 100;
      blocks.forEach((b, k) => {
        const on = k < n;
        b.style.left = `${(on ? k : n) * step}%`;
        b.style.width = `calc(${step}% - 3px)`;
        b.style.opacity = on ? 1 : 0;
        b.classList.toggle('far', on && k >= g.dom);
        const held = clamp(w - k * g.mem, 0, g.mem);
        b.firstChild.style.width = on ? `${(held / g.mem) * 100}%` : '0%';
      });
      const servers = Math.ceil(n / g.dom);
      $('count' + i).innerHTML = `<b>${n}</b> GPU${n > 1 ? 's' : ''}` + (servers > 1 ? ` · ${servers} servers` : '');
    });

    const first = GPUS.findIndex((g) => w <= g.mem);
    const fmtGB = (x) => (x >= 100 ? Math.round(x) : +x.toFixed(1)).toLocaleString('en-US');
    $('model-out').textContent = `${fit.model}B`;
    modelInput.setAttribute('aria-valuetext', `${fit.model} billion parameters`);
    $('w-gb').textContent = `${fmtGB(w)} GB`;
    $('w-bytes').textContent = bytes === 0.5 ? '½' : String(bytes);
    $('w-fits').textContent = first < 0 ? 'None' : GPUS[first].id;
    $('w-h100').textContent = String(need[0]);

    let line;
    if (first < 0) {
      line = `${fmtGB(w)} GB of weights is more than any single GPU holds: it needs at least ${need[3]} B300s or ${need[0]} H100s, which talk to each other on every step.`;
    } else {
      const g = GPUS[first], spare = g.mem - w;
      const lead = first === 0 ? `${fmtGB(w)} GB of weights fits on every GPU here; the H100 leaves` : `${fmtGB(w)} GB of weights. The smallest GPU that holds them is the ${g.id}, which leaves`;
      line = `${lead} ${fmtGB(spare)} GB for everything else` + (spare < g.mem * 0.25 ? ', which is tight once the cache and runtime are added.' : '.');
    }
    $('fit-verdict').textContent = line;

    document.querySelectorAll('#bits-seg button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.bits === fit.bits)));
    ComputeDesk.setParams({ model: fit.model === 70 ? null : fit.model, bits: fit.bits === 16 ? null : fit.bits });
  }

  modelInput.addEventListener('input', () => { fit.model = fromSlider(+modelInput.value); renderFit(); });
  document.querySelectorAll('#bits-seg button').forEach((b) => b.addEventListener('click', () => { fit.bits = +b.dataset.bits; renderFit(); }));

  /* ---------- Figure 2: how the GPUs compare ---------- */
  const spec = {
    metric: clamp(Math.round(+q.get('metric') || 0), 0, METRICS.length - 1),
    gpu: clamp(Math.round(+q.get('gpu') || 0), 0, GPUS.length - 1)
  };
  $('metric-seg').insertAdjacentHTML('beforeend', METRICS.map((m, i) => `<button type="button" data-i="${i}">${m.label}</button>`).join(''));
  $('spec-rows').innerHTML =
    '<div class="spec-head" aria-hidden="true"><span>GPU</span><span></span><span>Value</span><span>vs H100</span></div>' +
    GPUS.map((g, i) =>
      `<button type="button" class="spec-row" data-i="${i}"><span class="spec-name">${g.id}<small>${g.arch} · ${g.year}</small></span>` +
      `<span class="spec-lane"><i id="fill${i}"></i></span><span class="spec-val" id="val${i}"></span><span class="spec-mult" id="mult${i}"></span></button>`).join('');

  let shown = false;
  function renderSpecs(first) {
    const m = METRICS[spec.metric];
    const max = Math.max(...GPUS.map(m.val)), base = m.val(GPUS[0]);
    GPUS.forEach((g, i) => {
      const f = $('fill' + i);
      f.className = m.color;
      f.style.width = shown ? `${(m.val(g) / max) * 100}%` : '0%';
      $('val' + i).textContent = m.fmt(g);
      const x = m.val(g) / base;
      $('mult' + i).textContent = i === 0 ? '—' : `×${x >= 10 ? Math.round(x) : x.toFixed(1)}`;
    });
    $('metric-cap').textContent = m.cap;
    document.querySelectorAll('#metric-seg button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.i === spec.metric)));
    document.querySelectorAll('.spec-row').forEach((r) => r.setAttribute('aria-pressed', String(+r.dataset.i === spec.gpu)));

    const g = GPUS[spec.gpu];
    const file = $('gpu-file');
    file.innerHTML =
      `<h3>${g.id}: ${g.t}</h3><p class="tags">${g.arch} · ${g.year} · ${g.nvlG} · ${g.memT}</p>` +
      `<p>${g.p1}</p><p>${g.p2}</p><p class="ask"><strong>Ask:</strong> ${g.ask}</p>` +
      (g.rack ? '<a class="onward" href="#rack">See 72 Blackwell GPUs in one rack ↓</a>' : '');
    if (!first) { file.style.animation = 'none'; void file.offsetWidth; file.style.animation = ''; }
    ComputeDesk.setParams({ metric: spec.metric || null, gpu: spec.gpu || null });
  }

  document.querySelectorAll('#metric-seg button').forEach((b) => b.addEventListener('click', () => { spec.metric = +b.dataset.i; renderSpecs(); }));
  document.querySelectorAll('.spec-row').forEach((r) => r.addEventListener('click', () => { spec.gpu = +r.dataset.i; renderSpecs(); }));

  /* The bars grow in the first time the figure comes into view. */
  function reveal() { shown = true; renderSpecs(true); }
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); requestAnimationFrame(reveal); } }, { threshold: 0.3 });
    io.observe($('spec-rows'));
  } else shown = true;

  renderFit();
  renderSpecs(true);
})();
