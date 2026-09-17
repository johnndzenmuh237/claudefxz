/* ============================================================
   CLAUDEFX ACADEMY — SITE ENHANCEMENTS
   Promo bar · WhatsApp button · Support Assistant · Copyright year
   No external API keys required — safe to ship client-side.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Site-wide config (edit here, not per-page) ---------- */
  var CONFIG = {
    whatsappGroupUrl: "https://chat.whatsapp.com/FSeUBzdlI5w5QBxqw4DHOR?s=cl&p=a&mlu=4&ilr=4",
    whatsappDirectNumber: "", // e.g. "237675175534" (no +, no spaces) — set this to enable 1:1 WhatsApp chat instead of the group link
    supportEmail: "claudetechfx@gmail.com",
    promoMessage: [
      "Professional Forex &amp; Synthetic Indices Education",
      "Live Trading Signals",
      "1-on-1 Mentorship",
      "Funded Account Coaching",
      "Get Started Today"
    ]
  };

  /* ---------- Copyright year ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-copy-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  });

  /* ---------- Promo / Announcement Bar ---------- */
  function injectPromoBar() {
    var bar = document.createElement("div");
    bar.className = "promo-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Announcements");
    var items = CONFIG.promoMessage
      .map(function (m) {
        return '<span class="promo-bar-item"><i class="fas fa-circle" style="font-size:5px;"></i> ' + m + "</span>";
      })
      .join('<span class="promo-bar-sep">•</span>');
    // duplicate content once for seamless looping
    bar.innerHTML = '<div class="promo-bar-track">' + items + items + "</div>";
    var body = document.body;
    var loader = body.querySelector(".page-loader");
    if (loader && loader.nextSibling) {
      body.insertBefore(bar, loader.nextSibling);
    } else {
      body.insertBefore(bar, body.firstChild);
    }
  }

  /* ---------- Floating WhatsApp + Assistant launcher ---------- */
  function injectFloatStack() {
    var stack = document.createElement("div");
    stack.className = "float-stack";

    var waHref = CONFIG.whatsappDirectNumber
      ? "https://wa.me/" + CONFIG.whatsappDirectNumber
      : CONFIG.whatsappGroupUrl;

    stack.innerHTML =
      '<a class="float-btn whatsapp" href="' + waHref + '" target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">' +
        '<i class="fab fa-whatsapp"></i>' +
      "</a>" +
      '<button type="button" class="float-btn assistant" id="assistantLauncher" aria-haspopup="dialog" aria-expanded="false" aria-controls="assistantPanel" aria-label="Open support assistant">' +
        '<i class="fas fa-comment-dots"></i>' +
      "</button>";

    document.body.appendChild(stack);
  }

  /* ---------- Support Assistant (rule-based FAQ matcher — fully functional, no external AI API) ---------- */
  var KB = [
    { q: "experience", a: "No prior experience is required — we have beginner-friendly courses that start from the basics of how currency markets work." },
    { q: "lifetime access courses", a: "Yes, once you purchase a course or subscribe to a paid plan you get lifetime access, including future updates." },
    { q: "mobile app", a: "The student portal is fully responsive, so you can learn from desktop, tablet, or mobile." },
    { q: "how long course duration", a: "Most courses run 6–24 hours of content and are self-paced, so you can go as fast or slow as you like." },
    { q: "signals delivered telegram whatsapp", a: "Signals are delivered via our private Telegram channel, WhatsApp group, and the student portal, with entry, stop loss, take profit, and a short analysis." },
    { q: "how many signals per week", a: "We typically send 8–15 signals per week across Forex majors, crosses, and Synthetic Indices." },
    { q: "account management how does it work", a: "You fund a trading account in your own name with your preferred broker, and our verified traders manage it under a clearly defined profit split. You keep full ownership and can withdraw any time." },
    { q: "minimum capital account management", a: "The Starter account management plan requires a minimum of $500; the Growth plan starts at $2,500." },
    { q: "guaranteed capital safe risk", a: "No trading result is ever guaranteed and capital is always at risk. We apply strict drawdown limits, but please only trade with capital you can afford to lose." },
    { q: "payment methods pay", a: "We accept major cards (Visa, Mastercard), PayPal, bank transfer, and crypto (USDT, BTC). Mobile money (M-Pesa, MTN MoMo) is available for African clients." },
    { q: "refund money back guarantee", a: "All paid plans come with a 30-day money-back guarantee — contact support within 30 days of purchase for a full refund." },
    { q: "contact human support talk to someone", a: "I can connect you to a real person any time — use the WhatsApp button, or email " + CONFIG.supportEmail + "." },
    { q: "pricing cost price", a: "You can see all current plans and pricing on our Pricing page." },
    { q: "funded account", a: "Our Funded Account program helps you prepare for and pass a funding challenge so you can trade a larger account. See the Funded Accounts page for tiers and requirements." }
  ];

  function scoreMatch(input, entry) {
    var words = input.toLowerCase().split(/\W+/).filter(Boolean);
    var kwords = entry.q.toLowerCase().split(/\W+/);
    var score = 0;
    words.forEach(function (w) {
      if (kwords.indexOf(w) !== -1) score++;
    });
    return score;
  }

  function bestAnswer(input) {
    var best = null, bestScore = 0;
    KB.forEach(function (entry) {
      var s = scoreMatch(input, entry);
      if (s > bestScore) { bestScore = s; best = entry; }
    });
    if (best && bestScore > 0) return best.a;
    return "I'm not fully sure about that one — I'm a simple FAQ assistant, not a live agent. Tap \"Chat on WhatsApp\" below and our team will help you directly, usually within a few hours.";
  }

  function injectAssistantPanel() {
    var panel = document.createElement("div");
    panel.className = "assistant-panel";
    panel.id = "assistantPanel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Support assistant");

    var waHref = CONFIG.whatsappDirectNumber
      ? "https://wa.me/" + CONFIG.whatsappDirectNumber
      : CONFIG.whatsappGroupUrl;

    panel.innerHTML =
      '<div class="assistant-header">' +
        '<span class="dot"></span>' +
        '<div><strong>Claudefx Support Assistant</strong><span>Automated FAQ helper — real team on WhatsApp</span></div>' +
        '<button class="assistant-close" id="assistantClose" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="assistant-body" id="assistantBody">' +
        '<div class="assistant-msg bot">Hi! I can answer common questions about courses, signals, account management, and payments instantly. What would you like to know?</div>' +
      "</div>" +
      '<div class="assistant-suggestions" id="assistantSuggestions">' +
        '<button class="assistant-chip" data-q="Do I need experience to join?">Do I need experience?</button>' +
        '<button class="assistant-chip" data-q="How does account management work?">Account management</button>' +
        '<button class="assistant-chip" data-q="What payment methods do you accept?">Payment methods</button>' +
        '<button class="assistant-chip" data-q="Do you offer a refund?">Refund policy</button>' +
      "</div>" +
      '<div class="assistant-inputrow">' +
        '<input type="text" id="assistantInput" placeholder="Type your question..." aria-label="Type your question">' +
        '<button id="assistantSend" aria-label="Send"><i class="fas fa-paper-plane"></i></button>' +
      "</div>" +
      '<div class="assistant-disclaimer">Automated assistant, not human or financial advice. <a href="' + waHref + '" target="_blank" rel="noopener noreferrer" style="color:var(--color-gold);">Chat on WhatsApp</a> for a real person.</div>';

    document.body.appendChild(panel);

    function addMsg(text, who) {
      var body = document.getElementById("assistantBody");
      var msg = document.createElement("div");
      msg.className = "assistant-msg " + who;
      msg.textContent = text;
      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    }

    function ask(text) {
      if (!text || !text.trim()) return;
      addMsg(text, "user");
      var input = document.getElementById("assistantInput");
      if (input) input.value = "";
      setTimeout(function () {
        addMsg(bestAnswer(text), "bot");
      }, 350);
    }

    panel.querySelectorAll(".assistant-chip").forEach(function (chip) {
      chip.addEventListener("click", function () { ask(chip.getAttribute("data-q")); });
    });
    document.getElementById("assistantSend").addEventListener("click", function () {
      ask(document.getElementById("assistantInput").value);
    });
    document.getElementById("assistantInput").addEventListener("keydown", function (e) {
      if (e.key === "Enter") ask(this.value);
    });
    document.getElementById("assistantClose").addEventListener("click", closeAssistant);
  }

  function openAssistant() {
    document.getElementById("assistantPanel").classList.add("open");
    document.getElementById("assistantLauncher").setAttribute("aria-expanded", "true");
  }
  function closeAssistant() {
    document.getElementById("assistantPanel").classList.remove("open");
    document.getElementById("assistantLauncher").setAttribute("aria-expanded", "false");
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectPromoBar();
    injectFloatStack();
    injectAssistantPanel();
    document.getElementById("assistantLauncher").addEventListener("click", function () {
      var panel = document.getElementById("assistantPanel");
      panel.classList.contains("open") ? closeAssistant() : openAssistant();
    });
  });
})();
