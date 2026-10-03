/* Shared helpers: who owns what, links, safe downloads. */
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function youtubeId(url) {
  const u = String(url || '').trim();
  const m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(u) ? u : null);
}
export const checkoutUrl = (id) => `checkout.html?product=${encodeURIComponent(id)}`;
// Where a buyer goes to USE a paid product.
export const openUrl = (id) => {
  const p = (window.CATALOG || {})[id];
  return p && p.type === 'ebook' ? `library.html` : (p && p.page ? p.page : `learn.html?p=${encodeURIComponent(id)}`);
};

function expiryOf(o) {
  if (!o.durationDays || !o.verifiedAt) return null;
  const t = o.verifiedAt.toDate ? o.verifiedAt.toDate() : new Date(o.verifiedAt);
  return new Date(t.getTime() + o.durationDays * 86400000);
}

/** Returns { owned: Map(slug -> order), pending: Set(slug) } for a user. */
export async function loadOwnership(db, uid) {
  const owned = new Map(), pending = new Set();
  const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', uid)));
  snap.forEach((d) => {
    const o = d.data();
    if (!(window.CATALOG || {})[o.slug]) return;
    if (o.status === 'approved') { const e = expiryOf(o); if (!e || e > new Date()) owned.set(o.slug, { ...o, expiry: e }); }
    else if (o.status === 'pending') pending.add(o.slug);
  });
  return { owned, pending };
}

/** Download button HTML (PDF/zip). Checked with a HEAD request before downloading. */
export function dlButton(url, label = 'Download PDF', cls = 'btn btn-primary btn-sm') {
  return `<button type="button" class="${cls}" data-dl="${esc(url)}"><i class="fas fa-download"></i> ${esc(label)}</button>`;
}
export function bindDownloads(root = document) {
  root.querySelectorAll('[data-dl]').forEach((btn) => {
    if (btn.dataset.bound) return; btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
      const url = btn.dataset.dl;
      const cfg = window.PAYMENT_CONFIG || {};
      try {
        const r = await fetch(url, { method: 'HEAD' });
        if (!r.ok) throw new Error('missing');
      } catch (e) {
        if (/^https?:\/\//i.test(url) && !url.startsWith(location.origin)) { window.open(url, '_blank', 'noopener'); return; }
        alert('This file is being uploaded. Please contact support and we will send it to you right away.' + (cfg.supportWhatsApp ? '\n' + cfg.supportWhatsApp : ''));
        return;
      }
      const a = document.createElement('a');
      a.href = url; a.download = url.split('/').pop(); a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
    });
  });
}

/** Contact card for 1-on-1 follow-up, from payment-config.js */
export function contactCard(title = '1-on-1 follow-up & mentorship', text = 'Need help, feedback on your trades, or personal mentorship? Contact us directly:') {
  const c = window.PAYMENT_CONFIG || {};
  const wa = c.supportWhatsApp ? `<a class="btn btn-primary btn-sm" href="${esc(c.supportWhatsApp)}?text=${encodeURIComponent('Hello, I need 1-on-1 follow-up for my course.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a>` : '';
  const ph = c.supportPhone ? `<a class="btn btn-outline btn-sm" href="tel:${esc(c.supportPhone)}"><i class="fas fa-phone"></i> ${esc(c.supportPhone)}</a>` : '';
  const em = c.supportEmail ? `<a class="btn btn-outline btn-sm" href="mailto:${esc(c.supportEmail)}"><i class="fas fa-envelope"></i> ${esc(c.supportEmail)}</a>` : '';
  return `<div class="ln-card ln-contact"><h3><i class="fas fa-headset"></i> ${esc(title)}</h3><p>${esc(text)}</p><div class="ln-actions">${wa}${ph}${em}</div></div>`;
}