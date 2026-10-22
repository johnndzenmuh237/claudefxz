/* ============================================================
   CLAUDEFX ACADEMY PRO — assets/js/admin-shell.js
   Loaded by EVERY page in /admin/ (except the login page). It:
     1. blocks the page until the visitor is a signed-in ADMIN
        (otherwise redirects to admin-login.html);
     2. keeps a LIVE list of payments waiting for approval and turns it into
        the sidebar badge, the bell drawer, pop-up toasts and (optionally)
        desktop notifications;
     3. makes "Sign Out" really sign out;
     4. exposes `sales` (approve / reject / sync) and small UI helpers.

   NOTE: a client-side guard only controls what the page shows. The real
   protection is firestore.rules — orders, sales and stats are admin-only there.
   ============================================================ */
import { adminAuth, adminDb } from './admin-firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as fs from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createSalesService } from './admin-sales.js';
import { esc, fmtUsd, timeAgo, tsToMs, methodLabel } from './admin-sales-core.js';

export { adminAuth, adminDb, fs, esc, fmtUsd, timeAgo, tsToMs, methodLabel };

const LOGIN_PAGE = 'admin-login.html';
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let adminUser = null;
let adminProfile = null;
export const currentAdmin = () => ({ user: adminUser, profile: adminProfile });
export const catalog = () => window.CATALOG || {};

export const sales = createSalesService({
  db: adminDb, fs, getAdminEmail: () => (adminUser && (adminUser.email || adminUser.uid)) || 'admin',
});

/* ------------------------------ toasts ------------------------------ */
export function toast(message, type = 'info', { href = null, ms = 6000 } = {}) {
  let box = document.getElementById('admToasts');
  if (!box) { box = document.createElement('div'); box.id = 'admToasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const el = document.createElement(href ? 'a' : 'div');
  el.className = `adm-toast adm-toast-${type}`;
  if (href) el.href = href;
  const icon = { success: 'fa-circle-check', danger: 'fa-circle-exclamation', warn: 'fa-triangle-exclamation', info: 'fa-bell' }[type] || 'fa-bell';
  el.innerHTML = `<i class="fas ${icon}"></i><span>${esc(message)}</span>`;
  box.appendChild(el);
  const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 250); };
  setTimeout(kill, ms);
  el.addEventListener('click', () => { if (!href) kill(); });
  return el;
}

/**
 * Accessible confirmation dialog. Resolves true/false.
 *   rows:     [[label, valueHtmlSafe], ...]   (values are escaped here)
 *   warnings: [{severity, message}]
 *   checkbox: text of a tick-box that must be ticked before the confirm button works
 */
export function confirmDialog({ title, rows = [], warnings = [], checkbox = null, confirmText = 'Confirm', danger = false, intro = '' }) {
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'adm-modal-backdrop';
    back.innerHTML = `
      <div class="adm-modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <h3>${esc(title)}</h3>
        ${intro ? `<p class="adm-muted" style="margin-bottom:var(--space-4);font-size:var(--text-sm);">${esc(intro)}</p>` : ''}
        ${rows.length ? `<div class="adm-modal-rows">${rows.map(([k, v, cls]) => `<div><span class="adm-muted">${esc(k)}</span><span class="${cls || ''}">${esc(v)}</span></div>`).join('')}</div>` : ''}
        ${warnings.map((w) => `<div class="adm-warn adm-warn-${w.severity === 'danger' ? 'danger' : 'warn'}"><i class="fas fa-triangle-exclamation"></i><span>${esc(w.message)}</span></div>`).join('')}
        ${checkbox ? `<label class="adm-check"><input type="checkbox" id="admDlgCheck"><span>${esc(checkbox)}</span></label>` : ''}
        <div class="adm-modal-actions">
          <button type="button" class="btn btn-outline btn-sm" data-dlg="no">Cancel</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-dlg="yes" ${checkbox ? 'disabled' : ''}>${esc(confirmText)}</button>
        </div>
      </div>`;
    const yes = back.querySelector('[data-dlg="yes"]');
    const chk = back.querySelector('#admDlgCheck');
    const prevFocus = document.activeElement;
    const done = (v) => { document.removeEventListener('keydown', onKey); back.remove(); if (prevFocus && prevFocus.focus) prevFocus.focus(); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') done(false); };
    if (chk) chk.addEventListener('change', () => { yes.disabled = !chk.checked; });
    back.addEventListener('click', (e) => { if (e.target === back) done(false); });
    back.querySelector('[data-dlg="no"]').addEventListener('click', () => done(false));
    yes.addEventListener('click', () => done(true));
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    (chk || yes).focus();
  });
}

export async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  if (btn) { const old = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i>'; setTimeout(() => { btn.innerHTML = old; }, 1200); }
}

/** Persistent message at the top of the page content (e.g. "rules not published"). */
export function showBanner(html, type = 'danger') {
  const host = document.querySelector('.dashboard-content');
  if (!host) return;
  let b = document.getElementById('admBanner');
  if (!b) { b = document.createElement('div'); b.id = 'admBanner'; host.prepend(b); }
  b.className = `adm-banner adm-banner-${type}`;
  b.innerHTML = html;
}

export function explainError(err) {
  const c = err && err.code;
  if (c === 'permission-denied') return 'Permission denied by Firestore. Publish the latest firestore.rules (Firebase Console → Firestore → Rules) and make sure this account has role "admin".';
  if (c === 'unavailable' || c === 'network-request-failed') return 'Network problem — check your connection and try again.';
  if (c && c.startsWith('sales/')) return err.message;
  return (err && err.message) || 'Something went wrong.';
}

/* --------------------------- pending store --------------------------- */
const pendingState = { list: [], ready: false, error: null };
const subs = new Set();
export const pending = {
  get list() { return pendingState.list; },
  get ready() { return pendingState.ready; },
  get error() { return pendingState.error; },
  subscribe(fn) { subs.add(fn); if (pendingState.ready || pendingState.error) fn(pendingState); return () => subs.delete(fn); },
};
const emit = () => subs.forEach((fn) => { try { fn(pendingState); } catch (e) { console.error(e); } });
const baseTitle = document.title;

function renderBadges() {
  const n = pendingState.list.length;
  $$('[data-pending-badge]').forEach((el) => { el.textContent = n; el.hidden = n === 0; });
  $$('.topbar-action .notif-badge').forEach((el) => { el.style.display = n ? 'block' : 'none'; });
  document.title = n ? `(${n}) ${baseTitle}` : baseTitle;
}

function renderDrawer() {
  const host = document.querySelector('[data-adm-notif-list]');
  if (!host) return;
  const list = pendingState.list;
  const canAsk = 'Notification' in window && Notification.permission === 'default';
  host.innerHTML = (pendingState.error
    ? `<div class="adm-empty"><i class="fas fa-triangle-exclamation"></i><p>${esc(explainError(pendingState.error))}</p></div>`
    : list.length
      ? list.map((o) => `
        <a class="notif-item unread" href="payments.html#order=${encodeURIComponent(o.id)}">
          <div class="notif-item-icon stat-card-gold"><i class="fas fa-credit-card"></i></div>
          <div>
            <div class="notif-text"><strong>${esc(o.title)}</strong> — ${esc(fmtUsd(o.priceUsd))}</div>
            <div class="notif-text" style="font-size:.78rem;color:var(--color-text-secondary);">${esc(o.buyerEmail || 'Unknown buyer')} · ${esc(methodLabel(o))}</div>
            <div class="notif-time">${esc(timeAgo(tsToMs(o.submittedAt)))} · awaiting your approval</div>
          </div>
        </a>`).join('')
      : `<div class="adm-empty"><i class="fas fa-check-circle"></i><p>All caught up — no payments waiting.</p></div>`)
    + `<div class="adm-drawer-foot">
         <a class="btn btn-primary btn-sm" href="payments.html">Review all payments</a>
         ${canAsk ? '<button type="button" class="btn btn-outline btn-sm" data-adm-enable-desktop><i class="fas fa-desktop"></i> Enable desktop alerts</button>' : ''}
       </div>`;
  const ask = host.querySelector('[data-adm-enable-desktop]');
  if (ask) ask.addEventListener('click', async (e) => { e.stopPropagation(); await Notification.requestPermission(); renderDrawer(); });
}

function desktopAlert(o) {
  if (!('Notification' in window) || Notification.permission !== 'granted' || !document.hidden) return;
  try {
    const n = new Notification('New payment to verify', { body: `${o.title} — ${fmtUsd(o.priceUsd)} (${o.buyerEmail || 'buyer'})`, tag: 'adm-' + o.id });
    n.onclick = () => { window.focus(); location.href = `payments.html#order=${encodeURIComponent(o.id)}`; };
  } catch { /* some browsers only allow Notification via service worker */ }
}

let firstSnapshot = true;
function startPendingListener() {
  fs.onSnapshot(
    fs.query(fs.collection(adminDb, 'orders'), fs.where('status', '==', 'pending')),
    (snap) => {
      pendingState.list = snap.docs
        .map((d) => ({ ...d.data({ serverTimestamps: 'estimate' }), id: d.id }))
        .sort((a, b) => (tsToMs(b.submittedAt) || 0) - (tsToMs(a.submittedAt) || 0));
      pendingState.ready = true; pendingState.error = null;
      if (!firstSnapshot) {
        snap.docChanges().filter((c) => c.type === 'added').forEach((c) => {
          const o = { ...c.doc.data(), id: c.doc.id };
          toast(`New payment: ${o.title} — ${fmtUsd(o.priceUsd)}`, 'info', { href: `payments.html#order=${encodeURIComponent(o.id)}` });
          desktopAlert(o);
        });
      }
      firstSnapshot = false;
      renderBadges(); renderDrawer(); emit();
    },
    (err) => {
      console.error('pending listener', err);
      pendingState.error = err; pendingState.ready = false;
      showBanner(`<i class="fas fa-triangle-exclamation"></i> <span>Couldn't load payments: ${esc(explainError(err))}</span>`);
      renderDrawer(); emit();
    },
  );
}

/* ------------------------------ guard ------------------------------ */
function goToLogin(extra = '') {
  const here = location.pathname.split('/').pop() || 'dashboard.html';
  location.replace(`${LOGIN_PAGE}?next=${encodeURIComponent(here)}${extra}`);
}

function applyIdentity() {
  const email = adminUser.email || '';
  const name = (adminProfile && adminProfile.displayName) || email.split('@')[0] || 'Admin';
  const initials = name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'A';
  $$('[data-admin-name]').forEach((el) => { el.textContent = name; });
  $$('[data-admin-email]').forEach((el) => { el.textContent = email; });
  $$('[data-admin-initials]').forEach((el) => { el.textContent = initials; });
}

async function doSignOut(e) {
  if (e) e.preventDefault();
  try { await signOut(adminAuth); } finally { location.replace(LOGIN_PAGE); }
}

function unlockPage() {
  document.body.classList.remove('adm-locked');
  const m = document.getElementById('admLockMsg'); if (m) m.remove();
}

let lockTimer = setTimeout(() => {
  const p = document.querySelector('#admLockMsg p');
  if (p) p.textContent = 'Taking longer than usual — check your internet connection, then refresh.';
}, 12000);

export const ready = new Promise((resolve) => {
  onAuthStateChanged(adminAuth, async (user) => {
    if (!user) { goToLogin(); return; }                       // signed out (here or in another tab)
    if (adminUser && adminUser.uid === user.uid) return;      // token refresh — nothing to do
    try {
      const snap = await fs.getDoc(fs.doc(adminDb, 'users', user.uid));
      const profile = snap.exists() ? snap.data() : {};
      if (profile.role !== 'admin') {                         // a student account — never allowed in
        await signOut(adminAuth); goToLogin('&denied=1'); return;
      }
      adminUser = user; adminProfile = profile;
      clearTimeout(lockTimer);
      applyIdentity();
      $$('[data-adm-signout]').forEach((el) => el.addEventListener('click', doSignOut));
      startPendingListener();
      unlockPage();
      resolve({ user, profile });
    } catch (err) {
      console.error('admin guard', err);
      const p = document.querySelector('#admLockMsg p');
      if (p) p.textContent = 'Could not verify admin access: ' + explainError(err);
    }
  });
});
