/* ============================================================
   FOREX ACADEMY PRO — account-management.js
   Account management page logic
   ============================================================ */

'use strict';

const AccountManagement = {
  plans: [
    { id: 'starter',     name: 'Starter',     min: 500,    max: 2499,   fee: 30, profit: 70, drawdown: 10, returns: '3–8%',  period: 'monthly' },
    { id: 'growth',      name: 'Growth',      min: 2500,   max: 9999,   fee: 25, profit: 75, drawdown: 8,  returns: '5–12%', period: 'monthly' },
    { id: 'premium',     name: 'Premium',     min: 10000,  max: 49999,  fee: 20, profit: 80, drawdown: 6,  returns: '6–15%', period: 'monthly' },
    { id: 'elite',       name: 'Elite',       min: 50000,  max: 199999, fee: 15, profit: 85, drawdown: 5,  returns: '7–18%', period: 'monthly' },
    { id: 'institution', name: 'Institution', min: 200000, max: null,   fee: 10, profit: 90, drawdown: 4,  returns: '8–20%', period: 'monthly' },
  ],

  init() {
    this.initPlanCards();
    this.initCalculator();
    this.initPerformanceChart();
    this.initOnboarding();
  },

  initPlanCards() {
    document.querySelectorAll('[data-plan-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.dataset.planSelect;
        const plan = this.plans.find(p => p.id === planId);
        if (!plan) return;

        document.querySelectorAll('.account-plan-card').forEach(c => c.classList.remove('selected'));
        btn.closest('.account-plan-card')?.classList.add('selected');

        const calc = document.querySelector('[data-calc-plan]');
        if (calc) {
          calc.textContent = plan.name;
          document.querySelector('[data-calc-fee]').textContent  = plan.fee + '%';
          document.querySelector('[data-calc-split]').textContent = plan.profit + '%';
          this.runCalculator();
        }
      });
    });
  },

  initCalculator() {
    const input = document.querySelector('[data-calc-amount]');
    if (!input) return;
    input.addEventListener('input', () => this.runCalculator());
    this.runCalculator();
  },

  runCalculator() {
    const amountInput = document.querySelector('[data-calc-amount]');
    const feeEl   = document.querySelector('[data-calc-fee]');
    const splitEl = document.querySelector('[data-calc-split]');
    if (!amountInput || !feeEl) return;

    const amount   = parseFloat(amountInput.value) || 10000;
    const feeStr   = feeEl.textContent || '20%';
    const fee      = parseFloat(feeStr) / 100;
    const splitStr = splitEl?.textContent || '80%';
    const split    = parseFloat(splitStr) / 100;

    // Low/high monthly return estimates
    const loRate = 0.06, hiRate = 0.15;
    const loProfit = amount * loRate;
    const hiProfit = amount * hiRate;
    const loYou = loProfit * split;
    const hiYou = hiProfit * split;

    const resultEl = document.querySelector('[data-calc-result]');
    if (resultEl) {
      resultEl.innerHTML = `
        <div class="calc-result-row">
          <span>Capital Deployed</span>
          <strong>$${amount.toLocaleString()}</strong>
        </div>
        <div class="calc-result-row">
          <span>Monthly Return (est.)</span>
          <strong style="color:var(--color-success);">$${loProfit.toLocaleString(undefined,{maximumFractionDigits:0})} – $${hiProfit.toLocaleString(undefined,{maximumFractionDigits:0})}</strong>
        </div>
        <div class="calc-result-row">
          <span>Your Share (${Math.round(split*100)}%)</span>
          <strong style="color:var(--color-gold);">$${loYou.toLocaleString(undefined,{maximumFractionDigits:0})} – $${hiYou.toLocaleString(undefined,{maximumFractionDigits:0})}</strong>
        </div>
        <div class="calc-result-row">
          <span>Annual Projection</span>
          <strong style="color:var(--color-gold);">$${(loYou*12).toLocaleString(undefined,{maximumFractionDigits:0})} – $${(hiYou*12).toLocaleString(undefined,{maximumFractionDigits:0})}</strong>
        </div>`;
    }
  },

  initPerformanceChart() {
    const ctx = document.getElementById('amChart');
    if (!ctx || typeof Chart === 'undefined') return;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let capital = 10000;
    const data = months.map(() => {
      capital *= 1 + (0.05 + Math.random() * 0.10);
      return parseFloat(capital.toFixed(2));
    });

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Account Value ($)',
          data,
          borderColor: '#C9A84C',
          backgroundColor: ctx => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
            g.addColorStop(0, 'rgba(201,168,76,0.3)');
            g.addColorStop(1, 'rgba(201,168,76,0)');
            return g;
          },
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointBackgroundColor: '#C9A84C',
          pointBorderColor: '#111318',
          pointBorderWidth: 2,
          pointRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1F242E',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: { label: ctx => ` $${ctx.raw.toLocaleString()}` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            border: { display: false },
            ticks: { callback: v => '$' + (v/1000).toFixed(0) + 'K' }
          }
        }
      }
    });
  },

  initOnboarding() {
    const steps = document.querySelectorAll('.onboard-step');
    let currentStep = 0;

    const showStep = (n) => {
      steps.forEach((s, i) => {
        s.classList.toggle('active', i === n);
        s.classList.toggle('completed', i < n);
      });
      document.querySelector('[data-step-num]') &&
        (document.querySelector('[data-step-num]').textContent = `Step ${n + 1} of ${steps.length}`);
    };

    document.querySelector('[data-next-step]')?.addEventListener('click', () => {
      if (currentStep < steps.length - 1) showStep(++currentStep);
    });
    document.querySelector('[data-prev-step]')?.addEventListener('click', () => {
      if (currentStep > 0) showStep(--currentStep);
    });

    if (steps.length) showStep(0);
  }
};

/* ============================================================
   FOREX ACADEMY PRO — charts.js
   Shared charting utilities
   ============================================================ */

const ChartUtils = {
  defaultOptions: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1F242E',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        padding: 12,
        titleColor: '#F0EDE6',
        bodyColor: '#9CA3B0',
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } }
    }
  },

  goldGradient(ctx, height = 300) {
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, 'rgba(201,168,76,0.25)');
    g.addColorStop(1, 'rgba(201,168,76,0)');
    return g;
  },

  miniSparkline(canvasId, data, color = '#C9A84C') {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((_, i) => i),
        datasets: [{ data, borderColor: color, borderWidth: 1.5, fill: false, tension: 0.4, pointRadius: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } },
        elements: { line: { borderJoinStyle: 'round' } }
      }
    });
  },

  generateCandles(count = 50) {
    const candles = [];
    let price = 1.0800;
    for (let i = 0; i < count; i++) {
      const open  = price;
      const move  = (Math.random() - 0.48) * 0.0030;
      const close = open + move;
      const high  = Math.max(open, close) + Math.random() * 0.0010;
      const low   = Math.min(open, close) - Math.random() * 0.0010;
      candles.push({ t: i, o: open, h: high, l: low, c: close });
      price = close;
    }
    return candles;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AccountManagement.init();
});
