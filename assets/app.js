/* Atomix website: interactions and the sizing calculator. Everything the
   calculator uses comes from assets/data.js. */
(function () {
  "use strict";
  const D = window.ATOMIX_DATA;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Navigation ---------- */
  const nav = $(".nav-wrap");
  window.addEventListener("scroll", () => {
    const ids = ["features", "roadmap", "sizing", "compare", "faq"];
    let active = "";
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= 90) active = id;
    }
    $$(".nav .links a").forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + active));
  }, { passive: true });
  $(".menu-btn").addEventListener("click", () => nav.classList.toggle("open"));
  $$(".nav .links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  /* ---------- Reveal on scroll ---------- */
  document.documentElement.classList.add("js");
  const REVEAL = ".section-head, .stat, .b, .fcol, .numlist li, .road > li, .step-row, .score-row, .faq, .cta .wrap, .hero .pill-note, .hero h1, .hero .lead, .hero .actions";
  $$(REVEAL).forEach((el) => {
    el.classList.add("reveal");
    const sib = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    if (sib.length > 1) el.style.setProperty("--d", Math.min(sib.indexOf(el), 6) * 0.08 + "s");
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: "0px 0px -8% 0px" });
  $$(".reveal").forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add("in"); else io.observe(el); });

  /* ---------- Flowing contour lines (hero and closing section) ---------- */
  function contours(canvas, bandTop, bandHeight) {
    const ctx = canvas.getContext("2d");
    let w, h, t = Math.random() * 10, raf, visible = true;
    function size() { const r = canvas.parentElement.getBoundingClientRect(); w = canvas.width = r.width * devicePixelRatio; h = canvas.height = r.height * devicePixelRatio; }
    size();
    window.addEventListener("resize", size);
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const lines = 14;
      for (let i = 0; i < lines; i++) {
        const y0 = h * (bandTop + (i / lines) * bandHeight);
        const glow = i === 7;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6 * devicePixelRatio) {
          const n = Math.sin(x / (w * 0.18) + t * 0.6 + i * 0.7) * 18 + Math.sin(x / (w * 0.06) - t * 0.4 + i) * 7 + Math.sin(x / (w * 0.4) + i * 1.3) * 40;
          const y = y0 + n * devicePixelRatio;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = glow ? "rgba(96,165,250,0.9)" : "rgba(96,165,250," + (0.05 + (i / lines) * 0.08) + ")";
        ctx.lineWidth = (glow ? 1.6 : 1) * devicePixelRatio;
        if (glow) { ctx.shadowColor = "rgba(96,165,250,0.8)"; ctx.shadowBlur = 16 * devicePixelRatio; } else ctx.shadowBlur = 0;
        ctx.stroke();
      }
      t += 0.012;
      if (!reduceMotion && visible) raf = requestAnimationFrame(draw);
    }
    // Only animate while on screen.
    new IntersectionObserver((e) => { visible = e[0].isIntersecting && !document.hidden; cancelAnimationFrame(raf); if (visible) draw(); }, { threshold: 0 }).observe(canvas);
    document.addEventListener("visibilitychange", () => { visible = !document.hidden; cancelAnimationFrame(raf); if (visible) draw(); });
    draw();
  }
  $$(".hero canvas").forEach((c) => contours(c, 0.08, 0.5));
  $$(".cta canvas").forEach((c) => contours(c, 0.3, 0.5));

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

  /* ---------- Product screenshots: boxes start hidden and show once the image loads ---------- */
  $$(".shot img, .shot-art img").forEach((img) => {
    const show = () => {
      const box = img.closest(".art") || img.closest("figure") || img.closest("section");
      if (box) box.hidden = false;
      const product = $("#product");
      if (product && product.querySelector("figure:not([hidden])")) product.hidden = false;
    };
    if (img.complete && img.naturalWidth > 0) show();
    img.addEventListener("load", show);
  });

  /* ---------- FAQ: animate open and close ---------- */
  $$(".faq details").forEach((d) => {
    const sum = d.querySelector("summary");
    let running = null;
    sum.addEventListener("click", (e) => {
      e.preventDefault();
      if (running) return;
      if (reduceMotion) { d.open = !d.open; return; }
      const from = d.offsetHeight;
      const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
      if (d.open) {
        running = d.animate([{ height: from + "px" }, { height: sum.offsetHeight + "px" }], { duration: 260, easing: ease });
        running.onfinish = () => { d.open = false; running = null; };
      } else {
        d.open = true;
        const to = d.offsetHeight;
        running = d.animate([{ height: from + "px" }, { height: to + "px" }], { duration: 320, easing: ease });
        running.onfinish = () => { running = null; };
      }
    });
  });

  /* ---------- Sizing calculator ---------- */
  const state = {
    eps: 2500, bytes: 1024, hot: 90, warm: 0, mix: "mixed",
    ratio: 8, replicas: D.elastic.replicas, indexFactor: D.elastic.indexFactor, memDisk: D.elastic.memDiskRatio, warmMemDisk: D.elastic.warmMemDiskRatio,
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

  // The days Atomix keeps on local disk go on Elasticsearch hot nodes; the
  // days it keeps in object storage go on denser warm nodes, as Elastic's
  // hot-warm architecture would do, so the comparison is like for like.
  function esSpec(a) {
    const E = D.elastic;
    const perDay = a.rawDay * state.indexFactor * (1 + state.replicas) * E.headroom;
    const hotDisk = perDay * state.hot, warmDisk = perDay * state.warm;
    const hotNodes = Math.ceil(hotDisk / (state.nodeRam * state.memDisk));
    const warmNodes = Math.ceil(warmDisk / (state.nodeRam * state.warmMemDisk));
    const nodes = Math.max(E.minNodes, hotNodes + warmNodes);
    const diskGB = hotDisk + warmDisk;
    return { diskGB, nodes, hotNodes: Math.max(E.minNodes - warmNodes, hotNodes), warmNodes, ram: nodes * state.nodeRam, vcpu: nodes * E.nodeVcpu, perNodeDisk: diskGB / nodes };
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

    // Providers, cheapest first.
    const ranked = costs.slice().sort((x, y) => (x.atomix ? x.atomix.total : Infinity) - (y.atomix ? y.atomix.total : Infinity));
    $("#providers").innerHTML = ranked.map((c, i) => {
      const p = c.p;
      if (!c.atomix) {
        return `<div class="prow"><span class="rank">${i + 1}</span><div class="who"><b>${p.name}</b><span>No single server is large enough</span></div><span class="price">—</span><div class="warn">${c.note}</div></div>`;
      }
      const A = c.atomix;
      const parts = [`server ${usd(A.compute)}`];
      if (A.extraDisk > 0) parts.push(`extra disk ${fmtGB(A.extraDisk)} ${usd(A.disk)}`);
      if (a.s3GB > 0) parts.push(`object storage ${usd(A.object)}`);
      return `<div class="prow${i === 0 ? " best" : ""}">
        <span class="rank">${i + 1}</span>
        <div class="who"><b>${p.name}</b>${i === 0 ? "<em>Lowest</em>" : ""}<span>${A.plan.name} · ${A.plan.vcpu} vCPU · ${A.plan.ram} GB RAM${A.plan.disk ? " · " + fmtGB(A.plan.disk) + " NVMe" : ""}</span></div>
        <span class="price">${usd(A.total)}<small>/mo</small></span>
        <div class="parts">${parts.join(" + ")}${p.currency === "EUR" ? " · converted from EUR" : ""}</div>
        ${A.network ? `<div class="warn">No plan here has ${fmtGB(a.localGB)} of local NVMe; the rest is network storage, so searches over it are slower.</div>` : ""}
      </div>`;
    }).join("");

    // Elasticsearch
    $("#e-nodes").textContent = e.nodes;
    $("#e-split").textContent = e.warmNodes > 0 ? `${e.hotNodes} hot, ${e.warmNodes} warm` : "all hot";
    $("#e-ram").textContent = fmtN(e.ram);
    $("#e-disk").innerHTML = fmtGB(e.diskGB).replace(/ (GB|TB)/, " <small>$1</small>");
    $("#e-vcpu").textContent = fmtN(e.vcpu);
    const cloud = e.ram * 730 * state.cloudRate;
    const cloudHigh = e.ram * 730 * D.elastic.cloudRateHighPerGbRamHour;
    $("#e-cloud").textContent = usd(cloud) + " – " + usd(cloudHigh);

    const rows = costs.map((c) => ({ name: c.p.name, atomix: c.atomix ? c.atomix.total : null, es: c.es.total, plan: c.atomix ? c.atomix.plan.name : "—", esPlan: e.nodes + " × " + c.es.node.name }));
    $("#cost-rows").innerHTML = rows.map((r) => `<tr><td>${r.name}</td><td class="n">${r.atomix == null ? "—" : usd(r.atomix)}</td><td class="n">${usd(r.es)}</td><td class="n">${r.atomix == null ? "—" : Math.round((1 - r.atomix / r.es) * 100) + "%"}</td></tr>`).join("")
      + `<tr><td>Elastic Cloud (hosted)</td><td class="n">—</td><td class="n">${usd(cloud)} – ${usd(cloudHigh)}</td><td class="n"></td></tr>`;

    const withBoth = rows.filter((r) => r.atomix != null);
    if (withBoth.length) {
      const avg = withBoth.reduce((s, r) => s + (1 - r.atomix / r.es), 0) / withBoth.length;
      const yearly = withBoth.reduce((s, r) => s + (r.es - r.atomix), 0) / withBoth.length * 12;
      $("#savings").innerHTML = `<b>${Math.round(avg * 100)}% less to run</b>About ${usd(yearly)} a year saved on the same providers, before Elastic licences.`;
    }
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
  bind("#warmMemDisk", "warmMemDisk", (v) => Math.max(5, +v || 160));
  bind("#nodeRam", "nodeRam", (v) => Math.max(8, +v | 0));
  bind("#cloudRate", "cloudRate", (v) => Math.max(0, +v || 0));
  bind("#eurUsd", "eurUsd", (v) => Math.max(0.5, +v || 1.1));

  const mixSel = $("#mix");
  D.mixes.forEach((m) => { const o = document.createElement("option"); o.value = m.id; o.textContent = m.label; mixSel.appendChild(o); });
  // Custom dropdown (the native select only holds the value).
  (function dropdown() {
    const dd = $("#mix-dd"), btn = $(".dd-btn", dd), menu = $(".dd-menu", dd), label = $("#mix-value");
    D.mixes.forEach((m) => { const li = document.createElement("li"); li.setAttribute("role", "option"); li.dataset.id = m.id; li.innerHTML = `<span>${m.label}</span><small>${m.ratio} : 1</small>`; menu.appendChild(li); });
    const items = $$("li", menu);
    let focus = 0;
    const open = (yes) => { menu.hidden = !yes; btn.setAttribute("aria-expanded", yes ? "true" : "false"); if (yes) { focus = items.findIndex((li) => li.dataset.id === mixSel.value); items.forEach((li, i) => li.classList.toggle("focus", i === focus)); } };
    // `focus` is false for the initial selection: focusing the button would
    // scroll the page to the calculator on load.
    const choose = (id, focus = true) => { mixSel.value = id; label.textContent = D.mixes.find((m) => m.id === id).label; items.forEach((li) => li.setAttribute("aria-selected", li.dataset.id === id ? "true" : "false")); mixSel.dispatchEvent(new Event("change")); open(false); if (focus) btn.focus({ preventScroll: true }); };
    btn.addEventListener("click", () => open(menu.hidden));
    items.forEach((li) => li.addEventListener("click", () => choose(li.dataset.id)));
    btn.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (menu.hidden) open(true); focus = (focus + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach((li, i) => li.classList.toggle("focus", i === focus)); }
      else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (menu.hidden) open(true); else choose(items[focus].dataset.id); }
      else if (e.key === "Escape") open(false);
    });
    document.addEventListener("click", (e) => { if (!dd.contains(e.target)) open(false); });
    choose(D.mixes[0].id, false);
  })();
  mixSel.addEventListener("change", () => {
    const m = D.mixes.find((x) => x.id === mixSel.value);
    state.mix = m.id; state.ratio = m.ratio; state.bytes = m.bytes;
    $("#ratio").value = m.ratio; $("#bytes").value = (m.bytes / 1024).toFixed(1); $("#mix-note").textContent = m.note;
    render();
  });
  $("#mix-note").textContent = D.mixes[0].note;

  const presetBtns = $$(".presets button");
  // Editing a number makes the choice "Custom".
  function custom() { presetBtns.forEach((b) => b.classList.toggle("on", b.dataset.preset === "custom")); }
  presetBtns.forEach((b) => b.addEventListener("click", () => {
    presetBtns.forEach((x) => x.classList.toggle("on", x === b));
    const p = presets[b.dataset.preset];
    if (!p) { $("#tune").open = true; return; }
    state.hot = p.hot; state.warm = p.warm; $("#hot").value = p.hot; $("#warm").value = p.warm;
    state.eps = p.eps; epsRange.value = rangeFromEps(p.eps); epsNum.value = p.eps;
    render();
  }));

  // initial values
  $("#bytes").value = "1.0"; $("#hot").value = state.hot; $("#warm").value = state.warm; $("#ratio").value = state.ratio;
  $("#replicas").value = state.replicas; $("#indexFactor").value = state.indexFactor; $("#memDisk").value = state.memDisk; $("#warmMemDisk").value = state.warmMemDisk; $("#nodeRam").value = state.nodeRam; $("#cloudRate").value = state.cloudRate; $("#eurUsd").value = state.eurUsd;
  $("#as-of").textContent = D.asOf;
  $("#sources").innerHTML = D.sources.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join("");
  $("#provider-notes").innerHTML = D.providers.map((p) => `<li><b>${p.name}:</b> ${p.note}</li>`).join("");
  epsRange.value = rangeFromEps(state.eps); epsNum.value = state.eps;
  render();
})();
