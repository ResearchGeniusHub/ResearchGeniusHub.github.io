/* Research Genius Hub: shared header behaviour on every page.
   Puts Sign in (or My account + Log out) right after Contact, remembers referral links, and warms up the account page so it opens fast. */
(function () {
  var C = window.RGH || {}, url = C.supabase && C.supabase.url, key = url ? "sb-" + url.replace("https://", "").split(".")[0] + "-auth-token" : "";
  try { var r = new URLSearchParams(location.search).get("ref"); if (r) localStorage.setItem("rgh_ref", r.trim().toUpperCase().slice(0, 20)); } catch (e) {}
  function token() { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; } }
  var signedIn = !!(key && token());

  document.querySelectorAll("[data-disc]").forEach(function (e) { var d = C.discounts && C.discounts[e.getAttribute("data-disc")]; if (d) e.textContent = d; });
  document.querySelectorAll("a[data-wa]").forEach(function (e) { if (C.whatsapp) e.href = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent("Hi Research Genius Hub, I would like to negotiate a price."); });

  var nav = document.querySelector(".nav");
  if (nav) {
    document.querySelectorAll(".hdr-actions [data-signin]").forEach(function (a) { a.style.display = "none"; });
    var a = nav.querySelector('a[data-signin-link]');
    if (!a) {
      var anchor = nav.querySelector('a[href="contact.html"]') || nav.lastElementChild;
      a = document.createElement("a"); a.href = "account.html"; a.setAttribute("data-auth-nav", "");
      anchor.insertAdjacentElement("afterend", a);
    }
    a.setAttribute("data-auth-nav", "");
    a.textContent = signedIn ? "My account" : "Sign in / Sign up"; a.style.fontWeight = "700";
    if (/account\.html$/.test(location.pathname)) a.setAttribute("aria-current", "page");
  }

  // Warm up the account page: connection to Supabase and the account page itself, so Order / Sign in opens quickly.
  function hint(rel, href, extra) { var l = document.createElement("link"); l.rel = rel; l.href = href; if (extra) l.crossOrigin = ""; document.head.appendChild(l); }
  if (!/account\.html$/.test(location.pathname)) {
    if (url) hint("preconnect", url, 1);
    hint("preconnect", "https://cdn.jsdelivr.net", 1);
    var warmed = false;
    function warm() { if (warmed) return; warmed = true; hint("prefetch", "account.html"); hint("prefetch", "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js"); }
    document.addEventListener("pointerover", function (e) { if (e.target.closest && e.target.closest('a[href^="account.html"]')) warm(); }, { passive: true });
    document.addEventListener("touchstart", function (e) { if (e.target.closest && e.target.closest('a[href^="account.html"]')) warm(); }, { passive: true });
    if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 2500);
  }
})();
