/* Research Genius Hub: Samples page (search, filters, list, 50/100 per page, pay, access code, read online / download). */
(function () {
  const C = window.RGH || {}, SB = C.supabase || {}, root = document.getElementById("sample-app");
  if (!root || !SB.url || !SB.anonKey) return;
  const esc = t => String(t == null ? "" : t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);
  const paras = t => String(t || "").split(/\n+/).map(x => x.trim()).filter(Boolean).map(x => "<p>" + esc(x) + "</p>").join("");
  const H = { apikey: SB.anonKey, Authorization: "Bearer " + SB.anonKey, "Content-Type": "application/json" };
  const sess = (() => { try { let v = sessionStorage.getItem("rgh_sess"); if (!v) { v = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); sessionStorage.setItem("rgh_sess", v); } return v; } catch (e) { return String(Math.random()).slice(2); } })();
  const mineGet = () => { try { return JSON.parse(localStorage.getItem("rgh_mine") || "{}"); } catch (e) { return {}; } };
  const mineSet = (id, v) => { try { const m = mineGet(); m[id] = Object.assign(m[id] || {}, v); localStorage.setItem("rgh_mine", JSON.stringify(m)); } catch (e) {} };
  const css = document.createElement("style");
  css.textContent = `.sa-bar{display:grid;grid-template-columns:2fr 1fr 1fr 110px;gap:10px;margin-bottom:12px}@media(max-width:760px){.sa-bar{grid-template-columns:1fr 1fr}.sa-bar .sa-q{grid-column:1/-1}}
  .sa-bar input,.sa-bar select{width:100%;padding:11px;border:1.5px solid var(--ink,#0F1B33);border-radius:8px;font:inherit;background:#fff}
  .sa-count{margin:6px 0 10px;color:var(--ink2,#555)}.sa-list{border:1px solid #d9dee8;border-radius:10px;background:#fff;overflow:hidden}
  .sa-row{border-bottom:1px solid #e6e9f0}.sa-row:last-child{border-bottom:0}
  .sa-sum{display:grid;grid-template-columns:3fr 2fr 80px 24px;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:0;padding:12px 14px;font:inherit;cursor:pointer;color:inherit}
  .sa-sum:hover,.sa-row.open .sa-sum{background:#f4f6fb}.sa-sum b{font-weight:700}.sa-sum .lv{color:var(--ink2,#555);font-size:.92rem}.sa-sum .pg{font-size:.92rem;white-space:nowrap}
  @media(max-width:620px){.sa-sum{grid-template-columns:1fr 60px 18px}.sa-sum .lv{grid-column:1/2;grid-row:2}.sa-sum .pg{grid-row:1;grid-column:2}}
  .sa-det{padding:6px 16px 18px;display:none;background:#fbfcfe}.sa-row.open .sa-det{display:block}
  .sa-det label.small{display:block;margin-top:8px}.sa-det input,.sa-det select{padding:9px;border:1.5px solid var(--ink,#0F1B33);border-radius:8px;font:inherit;max-width:100%}
  .sa-pager{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-top:12px}
  .sa-modal{position:fixed;inset:0;background:rgba(10,18,36,.72);z-index:200;display:flex;align-items:center;justify-content:center;padding:10px}
  .sa-box{background:#fff;border-radius:12px;width:min(960px,100%);height:min(92vh,100%);display:flex;flex-direction:column;overflow:hidden}
  .sa-box header{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #ddd}
  .sa-box iframe{flex:1;border:0;width:100%}.sa-box .txt{flex:1;overflow:auto;padding:16px 20px;font-family:Georgia,serif;line-height:1.6}`;
  document.head.appendChild(css);

  let all = [], st = { q: "", level: "", field: "", per: 50, page: 1 };
  const lvSet = s => { if (s.all_levels || /all levels|any level/i.test(s.level || "")) return ["undergraduate", "master", "phd"]; const t = ((s.levels || []).join(" ") + " " + (s.level || "")).toLowerCase(), o = []; if (/undergrad|bachelor|bsc|year|college/.test(t)) o.push("undergraduate"); if (/master|postgrad|msc|mba/.test(t)) o.push("master"); if (/phd|doctor/.test(t)) o.push("phd"); return o; };
  const levelText = s => s.all_levels ? "All levels" : ((s.levels && s.levels.length) ? s.levels.join(", ") : (s.level || ""));
  const stem = w => w.replace(/'s?$/, "").replace(/s$/, "");
  function hay(s) {
    let h = [s.title, s.subject, levelText(s), s.level, s.style].join(" ").toLowerCase().replace(/['’]/g, "");
    const lv = lvSet(s).join(" ") + " " + levelText(s).toLowerCase();
    if (/master|postgrad|msc|mba/.test(lv)) h += " masters master postgraduate msc";
    if (/phd|doctor/.test(lv)) h += " phd doctoral doctorate";
    if (/undergrad|bachelor|bsc|year/.test(lv)) h += " undergraduate bachelor bsc degree";
    if (s.all_levels) h += " all levels any level";
    return h;
  }
  const levelOK = (s, v) => !v || (s.all_levels || lvSet(s).includes(v) || !lvSet(s).length);
  function filtered() {
    const toks = st.q.toLowerCase().replace(/['’]/g, "").split(/[\s,]+/).filter(Boolean).map(stem);
    return all.filter(s => {
      const h = s._h; if (st.field && (s.subject || "") !== st.field) return false;
      if (!levelOK(s, st.level)) return false; return toks.every(t => h.includes(t));
    });
  }
  async function load() {
    root.innerHTML = '<p class="muted">Loading samples...</p>';
    try {
      const r = await fetch(SB.url + "/rest/v1/samples?select=*&order=created_at.desc", { headers: H });
      if (!r.ok) throw new Error(); all = (await r.json()).filter(s => s.published !== false);
    } catch (e) { root.innerHTML = '<p class="muted">Samples could not load. Refresh, or email <a href="mailto:' + C.email + '">' + C.email + "</a>.</p>"; return; }
    if (!all.length) { root.innerHTML = '<p class="muted">Samples are being added. Email <a href="mailto:' + C.email + '">' + C.email + "</a> to ask for an introduction in your subject.</p>"; return; }
    all.forEach(s => { s._h = hay(s); });
    const fields = [...new Set(all.map(s => s.subject).filter(Boolean))].sort();
    root.innerHTML = `<div class="sa-bar"><input class="sa-q" type="search" placeholder="Search: name, level (Masters, PhD), or subject" aria-label="Search samples">
      <select data-level aria-label="Level"><option value="">All levels</option><option value="undergraduate">Undergraduate</option><option value="master">Masters</option><option value="phd">PhD</option></select>
      <select data-field aria-label="Field"><option value="">All fields</option>${fields.map(f => `<option>${esc(f)}</option>`).join("")}</select>
      <select data-per aria-label="Per page"><option value="50">50 per page</option><option value="100">100 per page</option></select></div>
      <div class="sa-count" aria-live="polite"></div><div class="sa-list"></div><div class="sa-pager"></div>`;
    root.querySelector(".sa-q").oninput = e => { st.q = e.target.value; st.page = 1; draw(); };
    root.querySelector("[data-level]").onchange = e => { st.level = e.target.value; st.page = 1; draw(); };
    root.querySelector("[data-field]").onchange = e => { st.field = e.target.value; st.page = 1; draw(); };
    root.querySelector("[data-per]").onchange = e => { st.per = +e.target.value; st.page = 1; draw(); };
    draw();
    const m = location.hash.match(/open=([0-9a-f-]{36})/i); if (m) openById(m[1]);
  }
  function draw(keepOpen) {
    const list = filtered(), pages = Math.max(1, Math.ceil(list.length / st.per)); st.page = Math.min(st.page, pages);
    const slice = list.slice((st.page - 1) * st.per, st.page * st.per);
    root.querySelector(".sa-count").textContent = list.length + " sample" + (list.length === 1 ? "" : "s") + (st.q || st.level || st.field ? " match your search" : "");
    const box = root.querySelector(".sa-list");
    box.innerHTML = slice.length ? slice.map(s => `<div class="sa-row" data-id="${s.id}"><button class="sa-sum" aria-expanded="false"><b>${esc(s.title)}</b><span class="lv">${esc(levelText(s))}</span><span class="pg">${s.pages} pages</span><span aria-hidden="true">&#9662;</span></button><div class="sa-det"></div></div>`).join("") : '<p class="muted" style="padding:16px">No samples match. Try fewer words, or ask us for one in your subject.</p>';
    box.querySelectorAll(".sa-row").forEach(row => row.querySelector(".sa-sum").onclick = () => toggle(row));
    const pg = root.querySelector(".sa-pager");
    pg.innerHTML = pages > 1 ? `<button class="btn sm alt" data-p="-1" ${st.page === 1 ? "disabled" : ""}>Previous</button><span>Page ${st.page} of ${pages}</span><button class="btn sm alt" data-p="1" ${st.page === pages ? "disabled" : ""}>Next</button>` : "";
    pg.querySelectorAll("[data-p]").forEach(b => b.onclick = () => { st.page += +b.dataset.p; draw(); window.scrollTo({ top: root.offsetTop - 80, behavior: "smooth" }); });
  }
  function toggle(row, forceOpen) {
    const open = forceOpen || !row.classList.contains("open");
    row.classList.toggle("open", open); row.querySelector(".sa-sum").setAttribute("aria-expanded", open);
    if (open && !row.querySelector(".sa-det").dataset.built) { build(row); row.querySelector(".sa-det").dataset.built = 1; }
  }
  function openById(id) {
    const list = filtered(), i = list.findIndex(s => s.id === id); if (i < 0) return;
    st.page = Math.floor(i / st.per) + 1; draw();
    const row = root.querySelector(`.sa-row[data-id="${id}"]`); if (!row) return; toggle(row, true);
    const d = row.querySelector("[data-paid]"); if (d) d.open = true; row.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function build(row) {
    const s = all.find(x => x.id === row.dataset.id), free = s.free_pages || 1, paid = Math.max(1, s.pages - free), rate = Number(s.price_per_page || 2), mine = mineGet()[s.id] || {};
    const pay = (C.manualPay || []).map(m => "<li><b>" + esc(m.label) + ":</b> " + m.lines.map(l => esc(l[0]) + " " + esc(l[1])).join(", ") + "</li>").join("");
    const det = row.querySelector(".sa-det"), def = Math.min(2, paid);
    det.innerHTML = `<p class="small muted" style="margin:10px 0">${esc(s.subject || "")} · ${esc(levelText(s))} · ${s.pages} pages · ${esc(s.style || "")} referencing</p>
      ${s.intro ? `<details class="intro"><summary>Read the introduction (free)</summary>${paras(s.intro)}</details>` : ""}
      <div class="locked"><strong>Get the full sample</strong> <span class="small muted">${money(rate)} per page. ${paid} more page${paid > 1 ? "s" : ""} available after the free page${free > 1 ? "s" : ""}.</span>
        <ol class="small" style="margin:6px 0;padding-left:18px"><li>Choose how many pages</li><li>Pay with the details below</li><li>Send your email and payment reference</li><li>When we confirm, your access code is emailed to you and appears in your account</li></ol>
        <details class="intro"><summary>Payment details</summary><ul class="small" style="margin:8px 0">${pay}</ul></details>
        <label class="small">Pages to unlock</label><input type="number" data-n min="1" max="${paid}" value="${def}" style="max-width:110px"> <strong data-price>${money(def * rate)}</strong>
        <label class="small">I will mostly</label><select data-f><option value="read">Read online (2 sessions)</option><option value="download">Download (once)</option></select>
        <label class="small">Your email (the code is sent here)</label><input type="email" data-e autocomplete="email" placeholder="you@example.com" value="${esc(mine.email || "")}" style="width:100%">
        <label class="small">Payment reference</label><input data-r placeholder="PayPal or M-Pesa transaction ID" autocomplete="off" style="width:100%">
        <p><button class="btn sm" data-req>Send for confirmation</button></p><div data-out role="status"></div></div>
      <details class="intro" data-paid ${mine.email ? "open" : ""}><summary>Already paid? Open my pages</summary>
        <p class="small muted">Enter your email and the access code we sent you. Reading online: 2 sessions (each reopening after closing the tab counts as one). Download: once, then the code ends.</p>
        <label class="small">Your email</label><input type="email" data-e2 value="${esc(mine.email || "")}" style="width:100%"><label class="small">Access code</label><input data-c autocapitalize="characters" autocomplete="off" style="max-width:220px;text-transform:uppercase">
        <p><button class="btn sm" data-read>Read online</button> <button class="btn sm alt" data-dl>Download</button></p><div data-msg role="status"></div></details>`;
    const q = x => det.querySelector(x), n = () => Math.min(paid, Math.max(1, Math.floor(Number(q("[data-n]").value) || 1)));
    q("[data-n]").oninput = () => { q("[data-price]").textContent = money(n() * rate); };
    q("[data-req]").onclick = async () => {
      const out = q("[data-out]"), email = q("[data-e]").value.trim(), ref = q("[data-r]").value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { out.innerHTML = '<p class="err">Enter a valid email address.</p>'; return; }
      if (!ref) { out.innerHTML = '<p class="err">Enter your payment reference.</p>'; return; }
      out.textContent = "Sending...";
      try {
        const r = await fetch(SB.url + "/rest/v1/rpc/request_sample", { method: "POST", headers: H, body: JSON.stringify({ p_sample: s.id, p_email: email, p_pages: n(), p_format: q("[data-f]").value, p_reference: ref }) });
        if (!r.ok) { let m = "Could not send. Try again."; try { m = (await r.json()).message || m; } catch (e) {} throw new Error(m); }
        mineSet(s.id, { email }); q("[data-e2]").value = email;
        try { fetch("https://formsubmit.co/ajax/" + C.email, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ _subject: "Sample request: " + email, _captcha: "false", _template: "box", message: email + " paid for a sample. Confirm in Admin > Sample access.\n\nSample: " + s.title + "\nPages: " + n() + " (" + money(n() * rate) + ")\nReference: " + ref }) }).catch(() => {}); } catch (e) {}
        out.innerHTML = '<p class="ok"><b>Received.</b> Once we confirm your payment, your access code is emailed to <b>' + esc(email) + '</b> and also appears in your <a href="account.html">account</a> (sign in with the same email). Then come back here and use <b>Already paid?</b></p>';
      } catch (e) { out.innerHTML = '<p class="err">' + esc(e.message) + "</p>"; }
    };
    const call = async action => {
      const email = q("[data-e2]").value.trim(), code = q("[data-c]").value.trim(), m = q("[data-msg]");
      if (!email || !code) { m.innerHTML = '<p class="err">Enter your email and access code.</p>'; return null; }
      m.textContent = "Checking...";
      const r = await fetch(SB.url + "/functions/v1/rgh-sample", { method: "POST", headers: H, body: JSON.stringify({ action, sample_id: s.id, email, code, session: sess }) });
      if (!r.ok) { let t = "Could not open. Try again."; try { t = (await r.json()).error || t; } catch (e) {} m.innerHTML = '<p class="' + (r.status === 202 ? "" : "err") + '">' + esc(t) + "</p>"; return null; }
      m.textContent = ""; return r;
    };
    q("[data-read]").onclick = async () => {
      const r = await call("view"); if (!r) return; const left = r.headers.get("x-opens-left");
      const kind = r.headers.get("x-kind"), modal = document.createElement("div"); modal.className = "sa-modal";
      let body, url = "";
      if (kind === "text") { const j = await r.json(); body = `<div class="txt"><h2>${esc(j.title)}</h2>${paras(j.text)}</div>`; }
      else { url = URL.createObjectURL(await r.blob()); body = `<iframe src="${url}" title="${esc(s.title)}"></iframe>`; }
      modal.innerHTML = `<div class="sa-box"><header><strong>${esc(s.title)}</strong><span class="small muted">Online readings left after this one: ${esc(left)}. Closing the tab ends this session.</span><span>${url ? `<a class="btn sm alt" target="_blank" rel="noopener" href="${url}">Open full screen</a> ` : ""}<button class="btn sm" data-x>Close</button></span></header>${body}</div>`;
      document.body.appendChild(modal); modal.querySelector("[data-x]").onclick = () => { modal.remove(); if (url) URL.revokeObjectURL(url); };
    };
    q("[data-dl]").onclick = async () => {
      if (!confirm("Download now? You can download only once, and the code stops working after this.")) return;
      const r = await call("download"); if (!r) return; const kind = r.headers.get("x-kind"), a = document.createElement("a"), nm = (s.title || "sample").replace(/[^\w\- ]+/g, "");
      if (kind === "text") { const j = await r.json(); a.href = URL.createObjectURL(new Blob([j.title + "\n\n" + j.text], { type: "text/plain" })); a.download = nm + ".txt"; }
      else { a.href = URL.createObjectURL(await r.blob()); a.download = nm + ".pdf"; }
      document.body.appendChild(a); a.click(); a.remove(); q("[data-msg]").innerHTML = '<p class="ok">Downloaded. This code has now ended.</p>';
    };
  }
  load();
})();
