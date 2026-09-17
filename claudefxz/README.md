# Forex Academy Pro — Premium Trading Education Website Template

**Version:** 1.0.0  
**Last Updated:** January 2025  
**License:** Commercial Use — Single Purchase

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [File Structure](#file-structure)
4. [Quick Start](#quick-start)
5. [Customisation Guide](#customisation-guide)
6. [Color Themes](#color-themes)
7. [Pages Reference](#pages-reference)
8. [Student Portal](#student-portal)
9. [Admin Dashboard](#admin-dashboard)
10. [JavaScript Modules](#javascript-modules)
11. [Vendor Libraries](#vendor-libraries)
12. [Image Guide](#image-guide)
13. [Fonts](#fonts)
14. [Responsive Design](#responsive-design)
15. [Dark/Light Mode](#darklight-mode)
16. [Browser Support](#browser-support)
17. [Deployment](#deployment)
18. [Customisation Checklist](#customisation-checklist)
19. [Support](#support)

---

## Overview

Forex Academy Pro is a **complete, production-ready website template** designed for:

- ✅ Forex Trading Academies & Education Platforms
- ✅ Synthetic Indices Trading Communities
- ✅ Prop Firm & Funded Account Programs
- ✅ Trading Mentorship & Coaching Businesses
- ✅ Signal Provider Services
- ✅ Account Management Companies
- ✅ Investment Education Platforms
- ✅ Financial Coaching Businesses
- ✅ Trading Communities & Groups

### What's Included

| Section | Pages |
|---|---|
| Public Website | 16 pages |
| Student Portal | 8 pages |
| Admin Dashboard | 8 pages |
| **Total** | **32 HTML pages** |

---

## Features

### 🎨 Design
- Premium dark-first design with gold accent colour system
- 4 switchable colour themes (Gold, Blue, Emerald, Purple)
- Light/Dark mode toggle with smooth transition
- Fully responsive — Mobile, Tablet, Desktop, Large screen
- CSS custom properties throughout — change everything from one file
- AOS (Animate On Scroll) animations
- Swiper.js sliders for testimonials and courses
- Chart.js powered performance dashboards

### 📄 Pages
- **Home** — Hero with stats, services, courses, testimonials, CTA
- **About** — Team, values, story, mission
- **Courses** — Filterable grid with search and sorting
- **Course Single** — Full course detail with curriculum, reviews, instructor
- **Signals** — Live signal feed with filtering and track record
- **Mentorship** — Mentor profiles and coaching packages
- **Account Management** — Plans, profit calculator, performance chart
- **Funded Accounts** — Challenge tiers and 3-step process
- **Synthetic Indices** — Products overview and benefits
- **Forex Trading** — Learning path and curriculum overview
- **Testimonials** — Full testimonials page
- **Pricing** — Monthly/Annual toggle, comparison table
- **Blog** — Filterable article grid
- **Blog Single** — Full article with related posts
- **FAQ** — Accordion FAQ sections
- **Contact** — Form with contact details and support hours

### 🎓 Student Portal (8 pages)
- Dashboard with progress tracking and charts
- My Courses with progress bars and tabs
- Live Sessions (current, upcoming, recordings)
- Downloads (organised by category)
- Certificates with download & LinkedIn share
- Assignments (pending, submitted, graded)
- Profile management
- Settings (theme, notifications, password, subscription)

### ⚙️ Admin Dashboard (8 pages)
- Dashboard with KPI stats and revenue charts
- Students management with search and filters
- Instructors management
- Course management
- Payments & transactions table
- Signals management and track record
- Account management (AUM, clients)
- Reports with all charts

---

## File Structure

```
forex-academy-pro/
│
├── index.html                  ← Home page
├── about.html                  ← About us
├── courses.html                ← Course catalogue
├── course-single.html          ← Single course detail
├── mentorship.html             ← Mentorship programs
├── signals.html                ← Live trading signals
├── account-management.html     ← Account management service
├── synthetic-indices.html      ← Synthetic indices page
├── forex-trading.html          ← Forex trading page
├── funded-accounts.html        ← Funded account program
├── testimonials.html           ← Success stories
├── pricing.html                ← Pricing plans
├── faq.html                    ← FAQ accordion
├── blog.html                   ← Blog listing
├── blog-single.html            ← Single blog post
├── contact.html                ← Contact page
│
├── student-portal/
│   ├── dashboard.html          ← Student home
│   ├── my-courses.html         ← Enrolled courses
│   ├── certificates.html       ← Earned certificates
│   ├── live-sessions.html      ← Live & recorded sessions
│   ├── downloads.html          ← Resources & files
│   ├── assignments.html        ← Tasks and grades
│   ├── profile.html            ← Profile editor
│   └── settings.html           ← Account settings
│
├── admin/
│   ├── dashboard.html          ← Admin overview
│   ├── students.html           ← Student management
│   ├── instructors.html        ← Instructor management
│   ├── courses.html            ← Course management
│   ├── payments.html           ← Payment transactions
│   ├── signals.html            ← Signal management
│   ├── account-management.html ← AUM management
│   └── reports.html            ← Analytics & reports
│
├── assets/
│   ├── css/
│   │   ├── style.css           ← Main stylesheet (variables + components)
│   │   ├── dashboard.css       ← Portal & admin styles
│   │   ├── animations.css      ← All animations & keyframes
│   │   ├── darkmode.css        ← Light mode overrides
│   │   ├── themes.css          ← Colour theme variants
│   │   └── responsive.css      ← All breakpoint overrides
│   │
│   ├── js/
│   │   ├── main.js             ← Core: navbar, FAQ, counters, ticker
│   │   ├── dashboard.js        ← Sidebar, charts, admin actions
│   │   ├── courses.js          ← Course catalogue & filtering
│   │   ├── signals.js          ← Signal feed & live updates
│   │   ├── account-management.js ← AM calculator & charts
│   │   └── charts.js           ← Shared chart utilities
│   │
│   ├── fonts/                  ← Self-hosted fonts (optional)
│   │
│   ├── vendors/
│   │   ├── aos/                ← Animate On Scroll
│   │   ├── swiper/             ← Swiper.js slider
│   │   └── chartjs/            ← Chart.js
│   │
│   └── images/
│       ├── logo/               ← Logo, favicon, partner logos
│       ├── hero/               ← Hero and banner images
│       ├── courses/            ← Course thumbnail images
│       ├── instructors/        ← Instructor/team photos
│       ├── testimonials/       ← Student avatar photos
│       ├── traders/            ← Student portal avatars
│       ├── blog/               ← Blog article images
│       └── services/           ← Service section images
│
├── documentation/
│   └── customisation.md        ← Extended customisation guide
│
└── README.md                   ← This file
```

---

## Quick Start

### Option 1: Open Directly
Simply open `index.html` in any modern browser. All assets load locally — no build step required.

### Option 2: Local Server (Recommended)
```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code Live Server Extension
# Right-click index.html → Open with Live Server
```

Then visit: `http://localhost:8080`

---

## Customisation Guide

### Step 1 — Replace Images

All images are in `assets/images/`. Replace each placeholder with your own:

| Folder | What to add |
|---|---|
| `logo/` | `logo-icon.png` (40×40px), `favicon.png` (32×32px), partner logos |
| `hero/` | `hero-bg.jpg` (1920×1080px), `hero-trader.jpg` (600×700px) |
| `courses/` | `course-1.jpg` through `course-9.jpg` (400×250px) |
| `instructors/` | `instructor-1.jpg` through `instructor-6.jpg` (300×360px) |
| `testimonials/` | `avatar-1.jpg` through `avatar-5.jpg` (100×100px, circular crop) |
| `traders/` | `student-avatar.jpg` (100×100px) |
| `blog/` | `blog-1.jpg` through `blog-6.jpg` (800×500px) |

### Step 2 — Update Brand Name

Search and replace `Forex<span>Academy</span>` across all HTML files with your academy name:

```html
<!-- Change this in every file -->
<span class="brand-name">Your<span>Academy</span> Name</span>
```

Also update the `<title>` tag in each page's `<head>`.

### Step 3 — Update Contact Details

In `contact.html` and the footer of every page, update:
- Email address
- Phone / WhatsApp number
- Telegram handle
- Social media links

### Step 4 — Update Prices

Prices appear in:
- `pricing.html` — main pricing cards
- `course-single.html` — course buy card
- `courses.js` — course data array (the `price` and `original` fields)
- `mentorship.html` — mentorship package cards
- `funded-accounts.html` — challenge fees
- `account-management.html` — plan minimums

### Step 5 — Update Courses (courses.js)

Open `assets/js/courses.js` and edit the `courses` array at the top:

```javascript
const CourseCatalog = {
  courses: [
    {
      id: 1,
      title: 'Your Course Title',
      category: 'forex',          // forex | synthetic | technical | psychology | propfirm | management
      level: 'beginner',           // beginner | intermediate | advanced
      price: 197,
      original: 397,               // crossed-out original price
      duration: '12 hours',
      lessons: 42,
      students: 2840,
      rating: 4.9,
      instructor: {
        name: 'Your Instructor',
        title: 'Role / Title',
        avatar: 'assets/images/instructors/instructor-1.jpg'
      },
      thumb: 'assets/images/courses/course-1.jpg',
      desc: 'Course description here...',
      tags: ['forex', 'beginner'],
    },
    // Add more courses...
  ],
```

### Step 6 — Update Signals (signals.js)

Edit the `sampleData` array in `assets/js/signals.js` with your real signals:

```javascript
sampleData: [
  {
    id: 1,
    pair: 'EUR/USD',
    type: 'BUY',          // BUY | SELL
    entry: 1.08450,
    tp: [1.08720, 1.09100], // TP1, TP2
    sl: 1.08180,
    pips: 270,
    rr: '1:3',
    status: 'active',     // active | pending | hit | stopped
    time: '09:15',
    date: 'Today',
    accuracy: 82,
    category: 'forex',    // forex | synthetic | commodities
  },
],
```

---

## Color Themes

The default theme is **Gold & Black**. Switch accent colour by adding `data-theme` to `<html>`:

```html
<!-- Gold (default — no attribute needed) -->
<html lang="en">

<!-- Royal Blue -->
<html lang="en" data-theme="blue">

<!-- Emerald Green -->
<html lang="en" data-theme="emerald">

<!-- Purple -->
<html lang="en" data-theme="purple">
```

### Custom Colour

Override in `assets/css/themes.css`:

```css
:root {
  --color-gold:       #YOUR_HEX;
  --color-gold-light: #LIGHTER_HEX;
  --color-gold-dark:  #DARKER_HEX;
}
```

---

## Pages Reference

| Page | File | Key JS |
|---|---|---|
| Home | `index.html` | `main.js` |
| About | `about.html` | `main.js` |
| Courses | `courses.html` | `courses.js` |
| Course Detail | `course-single.html` | `main.js` |
| Signals | `signals.html` | `signals.js` |
| Mentorship | `mentorship.html` | `main.js` |
| Account Management | `account-management.html` | `account-management.js` |
| Funded Accounts | `funded-accounts.html` | `main.js` |
| Synthetic Indices | `synthetic-indices.html` | `main.js` |
| Forex Trading | `forex-trading.html` | `main.js` |
| Testimonials | `testimonials.html` | `main.js` |
| Pricing | `pricing.html` | `main.js` |
| Blog | `blog.html` | `main.js` |
| Blog Post | `blog-single.html` | `main.js` |
| FAQ | `faq.html` | `main.js` |
| Contact | `contact.html` | `main.js` |

---

## Student Portal

All portal pages live in `student-portal/`. They use:
- `assets/css/dashboard.css` — sidebar, topbar, widgets
- `assets/js/dashboard.js` — sidebar toggle, charts, notifications
- `assets/js/main.js` — theme toggle, tabs, FAQ, etc.

### Linking paths (from student-portal/ to root)
All asset paths in portal pages use `../` prefix:
```html
<link rel="stylesheet" href="../assets/css/style.css">
<script src="../assets/js/main.js"></script>
<a href="../index.html">Back to Website</a>
```

---

## Admin Dashboard

All admin pages live in `admin/`. Same path convention as student portal (`../assets/`).

### Admin Features
- Sidebar with collapse (click the hamburger icon)
- Real-time search filtering in student table (`data-table-search`)
- Select-all checkbox system (`data-select-all`, `data-row-check`)
- Revenue and student charts via Chart.js
- Notification drawer

---

## JavaScript Modules

### main.js
| Module | Description |
|---|---|
| `PageLoader` | Fade-out page loader on window load |
| `Navbar` | Scroll effect, mobile toggle, active page detection |
| `ScrollTop` | Back-to-top button visibility & click |
| `FAQ` | Accordion open/close |
| `Tabs` | Tab switching via `data-tab` |
| `Counter` | Animated number counting on scroll (`data-count`) |
| `Ticker` | Simulated Forex ticker with live price updates |
| `ThemeToggle` | Dark/Light mode, persisted to localStorage |
| `StaggerObserver` | IntersectionObserver for `.stagger-children` |
| `SwiperInit` | Initialises testimonial and course sliders |
| `SmoothAnchors` | Smooth scroll for `href="#anchor"` links |
| `Toast` | Global toast notifications (`Toast.show(msg, type)`) |
| `FormValidator` | Basic required field and email validation |
| `Newsletter` | Newsletter form submission with toast |
| `CookieBanner` | Cookie consent banner |

### dashboard.js
| Module | Description |
|---|---|
| `Sidebar` | Collapse/expand, mobile open/close, active link |
| `NotifDrawer` | Notification drawer toggle |
| `DashCharts` | Revenue, students, course, radar charts |
| `AdminActions` | Table select-all, search filter, modal handling |

### courses.js
- `CourseCatalog` — full catalogue with filter, search, sort, wishlist

### signals.js
- `SignalEngine` — signal grid render, filter, search, live updates
- `SignalStats` — stat counters for signals page

### account-management.js
- `AccountManagement` — plan cards, profit calculator, AM chart, onboarding steps
- `ChartUtils` — shared chart helpers (sparklines, candle data)

---

## Vendor Libraries

| Library | Version | Files |
|---|---|---|
| AOS | 2.3.4 | `vendors/aos/aos.js`, `vendors/aos/aos.css` |
| Swiper | 11.0.5 | `vendors/swiper/swiper-bundle.min.js`, `.css` |
| Chart.js | 4.4.1 | `vendors/chartjs/chart.umd.min.js` |
| Font Awesome | 6.5.0 | CDN (requires internet) |
| Google Fonts | — | CDN (requires internet) |

### Offline/Self-hosted Fonts
Download from Google Fonts and place in `assets/fonts/`. Then update the `@import` at the top of `style.css`:

```css
/* Remove the @import line and add instead: */
@font-face {
  font-family: 'Syne';
  src: url('../fonts/Syne-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
/* Repeat for Inter and JetBrains Mono */
```

---

## Image Guide

### Recommended Sizes

| Use | Recommended Size | Format |
|---|---|---|
| Logo icon | 40×40px or 80×80px (2x) | PNG with transparency |
| Favicon | 32×32px | PNG or ICO |
| Hero background | 1920×1080px | JPG, ≤400KB |
| Hero trader portrait | 600×700px | JPG, ≤200KB |
| Course thumbnails | 800×500px | JPG, ≤150KB |
| Instructor photos | 400×480px | JPG, ≤100KB |
| Testimonial avatars | 200×200px | JPG, circular |
| Blog featured images | 1200×750px | JPG, ≤300KB |
| Partner logos | 240×80px | PNG with transparency |

### Image Optimisation Tips
- Use [Squoosh.app](https://squoosh.app) to compress images
- Convert to WebP for better performance
- Always add descriptive `alt` text for accessibility

---

## Fonts

The template uses three typefaces:

| Font | Usage | Weights |
|---|---|---|
| **Syne** | Headings, display text, brand name | 400, 500, 600, 700, 800 |
| **Inter** | Body text, UI labels, paragraphs | 300, 400, 500, 600, 700 |
| **JetBrains Mono** | Prices, forex pairs, trade data | 400, 500 |

Change fonts by updating the `@import` URL in `style.css` and the CSS variables:
```css
:root {
  --font-display: 'Your Heading Font', sans-serif;
  --font-body:    'Your Body Font', sans-serif;
  --font-mono:    'Your Mono Font', monospace;
}
```

---

## Responsive Design

Breakpoints defined in `responsive.css`:

| Breakpoint | Width | Target |
|---|---|---|
| Large Desktop | 1440px+ | Wide monitors |
| Desktop | 1200px – 1439px | Standard desktop |
| Tablet | 768px – 1199px | iPads, small laptops |
| Mobile | 480px – 767px | Phones landscape |
| Small Mobile | ≤479px | Phones portrait |

### Key responsive changes at ≤1024px:
- Navbar collapses → hamburger menu appears
- Hero grid becomes single column
- 4-column grids become 2-column

### Key responsive changes at ≤767px:
- All grids become 1-column
- Footer columns stack vertically
- Hero stats wrap

### Key responsive changes at ≤480px:
- Font sizes scale down via `clamp()`
- Buttons go full width
- Dashboard stats become 1 column

---

## Dark/Light Mode

**Dark mode is the default.** Light mode activates when `.light-mode` is on `<html>`.

The `ThemeToggle` module in `main.js` handles this automatically. It persists the preference to `localStorage` under the key `fap-theme`.

To default to light mode, set in your server or `<script>`:
```javascript
document.documentElement.classList.add('light-mode');
```

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 88+ | ✅ Full |
| Safari 14+ | ✅ Full |
| Edge 90+ | ✅ Full |
| Opera 76+ | ✅ Full |
| IE 11 | ❌ Not supported |
| Samsung Internet 14+ | ✅ Full |

---

## Deployment

### Static Hosting (No backend)
This is a **pure HTML/CSS/JS template** — no PHP, Node, or database required.

**Recommended hosts:**
- [Netlify](https://netlify.com) — drag and drop the folder
- [Vercel](https://vercel.com) — `vercel deploy`
- [GitHub Pages](https://pages.github.com)
- [Cloudflare Pages](https://pages.cloudflare.com)
- Any cPanel/shared hosting — upload via FTP

### Netlify One-Click Deploy
1. Zip the `forex-academy-pro` folder
2. Go to [app.netlify.com](https://app.netlify.com)
3. Drag and drop the zip file onto the Netlify dashboard
4. Your site is live in seconds

### Custom Domain
After deploying, add your custom domain in your hosting provider's settings. Then update any hardcoded absolute URLs.

### Backend / CMS Integration
To add real authentication, databases, or CMS:
- **WordPress** — Convert HTML to a WordPress theme
- **Webflow** — Recreate in Webflow using this as a design reference
- **Supabase + Auth** — Add Supabase for auth and database
- **Firebase** — Use Firebase Auth + Firestore

---

## Customisation Checklist

Use this checklist before going live:

### Content
- [ ] Replace all placeholder images with real photos
- [ ] Update brand name in all files (find & replace)
- [ ] Update logo files (`logo-icon.png`, `favicon.png`)
- [ ] Update `<title>` tags on all pages
- [ ] Update `meta name="description"` on all pages
- [ ] Replace placeholder email addresses
- [ ] Replace placeholder phone/WhatsApp numbers
- [ ] Update Telegram, Instagram, YouTube, Twitter links
- [ ] Update course data in `courses.js`
- [ ] Update signal data in `signals.js`
- [ ] Update team/instructor names and bios
- [ ] Update pricing in `pricing.html`
- [ ] Update testimonials with real student feedback
- [ ] Update FAQ with your actual questions
- [ ] Update footer disclaimer with your legal text

### Branding
- [ ] Choose your colour theme (gold/blue/emerald/purple) or set custom
- [ ] Update font selection if desired
- [ ] Set correct partner logo images

### Technical
- [ ] Test all links (no broken hrefs)
- [ ] Test on mobile (iPhone, Android)
- [ ] Test on tablet (iPad)
- [ ] Test dark/light mode toggle
- [ ] Test contact form (add backend or Formspree)
- [ ] Test newsletter form (connect to Mailchimp, ConvertKit etc.)
- [ ] Add Google Analytics or Plausible tracking
- [ ] Set up SSL certificate on your domain
- [ ] Test page load speed with [PageSpeed Insights](https://pagespeed.web.dev)
- [ ] Submit sitemap to Google Search Console

### Forms (Connect a backend)
The contact and newsletter forms are HTML-only by default. Connect them using:
- **Formspree** — `action="https://formspree.io/f/YOUR_ID"`
- **Netlify Forms** — Add `netlify` attribute to `<form>`
- **EmailJS** — JavaScript email service
- **Custom backend** — PHP `mail()`, Node.js, etc.

---

## Support

For questions, customisation help, or bug reports:

- 📧 **Email:** support@claudefxacademypro.com
- 💬 **WhatsApp:** +(237)-675175534
- 📱 **Telegram:** @ClaudefxAcademyPro

### Common Issues

**Images not showing?**
Check that file paths are correct relative to each HTML file. Root pages use `assets/images/...`, portal/admin pages use `../assets/images/...`.

**Fonts not loading?**
Ensure you have an internet connection (Google Fonts loads from CDN). For offline use, self-host the fonts as described in the [Fonts](#fonts) section.

**Charts not rendering?**
Charts require `assets/vendors/chartjs/chart.umd.min.js` to be present. Ensure the vendors folder was included.

**Sidebar not collapsing?**
The sidebar toggle requires `assets/js/dashboard.js` to be loaded. Check the `<script>` tag at the bottom of portal/admin pages.

**Swiper not working?**
Ensure both `swiper-bundle.min.js` and `swiper-bundle.min.css` are present in `assets/vendors/swiper/`.

---

## License

This template is sold for **commercial use**. You may:
- ✅ Use for one client or personal project
- ✅ Modify any HTML, CSS, or JS
- ✅ Remove template credits from the footer
- ✅ Use for SaaS, subscription, or monetised platforms

You may **not**:
- ❌ Resell or redistribute the template as a product
- ❌ Share the source code publicly
- ❌ Claim ownership of the original design

---

*Built with ❤️ for the trading community — Forex Academy Pro Template v1.0.0*
