/* ============================================================
   CLAUDEFX ACADEMY PRO — student-portal/library.html logic
   ============================================================ */
import { auth } from "../assets/js/firebase-config.js";
import { requireUser, populateUserUI } from "../assets/js/auth-helpers.js";

// ⚠️ Must match the URL from `wrangler deploy` (see CLOUDFLARE_SETUP.md)
const WORKER_BASE_URL = "https://claudefx-crypto-checkout.YOUR-SUBDOMAIN.workers.dev";

const el = (id) => document.getElementById(id);

async function authedFetch(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  const idToken = await user.getIdToken();
  const res = await fetch(WORKER_BASE_URL + path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: "Bearer " + idToken },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function fileIcon(kind) {
  return kind === "video" ? "fa-circle-play" : "fa-file-pdf";
}

function renderItems(items) {
  const container = el("libItems");
  if (items.length === 0) {
    el("libEmpty").style.display = "block";
    return;
  }
  container.innerHTML = items
    .map(
      (item) => `
    <div class="lib-item">
      <div class="lib-item-head">
        <i class="fas ${item.type === "course" ? "fa-graduation-cap" : "fa-book"}"></i>
        <h3>${item.title}</h3>
        <span class="type-badge">${item.type === "course" ? "Course" : "Ebook"}</span>
      </div>
      ${item.files
        .map(
          (f) => `
        <div class="lib-file-row">
          <i class="fas ${fileIcon(f.kind)} ftype"></i>
          <span class="fname">${f.label}</span>
          <button class="btn btn-primary btn-sm" data-open data-product="${item.productId}" data-key="${f.key}" data-kind="${f.kind}" data-label="${f.label}">
            <i class="fas ${f.kind === "video" ? "fa-play" : "fa-book-open"}"></i> ${f.kind === "video" ? "Watch" : "Read"}
          </button>
          <button class="btn btn-outline btn-sm" data-download data-product="${item.productId}" data-key="${f.key}">
            <i class="fas fa-download"></i>
          </button>
        </div>`
        )
        .join("")}
    </div>`
    )
    .join("");

  container.querySelectorAll("[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => openMedia(btn.dataset.product, btn.dataset.key, btn.dataset.kind, btn.dataset.label));
  });
  container.querySelectorAll("[data-download]").forEach((btn) => {
    btn.addEventListener("click", () => downloadMedia(btn.dataset.product, btn.dataset.key));
  });
}

async function getToken(productId, fileKey) {
  return authedFetch("/api/get-media-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, fileKey }),
  });
}

async function openMedia(productId, fileKey, kind, label) {
  el("libModalTitle").textContent = label;
  el("libModalBody").innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#fff;font-size:2rem;"></i>';
  el("libModalOverlay").classList.add("open");

  try {
    const { token } = await getToken(productId, fileKey);
    const fileUrl = `${WORKER_BASE_URL}/api/media-file?token=${encodeURIComponent(token)}&mode=inline`;
    if (kind === "video") {
      el("libModalBody").innerHTML = `<video src="${fileUrl}" controls autoplay style="max-height:70vh;"></video>`;
    } else {
      el("libModalBody").innerHTML = `<iframe src="${fileUrl}" title="${label}"></iframe>`;
    }
    el("libModalDownload").onclick = () => downloadMedia(productId, fileKey);
  } catch (err) {
    el("libModalBody").innerHTML = `<p style="color:#fca5a5;padding:2rem;">${err.message || "Could not load this file."}</p>`;
  }
}

async function downloadMedia(productId, fileKey) {
  try {
    const { token } = await getToken(productId, fileKey);
    const fileUrl = `${WORKER_BASE_URL}/api/media-file?token=${encodeURIComponent(token)}&mode=attachment`;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    alert(err.message || "Could not start the download.");
  }
}

el("libModalClose").addEventListener("click", () => {
  el("libModalOverlay").classList.remove("open");
  el("libModalBody").innerHTML = "";
});
el("libModalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "libModalOverlay") {
    el("libModalOverlay").classList.remove("open");
    el("libModalBody").innerHTML = "";
  }
});

(async function init() {
  try {
    const { profile } = await requireUser();
    populateUserUI(profile);

    const { items } = await authedFetch("/api/my-library");
    el("libLoading").style.display = "none";
    renderItems(items);
  } catch (err) {
    el("libLoading").style.display = "none";
    if (err.message !== "not-authenticated") {
      el("libEmpty").style.display = "block";
      el("libEmpty").querySelector("p").textContent = "Couldn't load your library — please refresh.";
    }
  }
})();
