/* ============================================================
   CLAUDEFX ACADEMY PRO — assets/js/admin-sales-core.js
   Pure helpers for the admin SALES BALANCE. No imports, no DOM,
   no Firebase — so the money maths can be unit-tested in Node.

   How the balance works
   ---------------------
   When the admin approves a payment, three things are written in
   ONE atomic transaction (see admin-sales.js):
     1. orders/{id}  -> status "approved"          (unlocks the buyer)
     2. sales/{id}   -> one immutable ledger entry (product name, amount…)
     3. stats/sales  -> running totals (the dashboard balance)
   The sale document ID is the order ID, so one order can never be
   credited twice.
   ============================================================ */

/** Round to cents so repeated additions never drift (0.1 + 0.2 etc). */
export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Escape text before it is placed into innerHTML. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmtUsd = (n) => {
  const v = Number(n);
  return (Number.isFinite(v) ? v : 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

/** Accepts a Firestore Timestamp, Date, ms number, or {seconds} -> ms (or null). */
export function tsToMs(t) {
  if (t == null) return null;
  if (typeof t === 'number') return t;
  if (t instanceof Date) return t.getTime();
  if (typeof t.toMillis === 'function') return t.toMillis();
  if (typeof t.toDate === 'function') return t.toDate().getTime();
  if (typeof t.seconds === 'number') return t.seconds * 1000 + Math.floor((t.nanoseconds || 0) / 1e6);
  return null;
}

export function timeAgo(ms, now = Date.now()) {
  if (ms == null) return '';
  const s = Math.max(0, Math.floor((now - ms) / 1000));
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/* ---------------------- order helpers ---------------------- */

export function methodLabel(o) {
  if (!o) return '';
  if (o.method === 'momo') return o.providerName || (o.provider === 'orange' ? 'Orange Money' : 'MTN Mobile Money');
  if (o.method === 'crypto') return 'Crypto — ' + (o.cryptocurrency || 'unknown coin');
  return o.method || 'Unknown';
}

export const referenceOf = (o) => (o && (o.transactionId || o.transactionHash || o.refKey)) || '';

/**
 * Sanity-check an order against the product catalog BEFORE the admin approves it.
 * The buyer's browser writes the order, so its price/title are not trusted blindly:
 * a mismatch is shown to the admin as a warning.
 * Returns a list of warnings ([] = all good). severity "danger" | "warn".
 */
export function checkOrder(order, catalog) {
  const warnings = [];
  const p = catalog && order ? catalog[order.slug] : null;
  if (!p) {
    warnings.push({ code: 'UNKNOWN_PRODUCT', severity: 'danger',
      message: `Product "${order && order.slug}" is not in the catalog.` });
    return warnings;
  }
  if (Number(p.priceUsd) !== Number(order.priceUsd)) {
    warnings.push({ code: 'PRICE_MISMATCH', severity: 'danger',
      message: `This order says ${fmtUsd(order.priceUsd)} but the catalog price is ${fmtUsd(p.priceUsd)}.` });
  }
  if (String(p.title) !== String(order.title)) {
    warnings.push({ code: 'TITLE_MISMATCH', severity: 'warn',
      message: `Order name "${order.title}" differs from the catalog name "${p.title}".` });
  }
  return warnings;
}

/* ---------------------- the ledger ---------------------- */

/** Thrown for business-rule problems (distinct from Firestore's own error codes). */
export function salesError(code, message) {
  return Object.assign(new Error(message || code), { code });
}

/**
 * Build the immutable ledger entry for an approved order (without timestamps).
 * `productName` is the label the admin sees in the sales list.
 */
export function buildSale(order, adminEmail, { source = 'approval' } = {}) {
  const amount = order && order.priceUsd;
  if (!order || typeof order.id !== 'string' || !order.id
      || typeof order.title !== 'string' || !order.title
      || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw salesError('sales/invalid-order', 'Order is missing an id, product name or a valid price.');
  }
  return {
    orderId: order.id,
    productSlug: order.slug || null,
    productName: order.title,
    productType: order.type || null,
    amountUsd: amount,
    method: order.method || null,
    methodLabel: methodLabel(order),
    reference: referenceOf(order),
    amountXaf: typeof order.amountXaf === 'number' ? order.amountXaf : null,
    buyerUid: order.uid || null,
    buyerEmail: order.buyerEmail || null,
    approvedBy: adminEmail || null,
    source,
  };
}

/** Safe map key for byProduct. */
export function productKey(sale) {
  const raw = String(sale.productSlug || sale.productName || 'unknown').toLowerCase();
  return raw.replace(/[^a-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 100) || 'unknown';
}

export function emptyStats() { return { totalUsd: 0, salesCount: 0, byProduct: {} }; }

/**
 * Add one sale to the running totals. Pure: returns a NEW stats object.
 * `lastSoldAt` is stored per product (a Timestamp / serverTimestamp sentinel / ms).
 */
export function applySaleToStats(stats, sale, lastSoldAt = null) {
  const s = stats && typeof stats === 'object' ? stats : emptyStats();
  const by = s.byProduct || {};
  const key = productKey(sale);
  const prev = by[key] || { count: 0, totalUsd: 0 };
  return {
    totalUsd: round2((Number(s.totalUsd) || 0) + sale.amountUsd),
    salesCount: (Number(s.salesCount) || 0) + 1,
    byProduct: {
      ...by,
      [key]: {
        name: sale.productName,
        slug: sale.productSlug || null,
        type: sale.productType || null,
        count: (Number(prev.count) || 0) + 1,
        totalUsd: round2((Number(prev.totalUsd) || 0) + sale.amountUsd),
        lastSoldAt: lastSoldAt ?? prev.lastSoldAt ?? null,
      },
    },
  };
}

/** Rebuild the totals from scratch out of a list of ledger entries. */
export function aggregateSales(sales) {
  let stats = emptyStats();
  const ordered = [...sales].sort((a, b) => (tsToMs(a.approvedAt) || 0) - (tsToMs(b.approvedAt) || 0));
  for (const sale of ordered) stats = applySaleToStats(stats, sale, sale.approvedAt ?? null);
  return stats;
}

/* ---------------------- reporting ---------------------- */

/** Products sorted by revenue (highest first) with their share of the total. */
export function productBreakdown(stats) {
  const by = (stats && stats.byProduct) || {};
  const total = Number(stats && stats.totalUsd) || 0;
  return Object.entries(by)
    .map(([key, p]) => ({ key, ...p, share: total > 0 ? p.totalUsd / total : 0 }))
    .sort((a, b) => b.totalUsd - a.totalUsd || b.count - a.count);
}

/**
 * Totals for "today" and "this month" (browser-local calendar) plus a per-day series
 * for the current month. `sales` need `amountUsd` and `approvedAt`.
 */
export function summarizeSales(sales, now = new Date()) {
  const y = now.getFullYear(), m = now.getMonth(), d = now.getDate();
  const startMonth = new Date(y, m, 1).getTime();
  const startToday = new Date(y, m, d).getTime();
  const days = Array.from({ length: d }, (_, i) => ({ day: i + 1, total: 0, count: 0 }));
  let monthTotal = 0, monthCount = 0, todayTotal = 0, todayCount = 0;
  for (const s of sales) {
    const t = tsToMs(s.approvedAt);
    if (t == null || t < startMonth) continue;
    const dt = new Date(t);
    if (dt.getFullYear() !== y || dt.getMonth() !== m) continue;
    monthTotal = round2(monthTotal + s.amountUsd); monthCount++;
    const slot = days[dt.getDate() - 1];
    if (slot) { slot.total = round2(slot.total + s.amountUsd); slot.count++; }
    if (t >= startToday) { todayTotal = round2(todayTotal + s.amountUsd); todayCount++; }
  }
  return { monthTotal, monthCount, todayTotal, todayCount, days };
}

/* ---------------------- CSV export ---------------------- */

/**
 * One CSV cell. Text that starts with = + - @ is prefixed with ' so Excel/Sheets can't run it
 * as a formula (buyer-supplied fields such as email or reference could contain one).
 */
export function csvCell(v) {
  if (v == null) return '';
  if (typeof v === 'number') return String(v);
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function toCsv(columns, rows) {
  const head = columns.map((c) => csvCell(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(','));
  return [head, ...body].join('\r\n');
}
