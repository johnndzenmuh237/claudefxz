/* Opens a course page only for users with an APPROVED order for a product that uses this page. */
import { requireUser, populateUserUI } from "./auth-helpers.js";
import { db } from "./firebase-config.js";
import { esc, loadOwnership, checkoutUrl, dlButton, bindDownloads, contactCard } from "./access.js";

const page = document.body.dataset.page;
const ids = Object.keys(window.CATALOG).filter((k) => window.CATALOG[k].page === page);
const $ = (i) => document.getElementById(i);

(async function () {
  try {
    const { user, profile } = await requireUser();
    populateUserUI(profile);
    const { owned, pending } = await loadOwnership(db, user.uid);
    $('lnLoading').style.display = 'none';
    const mine = ids.find((k) => owned.has(k));
    if (!mine) {
      const main = document.body.dataset.main;
      const isPending = ids.some((k) => pending.has(k));
      $('lockBody').style.display = 'block';
      $('lockBody').innerHTML = `<div class="ln-card ln-center"><i class="fas fa-lock big"></i><h2 style="font-size:1.3rem;margin-bottom:.4rem;">${esc(document.title.split('|')[0])}</h2>` +
        (isPending ? `<p>Your payment is <strong>pending verification</strong>. This course unlocks once it is approved.</p><div class="ln-actions" style="justify-content:center;"><a class="btn btn-outline" href="payments.html">View my payments</a></div>`
                   : `<p>Pay once to unlock the full course, ebook and mentorship access — for life.</p><div class="ln-actions" style="justify-content:center;"><a class="btn btn-primary" href="${checkoutUrl(main)}"><i class="fas fa-shopping-cart"></i> Enroll — $${esc(window.CATALOG[main].priceUsd)}</a></div>`) + `</div>`;
      return;
    }
    const p = window.CATALOG[mine], c = window.PAYMENT_CONFIG || {};
    const toc = [...document.querySelectorAll('.cp-mod h2')].map((h, i) => { h.parentElement.id = 'm' + (i + 1); return `<a href="#m${i + 1}" class="ln-lesson"><i class="fas fa-book-open"></i>${esc(h.textContent)}</a>`; }).join('');
    const group = c.whatsappGroupUrl
      ? `<a class="btn btn-primary btn-sm" href="${esc(c.whatsappGroupUrl)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Join the WhatsApp group</a>`
      : `<a class="btn btn-primary btn-sm" href="${esc(c.supportWhatsApp || '#')}?text=${encodeURIComponent('Hello, I paid for the course. Please add me to the student WhatsApp group.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Request WhatsApp group link</a>`;
    const wa = (t) => `${esc(c.supportWhatsApp || '#')}?text=${encodeURIComponent(t)}`;
    const acct = (label, url, ask) => url ? `<a class="btn btn-primary btn-sm" href="${esc(url)}" target="_blank" rel="noopener"><i class="fas fa-user-plus"></i> ${label}</a>`
      : `<a class="btn btn-outline btn-sm" href="${wa(ask)}" target="_blank" rel="noopener"><i class="fas fa-user-plus"></i> ${label}</a>`;
    const wantF = page !== 'course-synthetic.html', wantS = page !== 'course-forex.html';
    const accounts = `<div class="ln-card"><h3><i class="fas fa-user-plus"></i> Create your trading account</h3><p>Open a free demo account first, then go live only when you follow your rules.</p><div class="ln-actions">` +
      (wantF ? acct('Open forex account', c.openAccountForexUrl, 'Hello, which broker should I use to open a forex account?') : '') +
      (wantS ? acct('Open Deriv account', c.openAccountDerivUrl, 'Hello, please help me open a Deriv account.') : '') + `</div></div>`;
    $('side').innerHTML = accounts +
      `<div class="ln-card"><h3><i class="fas fa-list-check"></i> Course contents</h3>${toc}</div>` +
      (p.ebook ? `<div class="ln-card"><h3><i class="fas fa-file-pdf"></i> Course ebook</h3><p>Download it and keep it — you can download it again any time you log in.</p><div class="ln-actions">${dlButton(p.ebook.file, 'Download ebook (PDF)', 'btn btn-primary')}</div></div>` : '') +
      `<div class="ln-card"><h3><i class="fas fa-users"></i> Student community</h3><p>Join the students' WhatsApp group to ask questions and share progress.</p><div class="ln-actions">${group}</div></div>` +
      contactCard('1-on-1 mentorship & follow-up', 'Want personal guidance, feedback on your trades or one-on-one mentorship? Contact us directly:');
    const vids = (c.courseVideos || {})[page] || [];
    document.querySelectorAll('.cp-video').forEach((d) => {
      const u = vids[+d.dataset.n - 1];
      d.innerHTML = /^https?:\/\//i.test(u || '')
        ? `<a class="btn btn-primary btn-sm" href="${esc(u)}" target="_blank" rel="noopener"><i class="fab fa-youtube"></i> Watch the video lesson on YouTube</a>`
        : `<span class="cp-note"><i class="fab fa-youtube"></i> Video lesson coming soon</span>`;
    });
    $('courseBody').style.display = 'block';
    bindDownloads($('courseBody'));
  } catch (e) {
    $('lnLoading').style.display = 'none';
    if (e !== 'not-authenticated') { $('lockBody').style.display = 'block'; $('lockBody').innerHTML = '<div class="ln-card ln-center"><p>Could not load the course — please refresh.</p></div>'; }
  }
})();