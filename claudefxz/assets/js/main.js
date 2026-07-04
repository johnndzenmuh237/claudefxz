/* ============================================================
   FOREX ACADEMY PRO — main.js
   Core site-wide JavaScript
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   Page Loader
──────────────────────────────────────────────────────────── */
const PageLoader = {
  init() {
    const loader = document.querySelector('.page-loader');
    if (!loader) return;
    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 400);
      }, 300);
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Navbar
──────────────────────────────────────────────────────────── */
const Navbar = {
  el: null,
  hamburger: null,
  mobileNav: null,
  overlay: null,
  isOpen: false,

  init() {
    this.el        = document.querySelector('.navbar');
    this.hamburger = document.querySelector('.hamburger');
    this.mobileNav = document.querySelector('.mobile-nav');
    if (!this.el) return;

    this.handleScroll();
    this.bindEvents();
    this.setActivePage();
  },

  handleScroll() {
    const onScroll = () => {
      if (window.scrollY > 40) {
        this.el.classList.add('scrolled');
      } else {
        this.el.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  },

  bindEvents() {
    if (this.hamburger && this.mobileNav) {
      this.hamburger.addEventListener('click', () => this.toggleMobileNav());
    }
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.isOpen &&
          !this.mobileNav.contains(e.target) &&
          !this.hamburger.contains(e.target)) {
        this.closeMobileNav();
      }
    });
    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) this.closeMobileNav();
    });
  },

  toggleMobileNav() {
    this.isOpen ? this.closeMobileNav() : this.openMobileNav();
  },

  openMobileNav() {
    this.isOpen = true;
    this.hamburger.classList.add('active');
    this.mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeMobileNav() {
    this.isOpen = false;
    this.hamburger?.classList.remove('active');
    this.mobileNav?.classList.remove('open');
    document.body.style.overflow = '';
  },

  setActivePage() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link, .mobile-nav a').forEach(link => {
      const href = link.getAttribute('href')?.split('/').pop();
      if (href === path) link.classList.add('active');
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Scroll to Top
──────────────────────────────────────────────────────────── */
const ScrollTop = {
  btn: null,
  init() {
    this.btn = document.querySelector('.scroll-top');
    if (!this.btn) return;
    this.btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', () => {
      this.btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
  }
};

/* ────────────────────────────────────────────────────────────
   FAQ Accordion
──────────────────────────────────────────────────────────── */
const FAQ = {
  init() {
    document.querySelectorAll('.faq-question').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.faq-item');
        const isOpen = item.classList.contains('open');
        // Close all
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        // Open clicked if it wasn't open
        if (!isOpen) item.classList.add('open');
      });
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Tabs
──────────────────────────────────────────────────────────── */
const Tabs = {
  init() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        const container = btn.closest('[data-tabs]') || document;

        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const pane = container.querySelector(`#${target}`);
        if (pane) pane.classList.add('active');
      });
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Counter Animation
──────────────────────────────────────────────────────────── */
const Counter = {
  init() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const duration = parseInt(el.dataset.duration) || 2000;
        const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;

        this.animateCount(el, 0, target, duration, prefix, suffix, decimals);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  },

  animateCount(el, start, end, duration, prefix, suffix, decimals) {
    const startTime = performance.now();
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const value = start + (end - start) * eased;
      el.textContent = prefix + value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }
};

/* ────────────────────────────────────────────────────────────
   Ticker (live forex prices simulation)
──────────────────────────────────────────────────────────── */
const Ticker = {
  pairs: [
    { pair: 'EUR/USD', price: 1.08432, change: +0.12 },
    { pair: 'GBP/USD', price: 1.26891, change: -0.08 },
    { pair: 'USD/JPY', price: 149.820, change: +0.31 },
    { pair: 'AUD/USD', price: 0.64712, change: -0.15 },
    { pair: 'USD/CAD', price: 1.35640, change: +0.09 },
    { pair: 'EUR/GBP', price: 0.85432, change: -0.04 },
    { pair: 'NZD/USD', price: 0.59821, change: +0.22 },
    { pair: 'USD/CHF', price: 0.88912, change: -0.11 },
    { pair: 'XAU/USD', price: 2341.50, change: +0.44 },
    { pair: 'BTC/USD', price: 68420.0, change: +1.82 },
    { pair: 'CRASH 500', price: 1000.20, change: -0.55 },
    { pair: 'BOOM 1000', price: 1421.60, change: +0.63 },
    { pair: 'VOLATILITY 75', price: 548.32, change: -0.28 },
    { pair: 'STEP INDEX', price: 8234.10, change: +0.14 },
  ],

  init() {
    const inner = document.querySelector('.ticker-inner');
    if (!inner) return;
    this.render(inner);
    this.simulatePrices(inner);
  },

  render(container) {
    const items = this.pairs.map(p => this.buildItem(p)).join('<span class="ticker-sep">|</span>');
    container.innerHTML = items + items; // duplicate for seamless loop
  },

  buildItem(p) {
    const dir = p.change >= 0 ? 'up' : 'down';
    const arrow = p.change >= 0 ? '▲' : '▼';
    return `
      <span class="ticker-item">
        <span class="ticker-pair">${p.pair}</span>
        <span class="ticker-price">${p.price.toFixed(p.price > 999 ? 2 : 5)}</span>
        <span class="ticker-change ${dir}">${arrow} ${Math.abs(p.change).toFixed(2)}%</span>
      </span>`;
  },

  simulatePrices(container) {
    setInterval(() => {
      this.pairs = this.pairs.map(p => ({
        ...p,
        price: p.price * (1 + (Math.random() - 0.5) * 0.0004),
        change: p.change + (Math.random() - 0.5) * 0.05,
      }));
      this.render(container);
    }, 3000);
  }
};

/* ────────────────────────────────────────────────────────────
   Theme Toggle
──────────────────────────────────────────────────────────── */
const ThemeToggle = {
  init() {
    const toggles = document.querySelectorAll('[data-theme-toggle]');
    const stored  = localStorage.getItem('fap-theme') || 'dark';
    this.apply(stored);

    toggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.classList.contains('light-mode') ? 'light' : 'dark';
        const next    = current === 'dark' ? 'light' : 'dark';
        this.apply(next);
        localStorage.setItem('fap-theme', next);
      });
    });
  },

  apply(theme) {
    document.documentElement.classList.toggle('light-mode', theme === 'light');
    document.querySelectorAll('[data-theme-toggle] i').forEach(i => {
      i.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Stagger Observer (AOS-lite fallback)
──────────────────────────────────────────────────────────── */
const StaggerObserver = {
  init() {
    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 600, easing: 'ease-out-quart', once: true, offset: 60 });
      return;
    }
    // Lightweight fallback
    const targets = document.querySelectorAll('.stagger-children');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    targets.forEach(el => observer.observe(el));
  }
};

/* ────────────────────────────────────────────────────────────
   Swiper Init (testimonials, courses)
──────────────────────────────────────────────────────────── */
const SwiperInit = {
  init() {
    if (typeof Swiper === 'undefined') return;

    // Testimonials
    const testimonialsEl = document.querySelector('.testimonials-swiper');
    if (testimonialsEl) {
      new Swiper(testimonialsEl, {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: true,
        autoplay: { delay: 4500, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true },
        navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
        breakpoints: {
          640:  { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }
      });
    }

    // Courses
    const coursesEl = document.querySelector('.courses-swiper');
    if (coursesEl) {
      new Swiper(coursesEl, {
        slidesPerView: 1,
        spaceBetween: 24,
        loop: false,
        pagination: { el: '.swiper-pagination', clickable: true },
        breakpoints: {
          640:  { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }
      });
    }
  }
};

/* ────────────────────────────────────────────────────────────
   Smooth Anchor Links
──────────────────────────────────────────────────────────── */
const SmoothAnchors = {
  init() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
        Navbar.closeMobileNav?.();
      });
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Toast Notification
──────────────────────────────────────────────────────────── */
const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.style.cssText = `
      position:fixed; bottom:24px; right:24px; z-index:9999;
      display:flex; flex-direction:column; gap:12px; pointer-events:none;
    `;
    document.body.appendChild(this.container);
    window.Toast = this;
  },

  show(message, type = 'info', duration = 4000) {
    const icons = { success: 'fa-check-circle', danger: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} animate-fade-up`;
    toast.style.cssText = 'pointer-events:all; min-width:280px; max-width:380px; box-shadow:0 8px 32px rgba(0,0,0,0.4);';
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

/* ────────────────────────────────────────────────────────────
   Form Validation Helper
──────────────────────────────────────────────────────────── */
const FormValidator = {
  init() {
    document.querySelectorAll('form[data-validate]').forEach(form => {
      form.addEventListener('submit', (e) => {
        if (!this.validate(form)) e.preventDefault();
      });
    });
  },

  validate(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      this.clearError(field);
      if (!field.value.trim()) {
        this.showError(field, 'This field is required.');
        valid = false;
      } else if (field.type === 'email' && !this.isEmail(field.value)) {
        this.showError(field, 'Please enter a valid email address.');
        valid = false;
      }
    });
    return valid;
  },

  showError(field, msg) {
    field.style.borderColor = 'var(--color-danger)';
    const err = document.createElement('span');
    err.className = 'form-error';
    err.style.cssText = 'font-size:12px; color:var(--color-danger); margin-top:4px; display:block;';
    err.textContent = msg;
    field.parentNode.appendChild(err);
  },

  clearError(field) {
    field.style.borderColor = '';
    field.parentNode.querySelector('.form-error')?.remove();
  },

  isEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }
};

/* ────────────────────────────────────────────────────────────
   Newsletter Form
──────────────────────────────────────────────────────────── */
const Newsletter = {
  init() {
    document.querySelectorAll('.newsletter-form').forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if (!input?.value.trim()) return;
        Toast.show('You\'re subscribed! Welcome to the community. 🎉', 'success');
        input.value = '';
      });
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Cookie Banner
──────────────────────────────────────────────────────────── */
const CookieBanner = {
  init() {
    if (localStorage.getItem('fap-cookies')) return;
    const banner = document.querySelector('.cookie-banner');
    if (!banner) return;
    setTimeout(() => banner.classList.add('visible'), 1000);

    banner.querySelector('[data-accept]')?.addEventListener('click', () => {
      localStorage.setItem('fap-cookies', '1');
      banner.classList.remove('visible');
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Bootstrap
──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  PageLoader.init();
  Navbar.init();
  ScrollTop.init();
  FAQ.init();
  Tabs.init();
  Counter.init();
  Ticker.init();
  ThemeToggle.init();
  StaggerObserver.init();
  SwiperInit.init();
  SmoothAnchors.init();
  Toast.init();
  FormValidator.init();
  Newsletter.init();
  CookieBanner.init();
});
