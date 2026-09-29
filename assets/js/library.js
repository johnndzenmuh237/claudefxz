/* ============================================================
   CLAUDEFX ACADEMY PRO — student-portal/library.html logic
   Shows every product the signed-in user has an APPROVED order for.
   Content links come from assets/js/catalog.js.
   ============================================================ */
import { requireUser, populateUserUI } from "./auth-helpers.js";
import { db } from "./firebase-config.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function youtubeId(url) {
  const m = String(url || '').trim().match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
  return m ? m[1] : (/^[\w-]{11}$/.test(String(url || '').trim()) ? String(url).trim() : null);
}
function safeUrl(u) { return /^https?:\/\//i.test(u) || u.startsWith('../') || u.startsWith('/') ? u : ''; }

function expiryOf(order) {
  if (!order.durationDays || !order.verifiedAt) return null;
  const t = order.verifiedAt.toDate ? order.verifiedAt.toDate() : new Date(order.verifiedAt);
  return new Date(t.getTime() + order.durationDays * 86400000);
}

function renderItems(items) {
  if (!items.length) { el('libEmpty').style.display = 'block'; return; }
  const supportWa = (window.PAYMENT_CONFIG && window.PAYMENT_CONFIG.supportWhatsApp) || '#';
  el('libItems').innerHTML = items.map(({ order, product, expiry }) => {
    const rows = (product.content || []).map((f, i) => {
      const yt = f.kind === 'youtube' ? youtubeId(f.url) : null;
      const url = f.kind === 'youtube' ? '' : safeUrl(f.url || '');
      if (!yt && !url) return `<div class="lib-file-row"><i class="fas fa-hourglass-half ftype"></i><span class="fname">${esc(f.label)}</span><span style="font-size:.78rem;color:var(--color-text-muted);">Coming soon — <a href="${esc(supportWa)}" target="_blank" rel="noopener" style="color:var(--color-gold);">contact support</a></span></div>`;
      if (yt) return `<div class="lib-file-row"><i class="fas fa-circle-play ftype"></i><span class="fname">${esc(f.label)}</span><button class="btn btn-primary btn-sm" data-watch="${esc(yt)}" data-label="${esc(f.label)}"><i class="fas fa-play"></i> Watch</button></div>`;
      return `<div class="lib-file-row"><i class="fas ${f.kind === 'pdf' ? 'fa-file-pdf' : 'fa-link'} ftype"></i><span class="fname">${esc(f.label)}</span><a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener"><i class="fas fa-book-open"></i> ${f.kind === 'pdf' ? 'Read / Download' : 'Open'}</a></div>`;
    }).join('') || '<p style="font-size:.85rem;color:var(--color-text-secondary);">Your content is being prepared.</p>';
    const exp = expiry ? `<div style="font-size:.75rem;color:var(--color-text-muted);margin-bottom:.5rem;">Access until ${expiry.toLocaleDateString()}</div>` : '';
    return `<div class="lib-item"><div class="lib-item-head"><i class="fas ${product.type === 'course' ? 'fa-graduation-cap' : 'fa-book'}"></i><h3>${esc(product.title)}</h3><span class="type-badge">${product.type === 'course' ? 'Course' : 'Ebook'}</span></div>${exp}${rows}</div>`;
  }).join('');

  document.querySelectorAll('[data-watch]').forEach((btn) => btn.addEventListener('click', () => {
    el('libModalTitle').textContent = btn.dataset.label;
    el('libModalBody').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(btn.dataset.watch)}?rel=0&modestbranding=1" title="${esc(btn.dataset.label)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    el('libModalOverlay').classList.add('open');
  }));
}

function closeModal() { el('libModalOverlay').classList.remove('open'); el('libModalBody').innerHTML = ''; }
el('libModalClose').addEventListener('click', closeModal);
el('libModalOverlay').addEventListener('click', (e) => { if (e.target.id === 'libModalOverlay') closeModal(); });

(async function init() {
  try {
    const { user, profile } = await requireUser();
    populateUserUI(profile);
    const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', user.uid)));
    const seen = new Set(), items = [];
    snap.forEach((d) => {
      const order = d.data();
      const product = (window.CATALOG || {})[order.slug];
      if (order.status !== 'approved' || !product || seen.has(order.slug)) return;
      const expiry = expiryOf(order);
      if (expiry && expiry < new Date()) return;
      seen.add(order.slug);
      items.push({ order, product, expiry });
    });
    el('libLoading').style.display = 'none';
    renderItems(items);
  } catch (err) {
    el('libLoading').style.display = 'none';
    if (err !== 'not-authenticated') {
      el('libEmpty').style.display = 'block';
      el('libEmpty').querySelector('p').textContent = "Couldn't load your library — please refresh.";
    }
  }
})();
