/* Chat with us: opens WhatsApp directly. No live-chat widget and no third-party chat service. */
(function () {
  function cfg() { return window.RGH || {}; }

  function waUrl(text) {
    var C = cfg();
    if (!C.whatsapp) return "";
    return "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(text || "Hi Research Genius Hub, I need help.");
  }

  function openWA(text) {
    var u = waUrl(text);
    if (u) window.open(u, "_blank", "noopener");
    else if (cfg().email) window.location.href = "mailto:" + cfg().email;
  }

  var css = ".rgh-chat{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:max(16px,env(safe-area-inset-bottom,0px));z-index:70}" +
    ".rgh-chat button{background:#1FA855;color:#fff;border:2px solid #1FA855;border-radius:999px;padding:12px 20px;font:600 1rem system-ui,sans-serif;cursor:pointer;box-shadow:4px 4px 0 rgba(0,0,0,.2)}" +
    ".rgh-chat button:hover{background:#178a45;border-color:#178a45}" +
    "@media (max-width:560px){.rgh-chat button{padding:10px 14px}}";

  function mount() {
    if (!cfg().whatsapp || document.querySelector(".rgh-chat")) return;
    var s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
    var d = document.createElement("div");
    d.className = "rgh-chat";
    d.innerHTML = '<button type="button"><span aria-hidden="true">&#128172;</span> Chat with us</button>';
    d.querySelector("button").addEventListener("click", function () {
      openWA("Hi Research Genius Hub, I would like to talk to a person.");
    });
    document.body.appendChild(d);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
  else mount();

  // Kept so the account page can call the same functions. Each one opens WhatsApp.
  window.RGHChat = {
    live: function () { openWA("Hi Research Genius Hub, I would like to talk to a person about my account."); },
    identify: function () {},
    refresh: function () {}
  };
})();
