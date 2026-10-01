/* My Ebooks — only ebooks the user has PAID for, download button only. */
import { requireUser, populateUserUI } from "./auth-helpers.js";
import { db } from "./firebase-config.js";
import { esc, loadOwnership, dlButton, bindDownloads } from "./access.js";

(async function init() {
  try {
    const { user, profile } = await requireUser();
    populateUserUI(profile);
    const { owned } = await loadOwnership(db, user.uid);
    const books = [...owned.keys()].map((id) => ({ id, p: window.CATALOG[id] })).filter((x) => x.p.type === 'ebook');
    document.getElementById('libLoading').style.display = 'none';
    if (!books.length) { document.getElementById('libEmpty').style.display = 'block'; return; }
    const grid = document.getElementById('libItems');
    grid.innerHTML = books.map(({ p }) => `<div class="eb-card">
      <img src="../${esc(p.image)}" alt="" onerror="this.style.visibility='hidden'">
      <div class="eb-body"><h3>${esc(p.title)}</h3>${dlButton(p.file, 'Download PDF', 'btn btn-primary')}</div></div>`).join('');
    bindDownloads(grid);
  } catch (err) {
    document.getElementById('libLoading').style.display = 'none';
    if (err !== 'not-authenticated') { const e = document.getElementById('libEmpty'); e.style.display = 'block'; e.querySelector('p').textContent = "Couldn't load your ebooks — please refresh."; }
  }
})();
