/* ============================================================
   CLAUDEFX ACADEMY — assets/js/catalog.js
   Every product that can be bought (ebooks + courses).

   id          : used in the checkout link  checkout.html?product=<id>
   priceUsd    : price in USD (CFA / crypto amounts are computed from it)
   durationDays: null = lifetime access
   videoUrl    : optional YouTube preview shown on that product's checkout
   content     : what the buyer gets in My Library AFTER you approve payment
                 kind "pdf" | "link"  -> opens the url
                 kind "youtube"       -> plays the YouTube video in the page
                 Paste your links into the empty url:"" fields.
   ============================================================ */
window.CATALOG = {

  /* ---------------- EBOOKS ---------------- */
  "risk-management-guide":      { type: "ebook", title: "Risk Management Guide", priceUsd: 29, durationDays: null, videoUrl: "",
    content: [{ kind: "pdf", label: "Risk Management Guide (PDF)", url: "" }] },
  "technical-analysis-guide":   { type: "ebook", title: "Technical Analysis Guide", priceUsd: 29, durationDays: null, videoUrl: "",
    content: [{ kind: "pdf", label: "Technical Analysis Guide (PDF)", url: "" }] },
  "fundamental-analysis-guide": { type: "ebook", title: "Fundamental Analysis Guide", priceUsd: 29, durationDays: null, videoUrl: "",
    content: [{ kind: "pdf", label: "Fundamental Analysis Guide (PDF)", url: "" }] },
  "psychology-guide":           { type: "ebook", title: "Psychology vs Physiology in Trading", priceUsd: 29, durationDays: null, videoUrl: "",
    content: [{ kind: "pdf", label: "Psychology vs Physiology in Trading (PDF)", url: "" }] },
  "strategy-playbook":          { type: "ebook", title: "Trading Strategy Playbook", priceUsd: 39, durationDays: null, videoUrl: "",
    content: [{ kind: "pdf", label: "Trading Strategy Playbook (PDF)", url: "" }] },

  /* ---------------- FULL COURSE + MENTORSHIP (course-single.html) ---------------- */
  "full-course": { type: "course", title: "Forex & Synthetic Indices Full Course + Mentorship", priceUsd: 397, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },

  /* ---------------- COURSES (ids match assets/js/courses.js) ---------------- */
  "course-1": { type: "course", title: "Forex Trading Fundamentals",     priceUsd: 197, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-2": { type: "course", title: "Advanced Technical Analysis",    priceUsd: 297, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-3": { type: "course", title: "Synthetic Indices Mastery",      priceUsd: 247, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-4": { type: "course", title: "Risk Management & Psychology",   priceUsd: 147, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-5": { type: "course", title: "Price Action Trading",           priceUsd: 267, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-6": { type: "course", title: "Funded Account Blueprint",       priceUsd: 347, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-7": { type: "course", title: "ICT Concepts & Smart Money",     priceUsd: 397, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-8": { type: "course", title: "Account Management Strategies",  priceUsd: 497, durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
  "course-9": { type: "course", title: "Forex for Complete Beginners",   priceUsd: 97,  durationDays: null, videoUrl: "",
    content: [{ kind: "youtube", label: "Lesson 1", url: "" }] },
};

window.getCatalogDuration = (id) => (window.CATALOG[id] ? window.CATALOG[id].durationDays : null);
