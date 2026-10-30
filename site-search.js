/* Site search: finds services, prices, payments, samples, FAQ, contact, security and pages.
   Add a topic to INDEX when a new page or service is added. */
(function () {
  var INDEX = [
    { t: "Home", u: "index.html", d: "Research Genius Hub home: dissertation, data analysis, editing and online coaching for university students.", k: "home welcome start begin order research genius hub rgh" },
    { t: "All services", u: "services.html", d: "Every service we offer, with what is included.", k: "services service offer offers help what do you do all list menu" },
    { t: "Research support", u: "research-support.html", d: "Help with research design, methodology, questionnaires, literature review and proposals.", k: "research support methodology method questionnaire survey literature review proposal design study topic" },
    { t: "Essay guidance", u: "services.html#essay-guidance", d: "Essay structure, argument and academic writing guidance.", k: "essay essays writing argument structure guidance paragraph introduction conclusion" },
    { t: "Data analysis (SPSS, NVivo, Excel, Stata)", u: "services.html#data-analysis", d: "Quantitative and qualitative analysis with SPSS, NVivo, Excel and Stata, with results explained.", k: "data analysis analyse analyze spss nvivo excel stata statistics statistical quantitative qualitative regression anova correlation chi square" },
    { t: "Presenting findings", u: "services.html#presenting-findings", d: "Turning results into clear tables, charts, figures and written interpretation.", k: "presenting findings results tables table charts chart figures figure interpretation discussion" },
    { t: "Reports and business plans", u: "services.html#reports-business-plans", d: "Reports, business plans and proposals written and structured for assessment.", k: "report reports business plan proposal write writing" },
    { t: "PowerPoint and presentations", u: "services.html#powerpoint", d: "Slides and presentations for class or viva.", k: "powerpoint slides slide presentation deck presentations" },
    { t: "Online coaching (one to one)", u: "coaching.html", d: "Live one-to-one sessions for undergraduate, Masters and PhD students, including viva preparation. Prices and how to book.", k: "coaching coach tutor tutoring lesson lessons session sessions live online one to one viva defence thesis prepare book hour hours price cost" },
    { t: "Dissertation and thesis support", u: "services.html#dissertation-support", d: "Support across each chapter of a dissertation or thesis.", k: "dissertation thesis chapter chapters project final year masters phd" },
    { t: "Assignment guides and how to", u: "guides.html", d: "Guides for assignments, briefs, marking criteria and referencing.", k: "guide guides assignment assignments brief marking criteria rubric how to instructions tips" },
    { t: "Editing and proofreading", u: "editing.html", d: "Grammar, spelling, clarity and academic language editing.", k: "editing edit proofreading proofread proof grammar spelling language clarity english" },
    { t: "Journal publication support", u: "services.html#journal-publication", d: "Help preparing and submitting work for journal publication.", k: "journal publication publish paper article submit submission peer review" },
    { t: "AI content removal", u: "services.html#ai-content-removal", d: "Rewriting passages that read as AI-generated. You pay only for the pages that need it.", k: "ai artificial intelligence content removal remove turnitin detector chatgpt rewrite humanise humanize" },
    { t: "Data services", u: "data-services.html", d: "Data cleaning, analysis and reporting for students.", k: "data services dataset clean cleaning coding entry" },
    { t: "Prices and calculator", u: "pricing.html", d: "Price per page for each level and deadline, with the calculator and discounts.", k: "price prices pricing cost costs how much fee fees rate rates quote quotes calculator per page charge deadline urgent turnaround discount offer" },
    { t: "Deadlines and turnaround", u: "pricing.html", d: "How fast we can deliver and what it costs for each deadline.", k: "deadline deadlines turnaround time days hours urgent fast when due date how long" },
    { t: "Payments: how to pay", u: "payments.html", d: "Pay by PayPal, M-Pesa, mobile money (Wise, Wave, World Remit) or bank. How to send your payment reference.", k: "pay payment payments paid paying paypal mpesa m-pesa mobile money wise wave world remit bank transfer reference receipt method methods" },
    { t: "Payment security and privacy", u: "payments.html", d: "Payments are made outside our website. We never ask for your card, bank, phone, ID or passport details.", k: "secure security safe safety private privacy personal information card bank phone identity passport ssn social number data protect trust scam fraud" },
    { t: "Payment support", u: "faq.html", d: "Help if your payment was not confirmed, or you paid and have no code.", k: "payment support problem not confirmed confirm missing failed issue wrong refund" },
    { t: "Frequently asked questions (FAQ)", u: "faq.html", d: "Answers to common questions about services, prices, payments, samples, uploads and revisions.", k: "faq faqs question questions answer answers common ask asked help" },
    { t: "Revisions", u: "faq.html", d: "Send revision notes within 7 days of delivery and we update the work against your brief.", k: "revision revisions revise change changes feedback edit edits within days corrections" },
    { t: "Countries and levels we work with", u: "faq.html", d: "Undergraduate, Masters and PhD students worldwide. We follow your country's referencing and spelling.", k: "country countries region level levels undergraduate masters phd students worldwide spelling referencing" },
    { t: "Help and guides", u: "help.html", d: "How to place an order, upload your brief, pay and get your work.", k: "help support how guide instructions steps tutorial use site website" },
    { t: "Samples", u: "samples.html", d: "Read free sample introductions and unlock more pages.", k: "sample samples example examples preview read unlock pages free introduction" },
    { t: "Sample access code and download", u: "samples.html", d: "Enter your email and access code to read or download a sample you have paid for.", k: "code access code download downloads private link expired open view pages paid" },
    { t: "Place an order", u: "account.html#new", d: "Create an account, choose a service, add your brief and files, and get a price.", k: "order orders place ordering start new request submit brief apply form" },
    { t: "Upload your instructions and files", u: "account.html#new", d: "Attach your brief, marking criteria, readings and any draft when you place an order.", k: "upload uploads uploading instructions instruction brief files file attach attachment requirements marking criteria rubric readings document" },
    { t: "My orders, drafts and final files", u: "account.html", d: "See your order status, review drafts, and download final files once paid.", k: "my orders order status track tracking draft drafts final final copy delivery delivered download downloads files review" },
    { t: "Sign in and your account", u: "account.html", d: "Sign in, create an account, reset your password and see your orders.", k: "account login log in signin sign in sign up register password account profile" },
    { t: "Contact us", u: "contact.html", d: "Email us, or message us on WhatsApp.", k: "contact email whatsapp phone message reach call write talk support number address" },
    { t: "Chat with us (talk to a person)", u: "contact.html", d: "Talk to a person on WhatsApp.", k: "chat live person human talk agent message whatsapp" },
    { t: "Terms, policies and academic integrity", u: "terms.html", d: "Terms of service, refunds, privacy and academic integrity rules.", k: "terms conditions policy policies refund refunds privacy rules integrity academic misconduct plagiarism legal agreement" },
    { t: "Reviews and testimonials", u: "review.html", d: "What students say about our work.", k: "review reviews testimonial testimonials feedback students say rating stars" },
    { t: "About us", u: "about.html", d: "Who we are and how we work.", k: "about us who we are team story mission company" },
    { t: "Referral and discount", u: "account.html", d: "Use a referral ID for a discount.", k: "referral refer discount coupon code id promo offer" },
    { t: "Thank you and confirmation", u: "thanks.html", d: "What happens after you place an order or pay.", k: "thanks thank you confirmation confirmed received what next after" }
  ];

  var SYN = {
    cost: "price pricing fee rate quote", costs: "price pricing fee rate quote", how: "help", much: "price cost", charge: "price fee", charges: "price fee",
    money: "payment price", paid: "payment pay", paying: "payment pay", pay: "payment", payments: "payment pay", mpesa: "mobile money", momo: "mobile money",
    mobile: "money payment", card: "payment bank", sms: "contact whatsapp", question: "faq", questions: "faq", faqs: "faq",
    sample: "samples", examples: "sample", secure: "security private", privacy: "security private", private: "security privacy", safe: "security",
    upload: "instructions files brief", uploaded: "upload files", instructions: "brief upload", brief: "instructions order",
    download: "final files", downloads: "download final", final: "delivery download", draft: "review delivery", drafts: "draft review",
    delivery: "final download", delivered: "delivery final", login: "account", signin: "account", register: "account", password: "account",
    tutor: "coaching", lesson: "coaching", session: "coaching", viva: "coaching", thesis: "dissertation", project: "dissertation",
    spss: "data analysis", nvivo: "data analysis", excel: "data analysis", stata: "data analysis", stats: "data analysis",
    proofread: "editing", grammar: "editing", ai: "content removal", turnitin: "content removal", chatgpt: "content removal",
    powerpoint: "presentation slides", slides: "powerpoint presentation", presentation: "powerpoint slides",
    referral: "discount", discount: "referral price", coupon: "discount", refund: "terms payment", policy: "terms", policies: "terms",
    whatsapp: "contact chat", email: "contact", phone: "contact whatsapp", talk: "chat contact", human: "chat", agent: "chat",
    deadline: "turnaround price", deadlines: "turnaround", urgent: "deadline turnaround", days: "deadline turnaround",
    guide: "guides help", guides: "guide help", help: "support faq", support: "help faq",
    country: "region", countries: "country", region: "country", level: "undergraduate masters phd",
    review: "reviews", testimonial: "reviews", reviews: "review", about: "who"
  };

  var STOP = { the: 1, and: 1, for: 1, how: 1, what: 1, can: 1, you: 1, your: 1, are: 1, is: 1, with: 1, that: 1, this: 1, from: 1, our: 1, have: 1, has: 1, not: 1, any: 1, did: 1, does: 1, where: 1, when: 1, who: 1, why: 1, its: 1, it: 1, i: 1, me: 1, my: 1, we: 1, a: 1, an: 1, of: 1, to: 1, in: 1, on: 1, at: 1, do: 1, be: 1, or: 1, so: 1, if: 1, about: 0 };

  function words(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9\-\s]+/g, " ").split(/\s+/).filter(Boolean); }
  function variants(w) { var v = [w]; if (w.length > 3 && /s$/.test(w)) v.push(w.slice(0, -1)); if (w.length > 4 && /ing$/.test(w)) v.push(w.slice(0, -3)); return v; }

  function search(q) {
    var base = words(q).filter(function (w) { return w.length >= 2 && !STOP[w]; });
    if (!base.length) return [];
    var terms = [];
    base.forEach(function (w) {
      variants(w).forEach(function (v) { terms.push({ w: v, wt: 3 }); });
      if (SYN[w]) words(SYN[w]).forEach(function (s) { terms.push({ w: s, wt: 2 }); });
    });
    var seen = {}; terms = terms.filter(function (x) { var key = x.w + x.wt; if (seen[key]) return false; seen[key] = 1; return true; });
    var scored = INDEX.map(function (e) {
      var kw = words(e.k + " " + e.t), text = (e.t + " " + e.d + " " + e.k).toLowerCase(), score = 0;
      terms.forEach(function (x) {
        if (kw.indexOf(x.w) >= 0) score += x.wt;
        else if (x.w.length >= 5 && text.indexOf(x.w) >= 0) score += x.wt / 2;
      });
      return { e: e, s: score };
    }).filter(function (r) { return r.s > 0; });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, 8).map(function (r) { return r.e; });
  }

  function cfg() { return window.RGH || {}; }
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }

  var css = ".rgh-s-btn{background:none;border:1.5px solid currentColor;border-radius:8px;padding:7px 12px;font:600 .9rem system-ui,sans-serif;cursor:pointer;color:inherit;margin-right:8px}" +
    ".rgh-s-ov{position:fixed;inset:0;background:rgba(15,27,51,.55);z-index:90;display:none;align-items:flex-start;justify-content:center;padding:clamp(12px,6vh,70px) 14px}" +
    ".rgh-s-ov.on{display:flex}" +
    ".rgh-s-box{background:#fff;color:#0F1B33;width:min(640px,100%);border-radius:14px;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.3);max-height:84vh;overflow:auto;font-family:system-ui,sans-serif}" +
    ".rgh-s-in{width:100%;font:1.05rem system-ui,sans-serif;padding:12px 14px;border:2px solid #0F1B33;border-radius:10px;box-sizing:border-box}" +
    ".rgh-s-hint{font-size:.85rem;color:#555;margin:8px 2px 4px}" +
    ".rgh-s-list{list-style:none;margin:10px 0 0;padding:0}" +
    ".rgh-s-list li{border-bottom:1px solid #e3e7ef}" +
    ".rgh-s-list a{display:block;padding:11px 4px;text-decoration:none;color:#0F1B33}" +
    ".rgh-s-list a:hover,.rgh-s-list a:focus{background:#f3f6fb}" +
    ".rgh-s-t{font-weight:700;display:block}.rgh-s-d{font-size:.9rem;color:#4a5568;display:block;margin-top:2px}" +
    ".rgh-s-none{margin:12px 0 0;font-size:.95rem}" +
    ".rgh-s-chat{margin-top:10px;background:#1FA855;color:#fff;border:0;border-radius:999px;padding:10px 16px;font:700 .95rem system-ui,sans-serif;cursor:pointer}" +
    ".rgh-s-x{float:right;background:none;border:0;font-size:1.4rem;cursor:pointer;color:#0F1B33;line-height:1}";

  var ov, input, list, none;

  function render(q) {
    list.textContent = "";
    none.textContent = "";
    if (!q.trim()) { none.textContent = "Type a word such as price, payment, sample, FAQ, upload, security or contact."; return; }
    var res = search(q);
    if (!res.length) {
      none.textContent = "Nothing matched \"" + q + "\". Try another word, or chat with a person.";
      var b = el("button", "rgh-s-chat", "Chat with us");
      b.type = "button";
      b.addEventListener("click", function () { if (window.RGHChat && window.RGHChat.live) window.RGHChat.live(); });
      none.appendChild(el("br"));
      none.appendChild(b);
      return;
    }
    res.forEach(function (e) {
      var li = el("li");
      var a = el("a");
      a.href = e.u;
      a.appendChild(el("span", "rgh-s-t", e.t));
      a.appendChild(el("span", "rgh-s-d", e.d));
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function open() { ov.classList.add("on"); input.value = ""; render(""); setTimeout(function () { input.focus(); }, 30); }
  function close() { ov.classList.remove("on"); }

  function mount() {
    if (document.querySelector(".rgh-s-ov")) return;
    var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

    var target = document.querySelector(".hdr-actions");
    var btn = el("button", "rgh-s-btn", "Search");
    btn.type = "button";
    btn.setAttribute("aria-label", "Search the site");
    btn.addEventListener("click", open);
    if (target) target.insertBefore(btn, target.firstChild);
    else { var w = document.querySelector(".site-header .wrap"); if (w) w.appendChild(btn); }

    ov = el("div", "rgh-s-ov");
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");
    ov.setAttribute("aria-label", "Search");
    var box = el("div", "rgh-s-box");
    var x = el("button", "rgh-s-x", "×");
    x.type = "button"; x.setAttribute("aria-label", "Close search");
    x.addEventListener("click", close);
    input = el("input", "rgh-s-in");
    input.type = "search"; input.placeholder = "Search: price, payment, sample, FAQ, upload, security...";
    input.setAttribute("aria-label", "Search the site");
    input.addEventListener("input", function () { render(input.value); });
    box.appendChild(x);
    box.appendChild(input);
    box.appendChild(el("p", "rgh-s-hint", "Find our services, prices, payments, samples, FAQ, contact and more."));
    list = el("ul", "rgh-s-list");
    none = el("p", "rgh-s-none");
    box.appendChild(list);
    box.appendChild(none);
    ov.appendChild(box);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    document.body.appendChild(ov);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  window.RGHSearch = { search: search, open: open };
})();
