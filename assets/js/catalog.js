/* ============================================================
   CLAUDEFX ACADEMY — assets/js/catalog.js
   EVERYTHING THAT CAN BE BOUGHT, AND WHAT THE BUYER GETS AFTER PAYING.
   This is the only file you edit to add videos / PDFs.

   EBOOK  (type "ebook")      -> after payment: DOWNLOAD BUTTON ONLY.
        file: path or link to the PDF.
   COURSE (type "course")     -> after payment: its own page in the dashboard with
        modules + lessons (paste YouTube link in each  youtube:""),
        the course ebook PDF (ebook.file) and your contact details.
   BOT    (type "bot")        -> bot download file(s), setup videos, support contact.
   MENTORSHIP (type "mentorship") -> how to book sessions + your contact details.

   PDF files: upload them to  assets/ebooks/  with the file name shown below
   (or replace the path with any direct download link).
   YouTube: paste any link (watch?v=, youtu.be, shorts). Use UNLISTED videos.
   ============================================================ */

const mod = (title, lessons) => ({ title, lessons: lessons.map(t => ({ title: t, youtube: "" })) });
const outline = (topic) => [
  mod("Module 1 — Getting Started", ["Welcome & how to use this course", `${topic}: the big picture`, "Setting up your trading platform"]),
  mod("Module 2 — Core Concepts", ["Key terms & market structure", "Reading the charts", "Building your trading plan"]),
  mod("Module 3 — Strategy", ["Entry rules", "Exit rules & trade management", "Backtesting your strategy"]),
  mod("Module 4 — Risk & Psychology", ["Position sizing & stop-loss", "Controlling emotions", "Keeping a trade journal"]),
  mod("Module 5 — Going Live", ["Demo to live: your checklist", "Weekly review routine", "Next steps"]),
];
const courseEbook = (id, name) => ({ title: name + " — Course Ebook (PDF)", file: `../assets/ebooks/courses/${id}.pdf` });
const ebookFile = (id) => `../assets/ebooks/${id}.pdf`;

const COURSE_BLURB = "Lifetime access: watch every lesson again and again, download the course ebook, and get 1-on-1 follow-up support.";

window.CATALOG = {

  /* ================= EBOOKS — download only ================= */
  "risk-management-guide":      { type: "ebook", title: "Risk Management Guide", priceUsd: 29, durationDays: null, category: "RISK MANAGEMENT",
    image: "assets/images/courses/course-4.jpg", blurb: "Position sizing, stop-loss placement and capital protection.", file: ebookFile("risk-management-guide") },
  "technical-analysis-guide":   { type: "ebook", title: "Technical Analysis Guide", priceUsd: 29, durationDays: null, category: "TECHNICAL ANALYSIS",
    image: "assets/images/courses/ebook-technical-analysis.jpg", blurb: "Charts, patterns, indicators and confluence.", file: ebookFile("technical-analysis-guide") },
  "fundamental-analysis-guide": { type: "ebook", title: "Fundamental Analysis Guide", priceUsd: 29, durationDays: null, category: "FUNDAMENTALS",
    image: "assets/images/courses/ebook-fundamental-analysis.jpg", blurb: "News, economic data and central banks.", file: ebookFile("fundamental-analysis-guide") },
  "psychology-guide":           { type: "ebook", title: "Psychology vs Physiology in Trading", priceUsd: 29, durationDays: null, category: "PSYCHOLOGY",
    image: "assets/images/courses/ebook-psychology.jpg", blurb: "Master your mind and body under pressure.", file: ebookFile("psychology-guide") },
  "strategy-playbook":          { type: "ebook", title: "Trading Strategy Playbook", priceUsd: 39, durationDays: null, category: "STRATEGY",
    image: "assets/images/courses/ebook-strategy.jpg", blurb: "Proven setups and a step-by-step playbook.", file: ebookFile("strategy-playbook") },

  /* ================= FLAGSHIP COURSES (pricing.html) ================= */
  "forex-synthetic-full": { type: "course", title: "Forex & Synthetic Indices — Full Course + Mentorship", priceUsd: 397, durationDays: null, category: "FOREX + SYNTHETICS",
    image: "assets/images/courses/course-5.jpg", blurb: COURSE_BLURB, modules: outline("Forex & Synthetic Indices"),
    ebook: courseEbook("forex-synthetic-full", "Forex & Synthetic Indices") },
  "forex-full": { type: "course", title: "Forex Trading — Full Course & Mentorship", priceUsd: 297, durationDays: null, category: "FOREX TRADING",
    image: "assets/images/courses/course-6.jpg", blurb: COURSE_BLURB, modules: outline("Forex trading"),
    ebook: courseEbook("forex-full", "Forex Trading") },
  "synthetic-full": { type: "course", title: "Synthetic Indices — Full Course & Mentorship", priceUsd: 297, durationDays: null, category: "SYNTHETIC INDICES",
    image: "assets/images/courses/course-7.jpg", blurb: COURSE_BLURB, modules: outline("Synthetic indices"),
    ebook: courseEbook("synthetic-full", "Synthetic Indices") },
  "ta-mastery": { type: "course", title: "Technical Analysis Mastery", priceUsd: 127, durationDays: null, category: "TECHNICAL ANALYSIS",
    image: "assets/images/courses/course-2.jpg", blurb: COURSE_BLURB, modules: outline("Technical analysis"),
    ebook: courseEbook("ta-mastery", "Technical Analysis Mastery") },
  "fa-mastery": { type: "course", title: "Fundamental Analysis Mastery", priceUsd: 127, durationDays: null, category: "FUNDAMENTALS",
    image: "assets/images/courses/course-4.jpg", blurb: COURSE_BLURB, modules: outline("Fundamental analysis"),
    ebook: courseEbook("fa-mastery", "Fundamental Analysis Mastery") },

  /* ================= COURSES LIST (courses.html — ids course-1 … course-9) ================= */
  "course-1": { type: "course", title: "Forex Trading Fundamentals",    priceUsd: 197, durationDays: null, category: "FOREX", image: "assets/images/courses/course-1.jpg", blurb: COURSE_BLURB, modules: outline("Forex fundamentals"),  ebook: courseEbook("course-1", "Forex Trading Fundamentals") },
  "course-2": { type: "course", title: "Advanced Technical Analysis",   priceUsd: 297, durationDays: null, category: "TECHNICAL", image: "assets/images/courses/course-2.jpg", blurb: COURSE_BLURB, modules: outline("Advanced technical analysis"), ebook: courseEbook("course-2", "Advanced Technical Analysis") },
  "course-3": { type: "course", title: "Synthetic Indices Mastery",     priceUsd: 247, durationDays: null, category: "SYNTHETICS", image: "assets/images/courses/course-3.jpg", blurb: COURSE_BLURB, modules: outline("Synthetic indices"), ebook: courseEbook("course-3", "Synthetic Indices Mastery") },
  "course-4": { type: "course", title: "Risk Management & Psychology",  priceUsd: 147, durationDays: null, category: "RISK", image: "assets/images/courses/course-4.jpg", blurb: COURSE_BLURB, modules: outline("Risk management"), ebook: courseEbook("course-4", "Risk Management & Psychology") },
  "course-5": { type: "course", title: "Price Action Trading",          priceUsd: 267, durationDays: null, category: "PRICE ACTION", image: "assets/images/courses/course-5.jpg", blurb: COURSE_BLURB, modules: outline("Price action"), ebook: courseEbook("course-5", "Price Action Trading") },
  "course-6": { type: "course", title: "Funded Account Blueprint",      priceUsd: 347, durationDays: null, category: "PROP FIRM", image: "assets/images/courses/course-6.jpg", blurb: COURSE_BLURB, modules: outline("Funded accounts"), ebook: courseEbook("course-6", "Funded Account Blueprint") },
  "course-7": { type: "course", title: "ICT Concepts & Smart Money",    priceUsd: 397, durationDays: null, category: "ICT", image: "assets/images/courses/course-7.jpg", blurb: COURSE_BLURB, modules: outline("ICT & smart money"), ebook: courseEbook("course-7", "ICT Concepts & Smart Money") },
  "course-8": { type: "course", title: "Account Management Strategies", priceUsd: 497, durationDays: null, category: "ACCOUNT MGMT", image: "assets/images/courses/course-8.jpg", blurb: COURSE_BLURB, modules: outline("Account management"), ebook: courseEbook("course-8", "Account Management Strategies") },
  "course-9": { type: "course", title: "Forex for Complete Beginners",  priceUsd: 97,  durationDays: null, category: "BEGINNER", image: "assets/images/courses/course-9.jpg", blurb: COURSE_BLURB, modules: outline("Forex basics"), ebook: courseEbook("course-9", "Forex for Complete Beginners") },

  /* ================= TRADING BOT ================= */
  "syntheticbot": { type: "bot", title: "SyntheticBot — Auto Trading Bot", priceUsd: 249, durationDays: null, category: "AUTOMATION",
    image: "assets/images/courses/auto-trading-bot.jpg", blurb: "Rules-based bot with lifetime strategy updates.",
    downloads: [ { label: "SyntheticBot — installer / bot file", file: "../assets/ebooks/bot/syntheticbot.zip" },
                 { label: "SyntheticBot — setup guide (PDF)",   file: "../assets/ebooks/bot/syntheticbot-setup-guide.pdf" } ],
    videos: [ { title: "How to install the bot", youtube: "" }, { title: "How to configure & run it", youtube: "" } ],
    steps: ["Download the bot file below.", "Watch the installation video and follow the setup guide.", "Test on a demo account first.", "Contact us for 1-on-1 setup help."] },

  /* ================= MENTORSHIP ================= */
  "mentorship-starter": { type: "mentorship", title: "Starter Mentorship", priceUsd: 149, durationDays: null, category: "MENTORSHIP",
    image: "assets/images/hero/about-team.jpg", blurb: "1x 60-min session/month, personal trading plan.",
    perks: ["1x 60-min session / month", "Personal trading plan", "WhatsApp check-ins (2x/week)", "Trade journal review"] },
  "mentorship-pro": { type: "mentorship", title: "Professional Mentorship", priceUsd: 297, durationDays: null, category: "MENTORSHIP",
    image: "assets/images/hero/about-team.jpg", blurb: "2x 60-min sessions/month, custom strategy.",
    perks: ["2x 60-min sessions / month", "Custom strategy development", "Daily WhatsApp access", "Weekly trade review", "Chart marking service", "Funded account preparation"] },
  "mentorship-elite": { type: "mentorship", title: "Elite Mentorship", priceUsd: 497, durationDays: null, category: "MENTORSHIP",
    image: "assets/images/hero/about-team.jpg", blurb: "4x 90-min sessions/month, live trade room.",
    perks: ["4x 90-min sessions / month", "24/7 WhatsApp access", "Daily chart analysis", "Live trade room (all sessions)", "Prop firm challenge coaching", "Priority email & phone support"] },
};

window.getCatalogDuration = (id) => (window.CATALOG[id] ? window.CATALOG[id].durationDays : null);
