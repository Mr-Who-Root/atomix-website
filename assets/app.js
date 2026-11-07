/* Atomix website: interactions and the sizing calculator. Everything the
   calculator uses comes from assets/data.js. */
(function () {
  "use strict";
  const D = window.ATOMIX_DATA;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navigation ---------- */
  const nav = $(".nav");
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    nav.classList.toggle("hidden", y > lastY && y > 300 && !nav.classList.contains("open"));
    lastY = y;
    const ids = ["features", "roadmap", "sizing", "compare", "faq"];
    let active = "";
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 140) active = id;
    }
    $$(".nav .links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + active));
  }, { passive: true });
  $(".menu-btn").addEventListener("click", () => nav.classList.toggle("open"));
  $$(".nav .links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Hero: flowing contour lines ---------- */
  (function hero() {
    const canvas = $(".hero canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, t = 0, raf;
    function size() { const r = canvas.parentElement.getBoundingClientRect(); w = canvas.width = r.width * devicePixelRatio; h = canvas.height = r.height * devicePixelRatio; }
    size();
    window.addEventListener("resize", size);
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const lines = 14;
      for (let i = 0; i < lines; i++) {
        const y0 = h * (0.08 + (i / lines) * 0.5);
        const glow = i === 7;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6 * devicePixelRatio) {
          const n = Math.sin(x / (w * 0.18) + t * 0.6 + i * 0.7) * 18 + Math.sin(x / (w * 0.06) - t * 0.4 + i) * 7 + Math.sin(x / (w * 0.4) + i * 1.3) * 40;
          const y = y0 + n * devicePixelRatio;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = glow ? "rgba(136,192,208,0.9)" : "rgba(136,192,208," + (0.05 + (i / lines) * 0.08) + ")";
        ctx.lineWidth = (glow ? 1.6 : 1) * devicePixelRatio;
        if (glow) { ctx.shadowColor = "rgba(136,192,208,0.8)"; ctx.shadowBlur = 16 * devicePixelRatio; } else ctx.shadowBlur = 0;
        ctx.stroke();
      }
      t += 0.012;
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    }
    draw();
    document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else if (!reduceMotion) draw(); });
  })();

  /* ---------- Counters ---------- */
  const counters = $$("[data-count]");
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.decimals | 0), dur = 1400, t0 = performance.now();
      const fmt = (v) => v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (reduceMotion) { el.textContent = fmt(end); return; }
      (function tick(now) {
        const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(end * k);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => cio.observe(el));

  /* ---------- Feature carousel ---------- */
  (function carousel() {
    const track = $(".track"); if (!track) return;
    const prev = $("[data-prev]"), next = $("[data-next]");
    const step = () => (track.querySelector(".card").getBoundingClientRect().width + 20);
    prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
    next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
    const update = () => { prev.disabled = track.scrollLeft < 10; next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 10; };
    track.addEventListener("scroll", update, { passive: true }); update();
  })();

  /* ---------- Roadmap sticky steps ---------- */
  (function steps() {
    const steps = $$(".step"), rail = $$(".steps-rail li");
    if (!steps.length) return;
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = steps.indexOf(e.target);
        rail.forEach((li, j) => li.classList.toggle("active", j === i));
        steps.forEach((s, j) => s.classList.toggle("dimmed", j !== i));
      });
    }, { rootMargin: "-40% 0px -45% 0px" });
    steps.forEach((s) => sio.observe(s));
    rail.forEach((li, i) => li.addEventListener("click", () => steps[i].scrollIntoView({ behavior: "smooth", block: "center" })));
  })();

  /* ---------- Sizing calculator ---------- */
  const state = {
    eps: 2500, bytes: 1024, hot: 90, warm: 0, mix: "mixed",
    ratio: 8, replicas: D.elastic.replicas, indexFactor: D.elastic.indexFactor, memDisk: D.elastic.memDiskRatio,
    nodeRam: D.elastic.nodeRamGb, cloudRate: D.elastic.cloudRatePerGbRamHour, eurUsd: D.eurUsd
  };
  const presets = {
    small: { eps: 500, hot: 30, warm: 0 },
    medium: { eps: 2500, hot: 90, warm: 0 },
    large: { eps: 10000, hot: 30, warm: 335 }
  };
  const fmtN = (v, d) => v.toLocaleString(undefined, { maximumFractionDigits: d == null ? 0 : d, minimumFractionDigits: d == null ? 0 : d });
  const fmtGB = (gb) => gb >= 1000 ? fmtN(gb / 1000, gb >= 10000 ? 0 : 1) + " TB" : fmtN(gb) + " GB";
  const usd = (v) => "$" + fmtN(Math.round(v));
  const toUsd = (price, currency) => currency === "EUR" ? price * state.eurUsd : price;

  function atomixSpec() {
    const rawDay = state.eps * state.bytes * 86400 / 1e9;
    const storedDay = rawDay / state.ratio;
    const A = D.atomix;
    const localGB = storedDay * state.hot * A.diskHeadroom + storedDay * state.warm * A.sidecarShare * A.diskHeadroom;
    const s3GB = storedDay * state.warm * (1 - A.sidecarShare);
    let tier = A.tiers[A.tiers.length - 1];
    for (const t of A.tiers) { if (state.eps <= t.max) { tier = t; break; } }
    const over = state.eps > A.tiers[A.tiers.length - 1].max;
    const cacheRam = storedDay * A.cacheDays + 6;
    const ram = Math.max(tier.ram, Math.ceil(cacheRam / 8) * 8);
    return { rawDay, storedDay, localGB, s3GB, vcpu: tier.vcpu, ram, over };
  }

  function esSpec(a) {
    const E = D.elastic;
    const diskGB = a.rawDay * (state.hot + state.warm) * state.indexFactor * (1 + state.replicas) * E.headroom;
    const perNodeDisk = state.nodeRam * state.memDisk;
    const nodes = Math.max(E.minNodes, Math.ceil(diskGB / perNodeDisk));
    return { diskGB, nodes, ram: nodes * state.nodeRam, vcpu: nodes * E.nodeVcpu, perNodeDisk: diskGB / nodes };
  }

  // The smallest plan with the CPU and RAM. Where extra storage cannot be
  // attached as a fast local disk (dedicated servers, VDS), prefer a plan
  // whose own NVMe holds the data; fall back to network storage with a note.
  function pickPlan(p, vcpu, ram, disk) {
    const fits = p.plans.filter((pl) => pl.vcpu >= vcpu && pl.ram >= ram);
    if (!fits.length) return { plan: null, network: false };
    if (p.attachable) return { plan: fits[0], network: false };
    const withDisk = fits.find((pl) => pl.disk >= disk);
    if (withDisk) return { plan: withDisk, network: false };
    return { plan: fits[fits.length - 1], network: true };
  }

  function providerCosts(a, e) {
    return D.providers.map((p) => {
      const pick = pickPlan(p, a.vcpu, a.ram, a.localGB);
      const plan = pick.plan;
      let atomix = null, note = "";
      if (plan) {
        const extraDisk = Math.max(0, a.localGB - plan.disk);
        const compute = toUsd(plan.price, p.currency);
        const disk = toUsd(extraDisk * p.diskRate, p.currency);
        const object = toUsd(a.s3GB * p.objectRate, p.currency);
        atomix = { plan, compute, disk, object, total: compute + disk + object, extraDisk, network: pick.network && extraDisk > 0 };
      } else {
        note = "Bigger than the largest single server here: this needs several nodes.";
      }
      const n = p.esNode;
      const esExtraDisk = Math.max(0, e.perNodeDisk - n.disk);
      const esCompute = toUsd(n.price, p.currency) * e.nodes;
      const esDisk = toUsd(esExtraDisk * p.diskRate, p.currency) * e.nodes;
      // Elasticsearch nodes need a RAM:disk ratio the plan may not offer; if a
      // node's disk is far above the memory ratio, the plan count already
      // covers it (nodes is sized from disk).
      const es = { node: n, compute: esCompute, disk: esDisk, total: esCompute + esDisk };
      return { p, atomix, es, note };
    });
  }

  function render() {
    const a = atomixSpec();
    const e = esSpec(a);
    const costs = providerCosts(a, e);

    $("#o-eps").textContent = fmtN(state.eps);
    $("#o-bytes").textContent = fmtN(state.bytes / 1024, 1) + " KB";
    $("#o-hot").textContent = state.hot + " days";
    $("#o-warm").textContent = state.warm + " days";

    $("#r-vcpu").textContent = a.vcpu;
    $("#r-ram").textContent = a.ram;
    $("#r-disk").innerHTML = fmtGB(a.localGB).replace(/ (GB|TB)/, " <small>$1</small>");
    $("#r-s3").innerHTML = a.s3GB > 0 ? fmtGB(a.s3GB).replace(/ (GB|TB)/, " <small>$1</small>") : "0 <small>GB</small>";
    $("#r-raw").textContent = fmtGB(a.rawDay);
    $("#r-stored").textContent = fmtGB(a.storedDay);
    $("#r-ratio").textContent = state.ratio + " : 1";
    $("#r-over").hidden = !a.over;

    // Provider cards
    const wrap = $("#providers");
    const best = costs.filter((c) => c.atomix).sort((x, y) => x.atomix.total - y.atomix.total)[0];
    wrap.innerHTML = costs.map((c) => {
      const p = c.p;
      if (!c.atomix) {
        return `<div class="pcard"><div class="name">${p.name}<span>${p.currency}</span></div><div class="warn">${c.note}</div><div class="line"><span>Largest server</span><b>${p.plans[p.plans.length - 1].name}</b></div></div>`;
      }
      const A = c.atomix;
      return `<div class="pcard${c === best ? " best" : ""}">
        <div class="name">${p.name}<span>${p.currency === "EUR" ? "EUR → USD" : "USD"}</span></div>
        ${c === best ? '<div class="badge">Lowest cost</div>' : ""}
        <div class="total">${usd(A.total)}<small>/ month</small></div>
        <div class="plan"><b>${A.plan.name}</b><span>${A.plan.vcpu} vCPU · ${A.plan.ram} GB RAM${A.plan.disk ? " · " + fmtGB(A.plan.disk) + " NVMe" : ""}</span></div>
        <div class="line"><span>Server</span><b>${usd(A.compute)}</b></div>
        <div class="line"><span>${A.extraDisk > 0 ? "Extra disk, " + fmtGB(A.extraDisk) : "Disk included"}</span><b>${usd(A.disk)}</b></div>
        ${a.s3GB > 0 ? `<div class="line"><span>Object storage, ${fmtGB(a.s3GB)}</span><b>${usd(A.object)}</b></div>` : ""}
        ${A.network ? `<div class="warn">No plan here has ${fmtGB(a.localGB)} of local NVMe, so the rest is network storage: searches over it will be slower.</div>` : ""}
      </div>`;
    }).join("");

    // Elasticsearch
    $("#e-nodes").textContent = e.nodes;
    $("#e-ram").textContent = fmtN(e.ram);
    $("#e-disk").innerHTML = fmtGB(e.diskGB).replace(/ (GB|TB)/, " <small>$1</small>");
    $("#e-vcpu").textContent = e.vcpu;
    const cloud = e.ram * 730 * state.cloudRate;
    const cloudHigh = e.ram * 730 * D.elastic.cloudRateHighPerGbRamHour;
    $("#e-cloud").textContent = usd(cloud) + " – " + usd(cloudHigh);

    const rows = costs.map((c) => ({ name: c.p.name, atomix: c.atomix ? c.atomix.total : null, es: c.es.total, plan: c.atomix ? c.atomix.plan.name : "—", esPlan: e.nodes + " × " + c.es.node.name }));
    $("#cost-rows").innerHTML = rows.map((r) => `<tr><td>${r.name}</td><td>${r.plan}</td><td class="n">${r.atomix == null ? "—" : usd(r.atomix)}</td><td>${r.esPlan}</td><td class="n">${usd(r.es)}</td><td class="n">${r.atomix == null ? "—" : Math.round((1 - r.atomix / r.es) * 100) + "%"}</td></tr>`).join("")
      + `<tr><td>Elastic Cloud</td><td>—</td><td class="n">—</td><td>${e.nodes} × ${state.nodeRam} GB hot nodes</td><td class="n">${usd(cloud)} – ${usd(cloudHigh)}</td><td class="n"></td></tr>`;

    const withBoth = rows.filter((r) => r.atomix != null);
    if (withBoth.length) {
      const avg = withBoth.reduce((s, r) => s + (1 - r.atomix / r.es), 0) / withBoth.length;
      const yearly = withBoth.reduce((s, r) => s + (r.es - r.atomix), 0) / withBoth.length * 12;
      $("#savings").innerHTML = `<b>${Math.round(avg * 100)}% lower infrastructure cost</b>on the same providers, about ${usd(yearly)} a year on average across them. Elastic licences and Elastic Cloud are extra; Atomix pricing is a conversation, not a per-GB bill.`;
    }
    drawChart(rows, cloud);
  }

  function drawChart(rows, cloud) {
    const svgW = 640, rowH = 34, pad = { l: 120, r: 70, t: 10, b: 24 };
    const data = rows.filter((r) => r.atomix != null).map((r) => [{ k: "Atomix", v: r.atomix, name: r.name }, { k: "Elasticsearch", v: r.es, name: r.name }]);
    data.push([{ k: "Elastic Cloud", v: cloud, name: "Elastic Cloud (hosted)", cloud: true }]);
    const max = Math.max(...data.flat().map((d) => d.v)) || 1;
    const groupH = rowH * 2 + 14;
    const H = pad.t + data.reduce((s, g) => s + (g.length === 1 ? rowH + 14 : groupH), 0) + pad.b;
    const x = (v) => pad.l + (v / max) * (svgW - pad.l - pad.r);
    let y = pad.t, out = "";
    data.forEach((g) => {
      const top = y;
      g.forEach((d, i) => {
        const yy = y + i * rowH;
        const col = d.k === "Atomix" ? "var(--chart-atomix)" : "var(--chart-es)";
        out += `<rect x="${pad.l}" y="${yy + 6}" width="${Math.max(2, x(d.v) - pad.l)}" height="${rowH - 12}" rx="4" fill="${col}"><title>${d.name} · ${d.k}: ${usd(d.v)} per month</title></rect>`;
        out += `<text x="${x(d.v) + 8}" y="${yy + rowH / 2 + 4}" font-size="12" fill="#0f172a">${usd(d.v)}</text>`;
      });
      const label = g[0].name;
      out += `<text x="${pad.l - 10}" y="${top + (g.length === 1 ? rowH / 2 : rowH) + 4}" font-size="13" font-weight="600" text-anchor="end" fill="#0f172a">${label}</text>`;
      y += g.length === 1 ? rowH + 14 : groupH;
    });
    out += `<line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${H - pad.b}" stroke="#cbd5e1"/>`;
    $("#chart").innerHTML = `<svg viewBox="0 0 ${svgW} ${H}" role="img" aria-label="Monthly infrastructure cost, Atomix versus Elasticsearch, per provider">${out}</svg>`;
  }

  /* inputs */
  const epsRange = $("#eps"), epsNum = $("#eps-n");
  const logMin = Math.log(100), logMax = Math.log(50000);
  const epsFromRange = (r) => Math.round(Math.exp(logMin + (r / 1000) * (logMax - logMin)) / 10) * 10;
  const rangeFromEps = (e) => Math.round(((Math.log(Math.min(50000, Math.max(100, e))) - logMin) / (logMax - logMin)) * 1000);
  function setEps(v, fromRange) {
    state.eps = Math.max(100, Math.min(200000, Math.round(v)));
    if (!fromRange) epsRange.value = rangeFromEps(state.eps);
    epsNum.value = state.eps;
    custom(); render();
  }
  epsRange.addEventListener("input", () => setEps(epsFromRange(+epsRange.value), true));
  epsNum.addEventListener("change", () => setEps(+epsNum.value || 100));

  const bind = (id, key, parse, after) => {
    const el = $(id);
    el.addEventListener("input", () => { state[key] = parse(el.value); if (after) after(); custom(); render(); });
  };
  bind("#bytes", "bytes", (v) => Math.max(0.1, +v || 1) * 1024);
  bind("#hot", "hot", (v) => Math.max(1, +v | 0));
  bind("#warm", "warm", (v) => Math.max(0, +v | 0));
  bind("#ratio", "ratio", (v) => Math.max(1, +v || 8));
  bind("#replicas", "replicas", (v) => Math.max(0, +v | 0));
  bind("#indexFactor", "indexFactor", (v) => Math.max(0.3, +v || 1.1));
  bind("#memDisk", "memDisk", (v) => Math.max(5, +v || 30));
  bind("#nodeRam", "nodeRam", (v) => Math.max(8, +v | 0));
  bind("#cloudRate", "cloudRate", (v) => Math.max(0, +v || 0));
  bind("#eurUsd", "eurUsd", (v) => Math.max(0.5, +v || 1.1));

  const mixSel = $("#mix");
  D.mixes.forEach((m) => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.label; mixSel.appendChild(o); });
  mixSel.addEventListener("change", () => {
    const m = D.mixes.find((x) => x.id === mixSel.value);
    state.mix = m.id; state.ratio = m.ratio; state.bytes = m.bytes;
    $("#ratio").value = m.ratio; $("#bytes").value = (m.bytes / 1024).toFixed(1); $("#mix-note").textContent = m.note;
    render();
  });
  $("#mix-note").textContent = D.mixes[0].note;

  const segBtns = $$(".seg button");
  function custom() { segBtns.forEach((b) => b.classList.toggle("on", b.dataset.preset === "custom")); }
  segBtns.forEach((b) => b.addEventListener("click", () => {
    segBtns.forEach((x) => x.classList.toggle("on", x === b));
    const p = presets[b.dataset.preset];
    if (!p) { $("#adv").open = true; return; }
    state.hot = p.hot; state.warm = p.warm; $("#hot").value = p.hot; $("#warm").value = p.warm;
    state.eps = p.eps; epsRange.value = rangeFromEps(p.eps); epsNum.value = p.eps;
    render();
  }));

  // initial values
  $("#bytes").value = "1.0"; $("#hot").value = state.hot; $("#warm").value = state.warm; $("#ratio").value = state.ratio;
  $("#replicas").value = state.replicas; $("#indexFactor").value = state.indexFactor; $("#memDisk").value = state.memDisk; $("#nodeRam").value = state.nodeRam; $("#cloudRate").value = state.cloudRate; $("#eurUsd").value = state.eurUsd;
  $("#as-of").textContent = D.asOf;
  $("#sources").innerHTML = D.sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join("");
  $("#provider-notes").innerHTML = D.providers.map((p) => `<li><b>${p.name}:</b> ${p.note}</li>`).join("");
  epsRange.value = rangeFromEps(state.eps); epsNum.value = state.eps;
  render();
})();
