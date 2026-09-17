/* ============================================================
   FOREX ACADEMY PRO — signals.js
   Live signal feed & signal management
   ============================================================ */

'use strict';

const SignalEngine = {
  signals: [],
  container: null,
  filter: 'all',

  sampleData: [
    { id: 1,  pair: 'EUR/USD',       type: 'BUY',  entry: 1.08450, tp: [1.08720, 1.09100], sl: 1.08180, pips: 270, rr: '1:3',  status: 'active',   time: '09:15', date: 'Today',     accuracy: 82, category: 'forex' },
    { id: 2,  pair: 'GBP/JPY',       type: 'SELL', entry: 188.420, tp: [187.900, 187.200], sl: 188.950, pips: 520, rr: '1:2.8', status: 'active',  time: '10:32', date: 'Today',     accuracy: 76, category: 'forex' },
    { id: 3,  pair: 'VOLATILITY 75', type: 'BUY',  entry: 548.320, tp: [551.200, 554.000], sl: 546.100, pips: 288, rr: '1:3.2', status: 'active',  time: '11:00', date: 'Today',     accuracy: 79, category: 'synthetic' },
    { id: 4,  pair: 'CRASH 500',     type: 'SELL', entry: 1000.80, tp: [998.200, 995.000], sl: 1002.50, pips: 260, rr: '1:2.5', status: 'pending', time: '11:45', date: 'Today',     accuracy: 71, category: 'synthetic' },
    { id: 5,  pair: 'XAU/USD',       type: 'BUY',  entry: 2341.50, tp: [2356.00, 2370.00], sl: 2330.00, pips: 145, rr: '1:3.5', status: 'hit',     time: '08:00', date: 'Yesterday', accuracy: 88, category: 'commodities' },
    { id: 6,  pair: 'USD/JPY',       type: 'SELL', entry: 149.820, tp: [149.200, 148.600], sl: 150.350, pips: 620, rr: '1:2.2', status: 'hit',     time: '07:30', date: 'Yesterday', accuracy: 84, category: 'forex' },
    { id: 7,  pair: 'BOOM 1000',     type: 'BUY',  entry: 1421.60, tp: [1428.00, 1435.00], sl: 1416.00, pips: 640, rr: '1:4',   status: 'hit',     time: '14:20', date: 'Yesterday', accuracy: 91, category: 'synthetic' },
    { id: 8,  pair: 'AUD/USD',       type: 'SELL', entry: 0.64750, tp: [0.64450, 0.64100], sl: 0.65000, pips: 300, rr: '1:2',   status: 'stopped', time: '15:00', date: 'Yesterday', accuracy: 65, category: 'forex' },
    { id: 9,  pair: 'STEP INDEX',    type: 'BUY',  entry: 8234.10, tp: [8280.00, 8340.00], sl: 8195.00, pips: 459, rr: '1:3.3', status: 'active',  time: '12:15', date: 'Today',     accuracy: 77, category: 'synthetic' },
    { id: 10, pair: 'EUR/GBP',       type: 'BUY',  entry: 0.85430, tp: [0.85700, 0.86000], sl: 0.85180, pips: 270, rr: '1:2.9', status: 'pending', time: '13:00', date: 'Today',     accuracy: 73, category: 'forex' },
  ],

  init() {
    this.container = document.querySelector('[data-signals-grid]');
    if (!this.container) return;

    this.render();
    this.bindFilters();
    this.bindSearch();
    this.startLiveUpdates();
  },

  render() {
    const filtered = this.filter === 'all'
      ? this.sampleData
      : this.sampleData.filter(s =>
          s.status === this.filter || s.category === this.filter
        );

    if (!filtered.length) {
      this.container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--color-text-muted);">
          <i class="fas fa-search" style="font-size:2rem; margin-bottom:1rem; display:block;"></i>
          No signals match your filter.
        </div>`;
      return;
    }

    this.container.innerHTML = filtered.map(s => this.buildCard(s)).join('');
    this.container.querySelectorAll('.signal-expand').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.signal-card');
        const detail = card.querySelector('.signal-detail');
        if (detail) detail.classList.toggle('hidden');
        btn.querySelector('i').className = detail.classList.contains('hidden')
          ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
      });
    });
  },

  buildCard(s) {
    const statusClass = { active: 'success', pending: 'info', hit: 'success', stopped: 'danger' };
    const statusLabel = { active: 'Active', pending: 'Pending', hit: 'TP Hit ✓', stopped: 'SL Hit' };
    const typeClass   = s.type === 'BUY' ? 'signal-buy' : 'signal-sell';
    const typeIcon    = s.type === 'BUY' ? 'fa-arrow-up' : 'fa-arrow-down';

    const tp1 = s.tp[0];
    const tp2 = s.tp[1] || '';
    const priceDecimals = s.entry > 999 ? 2 : s.entry > 9 ? 3 : 5;

    return `
      <div class="signal-card" data-signal-id="${s.id}">
        <div class="signal-header">
          <div>
            <div class="signal-pair">${s.pair}</div>
            <div style="font-size:11px; color:var(--color-text-muted); margin-top:4px;">${s.date} • ${s.time}</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="signal-type ${typeClass}">
              <i class="fas ${typeIcon}"></i> ${s.type}
            </span>
            <span class="badge badge-${statusClass[s.status]}">${statusLabel[s.status]}</span>
          </div>
        </div>

        <div class="signal-levels">
          <div class="signal-level">
            <div class="signal-level-label">Entry</div>
            <div class="signal-level-value entry">${s.entry.toFixed(priceDecimals)}</div>
          </div>
          <div class="signal-level">
            <div class="signal-level-label">TP1</div>
            <div class="signal-level-value tp">${tp1.toFixed(priceDecimals)}</div>
          </div>
          <div class="signal-level">
            <div class="signal-level-label">Stop Loss</div>
            <div class="signal-level-value sl">${s.sl.toFixed(priceDecimals)}</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--color-text-muted); padding-top:12px; border-top:1px solid rgba(255,255,255,0.06);">
          <span><i class="fas fa-chart-line" style="color:var(--color-gold); margin-right:4px;"></i> ~${s.pips} pips &nbsp;•&nbsp; R:R ${s.rr}</span>
          <span style="color:var(--color-text-secondary);">Accuracy: <strong style="color:var(--color-gold);">${s.accuracy}%</strong></span>
          <button class="signal-expand btn btn-ghost btn-sm btn-icon">
            <i class="fas fa-chevron-down"></i>
          </button>
        </div>

        <div class="signal-detail hidden" style="padding-top:12px; margin-top:4px; border-top:1px solid rgba(255,255,255,0.06);">
          ${tp2 ? `<div style="font-size:12px; color:var(--color-text-secondary); margin-bottom:8px;">
            <span style="color:var(--color-text-muted);">TP2:</span>
            <strong style="color:var(--color-success);">${tp2.toFixed(priceDecimals)}</strong>
          </div>` : ''}
          <div style="font-size:12px; color:var(--color-text-secondary); line-height:1.7;">
            Wait for price to reach the entry level. Ensure proper lot sizing based on your risk management rules. Set SL first before entering the trade.
          </div>
        </div>
      </div>`;
  },

  bindFilters() {
    document.querySelectorAll('[data-signal-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-signal-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.filter = btn.dataset.signalFilter;
        this.render();
      });
    });
  },

  bindSearch() {
    const search = document.querySelector('[data-signal-search]');
    if (!search) return;
    search.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase();
      document.querySelectorAll('.signal-card').forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(val) ? '' : 'none';
      });
    });
  },

  startLiveUpdates() {
    // Simulate a new signal arriving
    setInterval(() => {
      const dots = document.querySelector('.signal-live-dot');
      if (dots) dots.style.opacity = dots.style.opacity === '0' ? '1' : '0';
    }, 800);
  }
};

/* ────────────────────────────────────────────────────────────
   Signals Page: Stats Counter
──────────────────────────────────────────────────────────── */
const SignalStats = {
  init() {
    const stats = {
      totalSignals:    document.querySelector('[data-stat="total"]'),
      winRate:         document.querySelector('[data-stat="winrate"]'),
      avgPips:         document.querySelector('[data-stat="pips"]'),
      activeSignals:   document.querySelector('[data-stat="active"]'),
    };

    if (stats.totalSignals)  stats.totalSignals.textContent  = '1,284';
    if (stats.winRate)       stats.winRate.textContent       = '79.4%';
    if (stats.avgPips)       stats.avgPips.textContent       = '312';
    if (stats.activeSignals) stats.activeSignals.textContent = '4';
  }
};

document.addEventListener('DOMContentLoaded', () => {
  SignalEngine.init();
  SignalStats.init();
});
