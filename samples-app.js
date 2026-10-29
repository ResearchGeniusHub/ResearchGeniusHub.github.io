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
  .sa-sum{display:grid;grid-template-columns:3fr 2fr 80px auto 24px;gap:10px;align-items:center;width:100%;text-align:left;background:none;border:0;padding:12px 14px;font:inherit;cursor:pointer;color:inherit}
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

  /* Shows a PDF page by page (same look as the original document: images, figures, tables). Falls back to the browser's own viewer. */
  let pdfLib = null;
  const loadPdfjs = () => pdfLib ? Promise.resolve(pdfLib) : new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"; sc.onload = () => { try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"; pdfLib = window.pdfjsLib; res(pdfLib); } catch (e) { rej(e); } }; sc.onerror = rej; document.head.appendChild(sc); });
  async function showPdf(host, blob) {
    host.innerHTML = '<p class="muted">Loading pages...</p>';
    try {
      const L = await loadPdfjs(), doc = await L.getDocument({ data: await blob.arrayBuffer() }).promise; host.innerHTML = "";
      const w = Math.max(280, (host.clientWidth || 600) - 8), dpr = Math.min(2, window.devicePixelRatio || 1);
      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i), v1 = pg.getViewport({ scale: 1 }), sc = (w / v1.width) * dpr, vp = pg.getViewport({ scale: sc }), cv = document.createElement("canvas");
        cv.width = vp.width; cv.height = vp.height; cv.style.cssText = "width:100%;height:auto;border:1px solid #ccc;margin:0 0 10px;display:block;background:#fff"; host.appendChild(cv);
        await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      }
    } catch (e) { const u = URL.createObjectURL(blob); host.innerHTML = '<iframe src="' + u + '" title="Document" style="width:100%;height:75vh;border:0"></iframe><p class="small muted"><a href="' + u + '" target="_blank" rel="noopener">Open in a new tab</a></p>'; }
  }
  function openViewer(title, note, blob, extra) {
    const modal = document.createElement("div"); modal.className = "sa-modal";
    modal.innerHTML = '<div class="sa-box"><header><strong></strong><span class="small muted"></span><span><button class="btn sm" data-x>Close</button></span></header><div class="txt" data-host style="font-family:inherit;padding:12px"></div></div>';
    modal.querySelector("strong").textContent = title; modal.querySelector(".small").textContent = note || ""; document.body.appendChild(modal);
    modal.querySelector("[data-x]").onclick = () => modal.remove(); if (blob) showPdf(modal.querySelector("[data-host]"), blob); return modal;
  }

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
    const lm = location.hash.match(/open=([0-9a-f-]{36})/i), tm = location.hash.match(/[#&]t=([0-9a-f-]{36})/i);
    let linkNote = "";
    if (lm && tm) {
      try {
        const r2 = await fetch(SB.url + "/rest/v1/rpc/sample_by_link", { method: "POST", headers: H, body: JSON.stringify({ p_sample: lm[1], p_token: tm[1] }) });
        const j = await r2.json().catch(() => ({}));
        if (!r2.ok) throw new Error(j.message || "This link is not valid.");
        j._linked = true; j._token = tm[1]; j._expires = j.expires_at; j.file_path = j.has_file ? "linked" : null;
        all = all.filter(x => x.id !== j.id); all.unshift(j);
      } catch (e) { linkNote = '<p class="err">' + esc(e.message || "This link is not valid.") + ' Email <a href="mailto:' + C.email + '">' + C.email + "</a> for a new one.</p>"; }
    }
    const linkedNow = all.find(x => x._linked);
    const banner = linkNote || (linkedNow ? '<div class="panel" style="margin:0 0 12px;padding:12px"><strong>Your sample is open.</strong> Read the introduction, choose the pages you want, pay for them and send your payment reference. When we confirm, your access code is emailed to you and shows in your account. This link works until ' + esc(new Date(linkedNow._expires).toDateString()) + '.</div>' : "");
    if (!all.length) { root.innerHTML = banner + '<p class="muted">Samples are being added. Email <a href="mailto:' + C.email + '">' + C.email + "</a> to ask for an introduction in your subject.</p>"; return; }
    all.forEach(s => { s._h = hay(s); });
    const fields = [...new Set(all.map(s => s.subject).filter(Boolean))].sort();
    root.innerHTML = banner + `<button type="button" class="sa-reqbtn" style="display:block;width:100%;background:#0F1B33;color:#fff;border:0;border-radius:10px;padding:16px;font:inherit;font-size:1.2rem;font-weight:700;cursor:pointer;margin:0 0 12px">+ Request New Sample</button>
      <form class="sa-req panel" hidden novalidate style="margin:0 0 14px;display:grid;gap:10px">
        <p class="small muted" style="margin:0">Tell us what you need. We reply by email. If we have the sample, we email you when it is uploaded and how to get it.</p>
        <label class="small">Name<input name="yname" maxlength="120" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></label>
        <label class="small">Your email (so we can reply)<input name="yemail" type="email" maxlength="160" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></label>
        <label class="small">Field or subject<input name="subject" maxlength="120" placeholder="e.g. Nursing" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></label>
        <label class="small">Sample name or title wanted (optional)<input name="stitle" maxlength="160" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></label>
        <fieldset style="border:0;padding:0;margin:0"><legend class="small">Level</legend><label style="display:inline-block;margin-right:12px;font-weight:400"><input type="checkbox" name="lvl" value="Undergraduate"> Undergraduate</label><label style="display:inline-block;margin-right:12px;font-weight:400"><input type="checkbox" name="lvl" value="Masters"> Masters</label><label style="display:inline-block;font-weight:400"><input type="checkbox" name="lvl" value="PhD"> PhD</label></fieldset>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="small">Referencing style<input name="sref" value="Harvard" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></label><label class="small">Pages needed<input name="spages" type="number" min="1" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></label></div>
        <label class="small">Deadline (optional)<input name="sdeadline" maxlength="60" placeholder="e.g. 14 November" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></label>
        <label class="small">Describe what you need (at least 20 characters)<textarea name="sdesc" rows="4" maxlength="1500" style="width:100%;padding:10px;border:1.5px solid #0F1B33;border-radius:8px;font:inherit"></textarea></label>
        <p class="err" role="alert" style="margin:0"></p><p class="small" data-ok role="status" style="margin:0"></p>
        <button class="btn" type="submit">Send request</button>
      </form>
      <div class="sa-bar"><input class="sa-q" type="search" placeholder="Search: name, level (Masters, PhD), or subject" aria-label="Search samples">
      <select data-level aria-label="Level"><option value="">All levels</option><option value="undergraduate">Undergraduate</option><option value="master">Masters</option><option value="phd">PhD</option></select>
      <select data-field aria-label="Field"><option value="">All fields</option>${fields.map(f => `<option>${esc(f)}</option>`).join("")}</select>
      <select data-per aria-label="Per page"><option value="50">50 per page</option><option value="100">100 per page</option></select></div>
      <div class="sa-count" aria-live="polite"></div><div class="sa-list"></div><div class="sa-pager"></div>`;
    root.querySelector(".sa-q").oninput = e => { st.q = e.target.value; st.page = 1; draw(); };
    const rq = root.querySelector(".sa-req"), rqBtn = root.querySelector(".sa-reqbtn");
    rqBtn.onclick = () => { rq.hidden = !rq.hidden; rqBtn.textContent = rq.hidden ? "+ Request New Sample" : "Hide the request form"; };
    rq.addEventListener("submit", async e => {
      e.preventDefault();
      const err = rq.querySelector(".err"), ok = rq.querySelector("[data-ok]"), btn = rq.querySelector("button[type=submit]"), g = n => rq.querySelector("[name=" + n + "]");
      err.textContent = ""; ok.textContent = "";
      const yname = g("yname").value.trim(), yemail = g("yemail").value.trim(), subject = g("subject").value.trim(), desc = g("sdesc").value.trim();
      if (yname.length < 2) return err.textContent = "Please add your name.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(yemail)) return err.textContent = "Please add a valid email so we can reply.";
      if (subject.length < 2) return err.textContent = "Please add your field or subject.";
      if (desc.length < 20) return err.textContent = "Please describe what you need (at least 20 characters).";
      const levels = Array.from(rq.querySelectorAll("[name=lvl]:checked")).map(x => x.value).join(", ");
      const details = "Sample wanted: " + (g("stitle").value.trim() || "(not named)") + "\nReferencing: " + (g("sref").value.trim() || "not stated") + "\nPages: " + (g("spages").value || "not stated") + "\n\n" + desc;
      btn.disabled = true;
      try {
        const r = await fetch(SB.url + "/rest/v1/field_requests", { method: "POST", headers: Object.assign({}, H, { Prefer: "return=minimal" }), body: JSON.stringify({ name: yname, email: yemail, field: subject, level: levels || "Not stated", deadline: g("sdeadline").value.trim(), details }) });
        if (!r.ok) throw new Error("error " + r.status);
        rq.reset(); g("sref").value = "Harvard"; ok.textContent = "Thank you. We have your request and will reply by email.";
      } catch (x) { err.textContent = "Not sent: " + (x.message || x) + ". Please try again, or email " + C.email + "."; }
      btn.disabled = false;
    });
    root.querySelector("[data-level]").onchange = e => { st.level = e.target.value; st.page = 1; draw(); };
    root.querySelector("[data-field]").onchange = e => { st.field = e.target.value; st.page = 1; draw(); };
    root.querySelector("[data-per]").onchange = e => { st.per = +e.target.value; st.page = 1; draw(); };
    draw();
    const m = location.hash.match(/open=([0-9a-f-]{36})/i); if (m) openById(m[1]);
  }
  // Opens the free pages straight from the list, without expanding the sample. Same pages as inside the row.
  async function previewFree(s, anchor) {
    const label = anchor.textContent; anchor.textContent = "Opening...";
    try {
      const r = await fetch(SB.url + "/functions/v1/super-worker", { method: "POST", headers: H, body: JSON.stringify({ action: "preview", sample_id: s.id, token: s._token || "" }) });
      if (!r.ok) { let m = "Error " + r.status; try { m = (await r.json()).error || m; } catch (x) {} throw new Error(m); }
      const b = await r.blob(); anchor.textContent = label;
      openViewer(s.title + " (free pages)", "Free preview", b);
    } catch (e) { anchor.textContent = label; alert("The free pages could not open: " + (e.message || "please try again.")); }
  }
  function draw(keepOpen) {
    const list = filtered(), pages = Math.max(1, Math.ceil(list.length / st.per)); st.page = Math.min(st.page, pages);
    const slice = list.slice((st.page - 1) * st.per, st.page * st.per);
    root.querySelector(".sa-count").textContent = list.length + " sample" + (list.length === 1 ? "" : "s") + (st.q || st.level || st.field ? " match your search" : "");
    const box = root.querySelector(".sa-list");
    box.innerHTML = slice.length ? slice.map(s => `<div class="sa-row" data-id="${s.id}"><button class="sa-sum" aria-expanded="false"><b>${esc(s.title)}</b><span class="lv">${esc(levelText(s))}</span><span class="pg">${s.pages} pages</span>${s.file_path ? '<span class="sa-prev" role="button" tabindex="0" aria-label="Preview the free pages" style="font-size:.85rem;border:1.5px solid #0F1B33;border-radius:999px;padding:3px 10px;white-space:nowrap">Preview</span>' : ""}<span aria-hidden="true">&#9662;</span></button><div class="sa-det"></div></div>`).join("") : '<p class="muted" style="padding:16px">No samples match. Try fewer words, or ask us for one in your subject.</p>';
    box.querySelectorAll(".sa-row").forEach(row => row.querySelector(".sa-sum").onclick = () => toggle(row));
    box.querySelectorAll(".sa-prev").forEach(p => {
      const open = e => { e.preventDefault(); e.stopPropagation(); const s = all.find(x => x.id === p.closest(".sa-row").dataset.id); if (s) previewFree(s, p); };
      p.onclick = open; p.onkeydown = e => { if (e.key === "Enter" || e.key === " ") open(e); };
    });
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
    const parseR = t => { const set = new Set(); String(t || "").split(",").forEach(part => { const m = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) return; const x = +m[1], y = m[2] ? +m[2] : x; for (let i = Math.min(x, y); i <= Math.max(x, y) && set.size < 2000; i++) set.add(i); }); return [...set]; };
    const pagesInput = '<label class="small">Pages you want (for example 14-20, or 3,5,9-10)</label><input data-ranges placeholder="14-20" autocomplete="off" style="max-width:260px"> <strong data-price></strong><p class="small muted" style="margin:6px 0">Pages you already have are not charged again. Pages 1 to ' + free + ' are free to read.</p>';
    det.innerHTML = `<p class="small muted" style="margin:10px 0">${esc(s.subject || "")} · ${esc(levelText(s))} · ${s.pages} pages · ${esc(s.style || "")} referencing</p>
      ${s.file_path ? `<p style="margin:8px 0"><button class="btn sm alt" data-free>View the free page${free > 1 ? "s" : ""} (exactly as in the document)</button></p><div data-freemsg role="status"></div>` : ""}
      ${s.intro && (!s.file_path || s._linked) ? `<details class="intro"><summary>Read the introduction (free)</summary>${paras(s.intro)}</details>` : ""}
      <div class="locked"><strong>Get the full sample</strong> <span class="small muted">${money(rate)} per page. ${paid} more page${paid > 1 ? "s" : ""} available after the free page${free > 1 ? "s" : ""}.</span>
        <ol class="small" style="margin:6px 0;padding-left:18px"><li>Choose how many pages</li><li>Pay with the details below</li><li>Send your email and payment reference</li><li>When we confirm, your access code is emailed to you and appears in your account</li></ol>
        <details class="intro"><summary>Payment details</summary><ul class="small" style="margin:8px 0">${pay}</ul></details>
        ${pagesInput}
        <label class="small">I will mostly</label><select data-f><option value="read">Read online (2 sessions)</option><option value="download">Download (once)</option></select>
        <label class="small">Payment now</label><select data-pay><option value="full">Pay full amount</option><option value="part">Pay half now (50%), balance later</option></select>
        ${s._linked ? '<p class="small muted">The code is emailed to the address this link was sent to.</p>' : '<label class="small">Your email (the code is sent here)</label><input type="email" data-e autocomplete="email" placeholder="you@example.com" value="${esc(mine.email || "")}" style="width:100%">'}
        <label class="small">Payment reference</label><input data-r placeholder="PayPal or mobile money transaction ID" autocomplete="off" style="width:100%">
        <p><button class="btn sm" data-req>Send for confirmation</button></p><div data-out role="status"></div></div>
      <details class="intro" data-paid ${mine.email ? "open" : ""}><summary>Already paid? Open my pages</summary>
        <p class="small muted">Enter your email and the access code we sent you. Reading online: 2 sessions (each reopening after closing the tab counts as one). Download: once, then the code ends.</p>
        <label class="small">Your email</label><input type="email" data-e2 value="${esc(mine.email || "")}" style="width:100%"><label class="small">Access code</label><input data-c autocapitalize="characters" autocomplete="off" style="max-width:220px;text-transform:uppercase">
        <p><button class="btn sm" data-read>Read online</button> <button class="btn sm alt" data-dl>Download</button></p><div data-msg role="status"></div>
        <div class="panel" style="padding:12px;margin-top:10px"><strong>Paid half? Pay the balance here</strong>
          <p class="small muted" style="margin:6px 0">Pay the balance with the details above, then enter your payment reference. When we confirm it, the watermark is removed and you can open the full copy with the same code.</p>
          <input data-bref placeholder="Balance payment reference (PayPal or mobile money ID)" autocomplete="off" style="width:100%"> <p><button class="btn sm" data-bal>I have paid the balance</button></p><div data-balmsg role="status"></div></div></details>`;
    const q = x => det.querySelector(x), n = () => parseR(q("[data-ranges]").value).length;
    const payNow = () => q("[data-pay]").value, upd = () => { const t = n() * rate; q("[data-price]").textContent = payNow() === "part" ? money(t / 2) + " now (of " + money(t) + ")" : money(t); };
    if (q("[data-n]")) q("[data-n]").oninput = upd; if (q("[data-ranges]")) q("[data-ranges]").oninput = upd; q("[data-pay]").onchange = upd;
    q("[data-req]").onclick = async () => {
      const out = q("[data-out]"), ref = q("[data-r]").value.trim();
      if (s._linked) {
        const ranges = q("[data-ranges]").value.trim();
        if (!ranges) { out.innerHTML = '<p class="err">Choose the pages you want, for example 14-20.</p>'; return; }
        if (!ref) { out.innerHTML = '<p class="err">Enter your payment reference.</p>'; return; }
        out.textContent = "Sending...";
        try {
          const r = await fetch(SB.url + "/rest/v1/rpc/request_pages_by_link", { method: "POST", headers: H, body: JSON.stringify({ p_sample: s.id, p_token: s._token, p_ranges: ranges, p_reference: ref, p_pay: payNow() }) });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.message || "Could not send. Check the pages and try again.");
          fetch(SB.url + "/functions/v1/super-worker", { method: "POST", headers: H, body: JSON.stringify({ action: "notify_request", sample_id: s.id, token: s._token, request_id: j.request_id }) }).catch(() => {});
          out.innerHTML = '<p class="ok"><b>Received.</b> You asked for pages ' + esc(j.ranges) + ' (' + j.pages + ' page' + (j.pages > 1 ? "s" : "") + ', ' + money(j.amount) + '). Once we confirm your payment, your access code is emailed to you and appears in your account.</p>';
        } catch (e) { out.innerHTML = '<p class="err">' + esc(e.message) + "</p>"; }
        return;
      }
      const email = q("[data-e]").value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { out.innerHTML = '<p class="err">Enter a valid email address.</p>'; return; }
      if (!n()) { out.innerHTML = '<p class="err">Choose the pages you want, for example 14-20.</p>'; return; }
      if (!ref) { out.innerHTML = '<p class="err">Enter your payment reference.</p>'; return; }
      out.textContent = "Sending...";
      try {
        const r = await fetch(SB.url + "/rest/v1/rpc/request_sample_pages", { method: "POST", headers: H, body: JSON.stringify({ p_sample: s.id, p_email: email, p_ranges: q("[data-ranges]").value.trim(), p_reference: ref, p_pay: payNow() }) });
        if (!r.ok) { let m = "Could not send. Try again."; try { m = (await r.json()).message || m; } catch (e) {} throw new Error(m); }
        mineSet(s.id, { email }); q("[data-e2]").value = email;
        try { fetch((window.RGH.supabase.url + "/functions/v1/rgh-contact"), { method: "POST", headers: { "Content-Type": "application/json", apikey: window.RGH.supabase.anonKey, Accept: "application/json" }, body: JSON.stringify({ subject: "Sample request: " + email, _captcha: "false", _template: "box", message: email + " paid for a sample. Confirm in Admin > Sample access.\n\nSample: " + s.title + "\nPages: " + n() + " (" + money(n() * rate) + ")\nReference: " + ref }) }).catch(() => {}); } catch (e) {}
        out.innerHTML = '<p class="ok"><b>Received.</b> Once we confirm your payment, your access code is emailed to <b>' + esc(email) + '</b> and also appears in your <a href="account.html">account</a> (sign in with the same email). Then come back here and use <b>Already paid?</b></p>';
      } catch (e) { out.innerHTML = '<p class="err">' + esc(e.message) + "</p>"; }
    };
    const fb = q("[data-free]"); if (fb) fb.onclick = async () => {
      const m = q("[data-freemsg]"); m.textContent = "Opening...";
      try { const r = await fetch(SB.url + "/functions/v1/super-worker", { method: "POST", headers: H, body: JSON.stringify({ action: "preview", sample_id: s.id, token: s._token || "" }) }); if (!r.ok) throw new Error(); const b = await r.blob(); m.textContent = ""; openViewer(s.title + " (free pages)", "Free preview", b); }
      catch (e) { m.innerHTML = '<p class="err">Could not open the preview right now. Try again in a minute.</p>'; }
    };
    q("[data-bal]").onclick = async () => {
      const email = q("[data-e2]").value.trim(), code = q("[data-c]").value.trim(), ref = q("[data-bref]").value.trim(), m = q("[data-balmsg]");
      if (!email || !code) { m.innerHTML = '<p class="err">Enter your email and access code above first.</p>'; return; } if (!ref) { m.innerHTML = '<p class="err">Enter the payment reference for the balance.</p>'; return; }
      m.textContent = "Sending...";
      try {
        const r = await fetch(SB.url + "/rest/v1/rpc/request_sample_balance", { method: "POST", headers: H, body: JSON.stringify({ p_sample: s.id, p_email: email, p_code: code, p_reference: ref }) });
        const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.message || "Could not send. Check your email and code.");
        try { fetch((window.RGH.supabase.url + "/functions/v1/rgh-contact"), { method: "POST", headers: { "Content-Type": "application/json", apikey: window.RGH.supabase.anonKey, Accept: "application/json" }, body: JSON.stringify({ subject: "Balance paid for sample: " + email, _captcha: "false", _template: "box", message: email + " says they paid the BALANCE for a sample. Confirm in Admin > Sample access (Confirm balance payment).\n\nSample: " + s.title + "\nAccess code: " + code.toUpperCase() + "\nBalance reference: " + ref + "\nBalance: " + money(j.owing || 0) }) }).catch(() => {}); } catch (e) {}
        m.innerHTML = '<p class="ok"><b>Thank you.</b> We have been told you paid the balance. When we confirm it, the full copy opens without a watermark using the same code.</p>';
      } catch (e) { m.innerHTML = '<p class="err">' + esc(e.message) + "</p>"; }
    };
    const call = async action => {
      const email = q("[data-e2]").value.trim(), code = q("[data-c]").value.trim(), m = q("[data-msg]");
      if (!email || !code) { m.innerHTML = '<p class="err">Enter your email and access code.</p>'; return null; }
      m.textContent = "Checking...";
      let r; try { r = await fetch(SB.url + "/functions/v1/super-worker", { method: "POST", headers: H, body: JSON.stringify({ action, sample_id: s.id, email, code, session: sess, token: s._token || "" }) }); } catch (e) { m.innerHTML = '<p class="err">Could not reach the reading service. Please try again in a minute, or email ' + esc(C.email) + ' and we will send your pages.</p>'; return null; }
      if (!r.ok) { let t = "Could not open. Try again."; try { t = (await r.json()).error || t; } catch (e) {} m.innerHTML = '<p class="' + (r.status === 202 ? "" : "err") + '">' + esc(t) + "</p>"; return null; }
      m.textContent = ""; return r;
    };
    q("[data-read]").onclick = async () => {
      const r = await call("view"); if (!r) return; const left = r.headers.get("x-opens-left"), kind = r.headers.get("x-kind");
      if (kind === "text") { const j = await r.json(), modal = document.createElement("div"); modal.className = "sa-modal"; modal.innerHTML = `<div class="sa-box"><header><strong>${esc(s.title)}</strong><span class="small muted">Online readings left after this one: ${esc(left)}. Closing the tab ends this session.</span><span><button class="btn sm" data-x>Close</button></span></header><div class="txt"><h2>${esc(j.title)}</h2>${paras(j.text)}</div></div>`; document.body.appendChild(modal); modal.querySelector("[data-x]").onclick = () => modal.remove(); return; }
      openViewer(s.title, "Online readings left after this one: " + left + ". Closing the tab ends this session.", await r.blob());
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
