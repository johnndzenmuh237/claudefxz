/* ============================================================
   student-portal/learn.html?p=<product id>
   The page a buyer opens AFTER payment is approved.
   course     -> lessons + YouTube videos + course ebook PDF + contact
   bot        -> downloads + setup videos + contact
   mentorship -> perks + booking + contact
   Not paid   -> locked screen with a Buy button.
   ============================================================ */
import { requireUser, populateUserUI } from "./auth-helpers.js";
import { db } from "./firebase-config.js";
import { esc, youtubeId, checkoutUrl, loadOwnership, dlButton, bindDownloads, contactCard } from "./access.js";

const root = document.getElementById('lnRoot');
const id = new URLSearchParams(location.search).get('p');
const product = (window.CATALOG || {})[id];

function header(p, order) {
  const exp = order && order.expiry ? ` · access until ${order.expiry.toLocaleDateString()}` : ' · lifetime access';
  return `<div class="ln-head"><div><a href="my-courses.html" style="font-size:.8rem;color:var(--color-text-secondary);"><i class="fas fa-arrow-left"></i> My Courses</a>
    <h1>${esc(p.title)}</h1></div><span class="ln-badge"><i class="fas fa-circle-check"></i> Paid${esc(exp)}</span></div>`;
}

function renderCourse(p, order) {
  const lessons = [];
  const mods = (p.modules || []).map((m, mi) => `<div class="ln-mod"><div class="ln-mod-title">${esc(m.title)}</div>${
    m.lessons.map((l) => {
      const i = lessons.push(l) - 1; const has = !!youtubeId(l.youtube);
      return `<button class="ln-lesson" data-i="${i}"><i class="fas ${has ? 'fa-circle-play' : 'fa-hourglass-half'}"></i>${esc(l.title)}${has ? '' : '<span class="soon">Coming soon</span>'}</button>`;
    }).join('')}</div>`).join('');
  const ebook = p.ebook ? `<div class="ln-card"><h3><i class="fas fa-file-pdf"></i> Course ebook</h3>
      <p>Your course ebook — download it any time and keep it.</p>
      <div class="ln-file"><span>${esc(p.ebook.title)}</span>${dlButton(p.ebook.file)}</div></div>` : '';
  root.innerHTML = header(p, order) + `<div class="ln-grid">
    <div>
      <div class="ln-card"><div class="ln-player" id="lnPlayer">Select a lesson to start watching.</div>
        <div class="ln-now" id="lnNow">${esc(p.title)}</div>
        <p style="margin:0;">Watch as many times as you like — your access never expires.</p></div>
      ${contactCard('1-on-1 follow-up & mentorship', 'Questions about a lesson, want feedback on your trades, or want personal one-on-one mentorship? Reach us directly:')}
    </div>
    <div>
      ${ebook}
      <div class="ln-card"><h3><i class="fas fa-list-check"></i> Course content</h3>${mods || '<p>Lessons are being added.</p>'}</div>
    </div></div>`;
  const play = (i) => {
    const l = lessons[i]; const yt = youtubeId(l.youtube);
    document.querySelectorAll('.ln-lesson').forEach((b) => b.classList.toggle('active', +b.dataset.i === i));
    document.getElementById('lnNow').textContent = l.title;
    document.getElementById('lnPlayer').innerHTML = yt
      ? `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1" title="${esc(l.title)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>`
      : 'This lesson video is coming soon. Contact us below if you need it urgently.';
  };
  root.querySelectorAll('.ln-lesson').forEach((b) => b.addEventListener('click', () => play(+b.dataset.i)));
  const first = lessons.findIndex((l) => youtubeId(l.youtube));
  if (first >= 0) play(first);
}

function renderBot(p, order) {
  const files = (p.downloads || []).map((f) => `<div class="ln-file"><span>${esc(f.label)}</span>${dlButton(f.file, 'Download')}</div>`).join('');
  const vids = (p.videos || []).filter((v) => youtubeId(v.youtube)).map((v) => `<div class="ln-card"><h3><i class="fab fa-youtube"></i> ${esc(v.title)}</h3>
    <div class="ln-player"><iframe src="https://www.youtube-nocookie.com/embed/${youtubeId(v.youtube)}?rel=0&modestbranding=1" title="${esc(v.title)}" allowfullscreen></iframe></div></div>`).join('');
  const steps = (p.steps || []).map((s) => `<li><i class="fas fa-check"></i>${esc(s)}</li>`).join('');
  root.innerHTML = header(p, order) + `<div class="ln-grid"><div>
      <div class="ln-card"><h3><i class="fas fa-download"></i> Your downloads</h3>${files || '<p>Files are being prepared.</p>'}
        <p style="margin-top:.8rem;">You can download these again any time you log in.</p></div>
      ${vids || '<div class="ln-card"><h3><i class="fab fa-youtube"></i> Setup videos</h3><p>Setup videos are coming soon.</p></div>'}
    </div><div>
      <div class="ln-card"><h3><i class="fas fa-list-ol"></i> Get started</h3><ul class="ln-list">${steps}</ul></div>
      ${contactCard('Bot setup & support', 'Need help installing or configuring the bot? Contact us for one-on-one support:')}
    </div></div>`;
}

function renderMentorship(p, order) {
  const c = window.PAYMENT_CONFIG || {};
  const perks = (p.perks || []).map((s) => `<li><i class="fas fa-check"></i>${esc(s)}</li>`).join('');
  const book = c.supportWhatsApp ? `<a class="btn btn-primary" href="${esc(c.supportWhatsApp)}?text=${encodeURIComponent('Hello, I have paid for ' + p.title + '. I would like to book my first session.')}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Book your first session</a>` : '';
  root.innerHTML = header(p, order) + `<div class="ln-grid"><div>
      <div class="ln-card"><h3><i class="fas fa-user-group"></i> Your mentorship is active</h3>
        <p>Your payment is confirmed. Message us on WhatsApp to schedule your sessions and start your personal plan.</p>
        <div class="ln-actions">${book}</div></div>
      ${contactCard('Contact your mentor', 'Reach us any time for one-on-one follow-up:')}
    </div><div><div class="ln-card"><h3><i class="fas fa-star"></i> What's included</h3><ul class="ln-list">${perks}</ul></div></div></div>`;
}

function renderLocked(p, pending) {
  root.innerHTML = `<div class="ln-card ln-center"><i class="fas fa-lock big"></i>
    <h2 style="font-size:1.3rem;margin-bottom:.4rem;">${esc(p.title)}</h2>
    ${pending
      ? `<p>Your payment is <strong>pending verification</strong>. This page unlocks as soon as it is approved — usually within a few hours.</p>
         <div class="ln-actions" style="justify-content:center;"><a class="btn btn-outline" href="payments.html">View my payments</a></div>`
      : `<p>You haven't unlocked this yet. Pay once, then come back any time to watch, read and download again.</p>
         <div class="ln-actions" style="justify-content:center;"><a class="btn btn-primary" href="${checkoutUrl(id)}"><i class="fas fa-shopping-cart"></i> Enroll — $${esc(p.priceUsd)}</a></div>`}
  </div>`;
}

(async function init() {
  try {
    const { user, profile } = await requireUser();
    populateUserUI(profile);
    document.getElementById('lnLoading').style.display = 'none';
    if (!product) { root.innerHTML = '<div class="ln-card ln-center"><p>Product not found. <a href="my-courses.html" style="color:var(--color-gold);">Back to My Courses</a></p></div>'; return; }
    if (product.type === 'ebook') { location.replace('library.html'); return; }
    const { owned, pending } = await loadOwnership(db, user.uid);
    const order = owned.get(id);
    if (!order) { renderLocked(product, pending.has(id)); return; }
    if (product.type === 'course' && product.page) { location.replace(product.page); return; }
    if (product.type === 'course') renderCourse(product, order);
    else if (product.type === 'bot') renderBot(product, order);
    else renderMentorship(product, order);
    bindDownloads(root);
  } catch (err) {
    document.getElementById('lnLoading').style.display = 'none';
    if (err !== 'not-authenticated') root.innerHTML = '<div class="ln-card ln-center"><p>Could not load this page — please refresh.</p></div>';
  }
})();