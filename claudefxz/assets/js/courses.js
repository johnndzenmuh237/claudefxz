/* ============================================================
   FOREX ACADEMY PRO — courses.js
   Course listing, filtering, search & enrollment
   ============================================================ */

'use strict';

const CourseCatalog = {
  courses: [
    {
      id: 1,
      title: 'Forex Trading Fundamentals',
      category: 'forex',
      level: 'beginner',
      price: 197,
      original: 397,
      duration: '12 hours',
      lessons: 42,
      students: 2840,
      rating: 4.9,
      instructor: { name: 'David Okafor', title: 'Senior FX Analyst', avatar: 'assets/images/instructors/instructor-1.jpg' },
      thumb: 'assets/images/courses/course-1.jpg',
      desc: 'Master the foundational principles of Forex trading. Covers currency pairs, market structure, sessions, and your first live trade.',
      tags: ['forex', 'beginner', 'fundamentals'],
    },
    {
      id: 2,
      title: 'Advanced Technical Analysis',
      category: 'technical',
      level: 'intermediate',
      price: 297,
      original: 597,
      duration: '18 hours',
      lessons: 64,
      students: 1920,
      rating: 4.8,
      instructor: { name: 'Sarah Mensah', title: 'Chart Pattern Specialist', avatar: 'assets/images/instructors/instructor-2.jpg' },
      thumb: 'assets/images/courses/course-2.jpg',
      desc: 'Deep dive into chart patterns, indicators, Fibonacci, ICT concepts, and confluence trading strategies used by professionals.',
      tags: ['technical', 'patterns', 'indicators'],
    },
    {
      id: 3,
      title: 'Synthetic Indices Mastery',
      category: 'synthetic',
      level: 'intermediate',
      price: 247,
      original: 497,
      duration: '15 hours',
      lessons: 54,
      students: 3210,
      rating: 4.9,
      instructor: { name: 'Emmanuel Asante', title: 'Synthetic Indices Trader', avatar: 'assets/images/instructors/instructor-3.jpg' },
      thumb: 'assets/images/courses/course-3.jpg',
      desc: 'The complete guide to trading Volatility 75, Crash/Boom, Step Index and all Deriv synthetic indices profitably.',
      tags: ['synthetic', 'volatility', 'deriv'],
    },
    {
      id: 4,
      title: 'Risk Management & Psychology',
      category: 'psychology',
      level: 'beginner',
      price: 147,
      original: 297,
      duration: '8 hours',
      lessons: 28,
      students: 4105,
      rating: 4.7,
      instructor: { name: 'Linda Boateng', title: 'Trading Psychologist', avatar: 'assets/images/instructors/instructor-4.jpg' },
      thumb: 'assets/images/courses/course-4.jpg',
      desc: 'Develop unshakeable trading discipline. Master position sizing, drawdown control, and the winning trader mindset.',
      tags: ['risk', 'psychology', 'mindset'],
    },
    {
      id: 5,
      title: 'Price Action Trading',
      category: 'technical',
      level: 'intermediate',
      price: 267,
      original: 527,
      duration: '16 hours',
      lessons: 58,
      students: 2290,
      rating: 4.8,
      instructor: { name: 'Kwame Darko', title: 'Price Action Expert', avatar: 'assets/images/instructors/instructor-5.jpg' },
      thumb: 'assets/images/courses/course-5.jpg',
      desc: 'Trade naked charts with confidence. Learn candlestick formations, support/resistance, supply and demand zones.',
      tags: ['price action', 'candlesticks', 'support resistance'],
    },
    {
      id: 6,
      title: 'Funded Account Blueprint',
      category: 'propfirm',
      level: 'advanced',
      price: 347,
      original: 697,
      duration: '20 hours',
      lessons: 72,
      students: 1680,
      rating: 4.9,
      instructor: { name: 'Nana Amponsah', title: 'Funded Trader & Coach', avatar: 'assets/images/instructors/instructor-6.jpg' },
      thumb: 'assets/images/courses/course-6.jpg',
      desc: 'Pass FTMO, MyForexFunds, and other prop firm challenges. Covers strategy, rules compliance, and scaling capital.',
      tags: ['funded', 'prop firm', 'FTMO'],
    },
    {
      id: 7,
      title: 'ICT Concepts & Smart Money',
      category: 'technical',
      level: 'advanced',
      price: 397,
      original: 797,
      duration: '24 hours',
      lessons: 88,
      students: 987,
      rating: 4.9,
      instructor: { name: 'David Okafor', title: 'Senior FX Analyst', avatar: 'assets/images/instructors/instructor-1.jpg' },
      thumb: 'assets/images/courses/course-7.jpg',
      desc: 'Master Inner Circle Trader methodology. Order blocks, fair value gaps, liquidity pools, and institutional order flow.',
      tags: ['ICT', 'smart money', 'institutional'],
    },
    {
      id: 8,
      title: 'Account Management Strategies',
      category: 'management',
      level: 'advanced',
      price: 497,
      original: 997,
      duration: '22 hours',
      lessons: 80,
      students: 543,
      rating: 4.8,
      instructor: { name: 'Sarah Mensah', title: 'Account Manager', avatar: 'assets/images/instructors/instructor-2.jpg' },
      thumb: 'assets/images/courses/course-8.jpg',
      desc: 'Build a professional account management business. Client relations, reporting, drawdown management, and legal compliance.',
      tags: ['account management', 'business', 'clients'],
    },
    {
      id: 9,
      title: 'Forex for Complete Beginners',
      category: 'forex',
      level: 'beginner',
      price: 97,
      original: 197,
      duration: '6 hours',
      lessons: 20,
      students: 6842,
      rating: 4.6,
      instructor: { name: 'Linda Boateng', title: 'Trading Educator', avatar: 'assets/images/instructors/instructor-4.jpg' },
      thumb: 'assets/images/courses/course-9.jpg',
      desc: 'Your very first step into Forex. No prior experience needed. Learn what Forex is, how it works, and how to get started safely.',
      tags: ['forex', 'beginner', 'starter'],
    },
  ],

  filter: { category: 'all', level: 'all', search: '' },
  sort: 'popular',
  grid: null,
  count: null,

  init() {
    this.grid  = document.querySelector('[data-courses-grid]');
    this.count = document.querySelector('[data-courses-count]');
    if (!this.grid) return;

    this.render();
    this.bindFilters();
    this.bindSearch();
    this.bindSort();
  },

  getFiltered() {
    let list = [...this.courses];

    if (this.filter.category !== 'all') {
      list = list.filter(c => c.category === this.filter.category);
    }
    if (this.filter.level !== 'all') {
      list = list.filter(c => c.level === this.filter.level);
    }
    if (this.filter.search) {
      const q = this.filter.search.toLowerCase();
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.desc.toLowerCase().includes(q) ||
        c.tags.some(t => t.includes(q))
      );
    }

    // Sort
    switch (this.sort) {
      case 'popular':  list.sort((a, b) => b.students - a.students); break;
      case 'rating':   list.sort((a, b) => b.rating - a.rating);     break;
      case 'newest':   list.sort((a, b) => b.id - a.id);             break;
      case 'price-lo': list.sort((a, b) => a.price - b.price);       break;
      case 'price-hi': list.sort((a, b) => b.price - a.price);       break;
    }
    return list;
  },

  render() {
    const list = this.getFiltered();
    if (this.count) this.count.textContent = `${list.length} course${list.length !== 1 ? 's' : ''}`;

    if (!list.length) {
      this.grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:4rem; color:var(--color-text-muted);">
          <i class="fas fa-graduation-cap" style="font-size:2.5rem; margin-bottom:1rem; display:block; color:var(--color-dark-4);"></i>
          <p>No courses found. Try a different filter.</p>
        </div>`;
      return;
    }

    this.grid.innerHTML = list.map(c => this.buildCard(c)).join('');

    // Wishlist toggle
    this.grid.querySelectorAll('.wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.toggle('active');
        btn.querySelector('i').className = btn.classList.contains('active')
          ? 'fas fa-heart' : 'far fa-heart';
        btn.style.color = btn.classList.contains('active')
          ? 'var(--color-danger)' : '';
      });
    });
  },

  buildCard(c) {
    const stars = '★'.repeat(Math.floor(c.rating)) + (c.rating % 1 >= 0.5 ? '⭐' : '');
    const discount = Math.round((1 - c.price / c.original) * 100);
    const levelClass = { beginner: 'level-beginner', intermediate: 'level-intermediate', advanced: 'level-advanced' };

    return `
      <div class="course-card" data-aos="fade-up">
        <div class="course-thumb">
          <img src="${c.thumb}" alt="${c.title}" loading="lazy"
            onerror="this.src='assets/images/courses/placeholder.jpg'">
          <div class="course-thumb-overlay">
            <span class="course-level ${levelClass[c.level]}">${c.level}</span>
          </div>
          <button class="wishlist-btn" style="position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.5); border:none; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; font-size:14px; transition:all 0.2s;">
            <i class="far fa-heart"></i>
          </button>
          ${discount >= 20 ? `<span style="position:absolute;top:12px;left:12px;background:var(--color-danger);color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;">-${discount}%</span>` : ''}
        </div>
        <div class="course-body">
          <div class="course-category">${c.category.toUpperCase()}</div>
          <h3 class="course-title">${c.title}</h3>
          <p class="course-desc">${c.desc}</p>
          <div class="course-meta">
            <span><i class="fas fa-clock"></i> ${c.duration}</span>
            <span><i class="fas fa-play-circle"></i> ${c.lessons} lessons</span>
            <span><i class="fas fa-users"></i> ${c.students.toLocaleString()}</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px; font-size:13px; margin-bottom:16px;">
            <span style="color:var(--color-gold);">${c.rating}</span>
            <span style="color:var(--color-gold); letter-spacing:-1px; font-size:12px;">${'★'.repeat(Math.round(c.rating))}</span>
            <span style="color:var(--color-text-muted);">(${(c.students * 0.4).toFixed(0)} reviews)</span>
          </div>
          <div class="course-instructor">
            <img class="instructor-avatar" src="${c.instructor.avatar}" alt="${c.instructor.name}"
              onerror="this.src='assets/images/instructors/placeholder.jpg'">
            <div>
              <div class="instructor-name">${c.instructor.name}</div>
              <div class="instructor-title">${c.instructor.title}</div>
            </div>
            <div class="course-price">
              <div class="price">$${c.price}</div>
              <div class="price-original">$${c.original}</div>
            </div>
          </div>
          <a href="course-single.html?id=${c.id}" class="btn btn-primary w-full mt-4" style="justify-content:center; margin-top:16px;">
            <i class="fas fa-graduation-cap"></i> Enroll Now
          </a>
        </div>
      </div>`;
  },

  bindFilters() {
    document.querySelectorAll('[data-course-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [key, val] = btn.dataset.courseFilter.split(':');
        document.querySelectorAll(`[data-course-filter^="${key}:"]`).forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter[key] = val;
        this.render();
      });
    });
  },

  bindSearch() {
    const input = document.querySelector('[data-course-search]');
    if (!input) return;
    let timer;
    input.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.filter.search = e.target.value.trim();
        this.render();
      }, 300);
    });
  },

  bindSort() {
    const select = document.querySelector('[data-course-sort]');
    if (!select) return;
    select.addEventListener('change', () => {
      this.sort = select.value;
      this.render();
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CourseCatalog.init();
});
