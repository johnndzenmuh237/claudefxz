/* ============================================================
   FOREX ACADEMY PRO — dashboard.js
   Student Portal & Admin Dashboard logic
   ============================================================ */

'use strict';

/* ────────────────────────────────────────────────────────────
   Sidebar
──────────────────────────────────────────────────────────── */
const Sidebar = {
  el: null,
  main: null,
  overlay: null,
  isCollapsed: false,
  isMobileOpen: false,

  init() {
    this.el      = document.querySelector('.sidebar');
    this.main    = document.querySelector('.dashboard-main');
    this.overlay = document.querySelector('.sidebar-overlay');
    if (!this.el) return;

    this.restoreState();
    this.bindEvents();
    this.setActivePage();
  },

  bindEvents() {
    // Desktop collapse toggle
    const toggleBtn = this.el.querySelector('.sidebar-toggle');
    toggleBtn?.addEventListener('click', () => this.toggleCollapse());

    // Mobile open via topbar
    const mobileToggle = document.querySelector('.topbar-mobile-toggle');
    mobileToggle?.addEventListener('click', () => this.toggleMobile());

    // Close on overlay click
    this.overlay?.addEventListener('click', () => this.closeMobile());

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMobileOpen) this.closeMobile();
    });
  },

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
    this.el.classList.toggle('collapsed', this.isCollapsed);
    this.main?.classList.toggle('sidebar-collapsed', this.isCollapsed);
    localStorage.setItem('fap-sidebar', this.isCollapsed ? '1' : '0');
  },

  toggleMobile() {
    this.isMobileOpen ? this.closeMobile() : this.openMobile();
  },

  openMobile() {
    this.isMobileOpen = true;
    this.el.classList.add('mobile-open');
    this.overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeMobile() {
    this.isMobileOpen = false;
    this.el.classList.remove('mobile-open');
    this.overlay?.classList.remove('active');
    document.body.style.overflow = '';
  },

  restoreState() {
    const stored = localStorage.getItem('fap-sidebar');
    if (stored === '1') {
      this.isCollapsed = true;
      this.el.classList.add('collapsed');
      this.main?.classList.add('sidebar-collapsed');
    }
  },

  setActivePage() {
    const path = window.location.pathname.split('/').pop() || 'dashboard.html';
    this.el.querySelectorAll('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href')?.split('/').pop();
      link.classList.toggle('active', href === path);
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Notification Drawer
──────────────────────────────────────────────────────────── */
const NotifDrawer = {
  drawer: null,
  isOpen: false,

  init() {
    this.drawer = document.querySelector('.notif-drawer');
    if (!this.drawer) return;

    document.querySelectorAll('[data-notif-toggle]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    });

    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.drawer.contains(e.target)) this.close();
    });
  },

  toggle() { this.isOpen ? this.close() : this.open(); },

  open() {
    this.isOpen = true;
    this.drawer.classList.add('open');
  },

  close() {
    this.isOpen = false;
    this.drawer.classList.remove('open');
  }
};

/* ────────────────────────────────────────────────────────────
   Dashboard Charts (Chart.js)
──────────────────────────────────────────────────────────── */
const DashCharts = {
  defaults: {
    color: '#C9A84C',
    gridColor: 'rgba(255,255,255,0.05)',
    textColor: '#9CA3B0',
    fontFamily: "'Inter', sans-serif",
  },

  init() {
    if (typeof Chart === 'undefined') return;

    Chart.defaults.color = this.defaults.textColor;
    Chart.defaults.font.family = this.defaults.fontFamily;
    Chart.defaults.font.size = 12;

    this.initRevenueChart();
    this.initStudentsChart();
    this.initCourseChart();
    this.initPerformanceChart();
  },

  initRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data   = [4200, 5800, 4900, 7200, 8400, 9100, 7800, 10200, 11400, 9800, 12600, 14200];

    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue ($)',
          data,
          borderColor: this.defaults.color,
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(201,168,76,0.25)');
            gradient.addColorStop(1, 'rgba(201,168,76,0)');
            return gradient;
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: this.defaults.color,
          pointBorderColor: '#111318',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1F242E',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: ctx => ` $${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: this.defaults.gridColor },
            border: { display: false },
          },
          y: {
            grid: { color: this.defaults.gridColor },
            border: { display: false },
            ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'K' }
          }
        }
      }
    });
  },

  initStudentsChart() {
    const ctx = document.getElementById('studentsChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'New Students',
            data: [42, 68, 54, 89, 112, 97],
            backgroundColor: 'rgba(201,168,76,0.7)',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Graduates',
            data: [18, 24, 31, 40, 55, 48],
            backgroundColor: 'rgba(34,197,94,0.5)',
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            backgroundColor: '#1F242E',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
          }
        },
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: { grid: { color: this.defaults.gridColor }, border: { display: false } }
        }
      }
    });
  },

  initCourseChart() {
    const ctx = document.getElementById('courseChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Forex Basics', 'Technical Analysis', 'Risk Management', 'Synthetic Indices', 'Price Action'],
        datasets: [{
          data: [35, 28, 18, 12, 7],
          backgroundColor: [
            '#C9A84C',
            '#4A9EFF',
            '#22C55E',
            '#A855F7',
            '#EF4444',
          ],
          borderColor: '#111318',
          borderWidth: 3,
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'right',
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle', font: { size: 12 } }
          },
          tooltip: {
            backgroundColor: '#1F242E',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` }
          }
        }
      }
    });
  },

  initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Accuracy', 'Risk/Reward', 'Discipline', 'Strategy', 'Psychology', 'Execution'],
        datasets: [{
          label: 'Your Score',
          data: [78, 65, 82, 71, 68, 75],
          borderColor: '#C9A84C',
          backgroundColor: 'rgba(201,168,76,0.12)',
          borderWidth: 2,
          pointBackgroundColor: '#C9A84C',
          pointBorderColor: '#111318',
          pointBorderWidth: 2,
          pointRadius: 4,
        }, {
          label: 'Average Trader',
          data: [55, 48, 60, 52, 50, 58],
          borderColor: 'rgba(255,255,255,0.2)',
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderWidth: 1,
          pointBackgroundColor: 'rgba(255,255,255,0.3)',
          pointRadius: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { padding: 16, usePointStyle: true, pointStyle: 'circle' }
          }
        },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { stepSize: 20, display: false },
            grid: { color: this.defaults.gridColor },
            pointLabels: { color: this.defaults.textColor, font: { size: 12 } },
            angleLines: { color: this.defaults.gridColor }
          }
        }
      }
    });
  }
};

/* ────────────────────────────────────────────────────────────
   Admin Actions (students, payments, etc.)
──────────────────────────────────────────────────────────── */
const AdminActions = {
  init() {
    // Table row checkbox select all
    const selectAll = document.querySelector('[data-select-all]');
    const checkboxes = document.querySelectorAll('[data-row-check]');
    if (selectAll) {
      selectAll.addEventListener('change', () => {
        checkboxes.forEach(cb => { cb.checked = selectAll.checked; });
        this.updateBulkActions(checkboxes);
      });
    }
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => this.updateBulkActions(checkboxes));
    });

    // Search filter
    const searchInput = document.querySelector('[data-table-search]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('[data-table-row]').forEach(row => {
          row.style.display = row.textContent.toLowerCase().includes(val) ? '' : 'none';
        });
      });
    }

    // Modal triggers
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.querySelector(btn.dataset.modalOpen);
        target?.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
    document.querySelectorAll('[data-modal-close], .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) {
          document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
          document.body.style.overflow = '';
        }
      });
    });
  },

  updateBulkActions(checkboxes) {
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    const bulkBar = document.querySelector('.bulk-actions');
    if (bulkBar) bulkBar.classList.toggle('visible', anyChecked);
  }
};

/* ────────────────────────────────────────────────────────────
   Bootstrap
──────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Sidebar.init();
  NotifDrawer.init();
  DashCharts.init();
  AdminActions.init();
});
