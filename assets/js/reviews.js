/* ============================================================
   CLAUDEFX ACADEMY — REAL CUSTOMER REVIEWS
   Stored in Firestore ("reviews" collection). Submissions are
   created with status:"pending" and only ever become visible to
   the public once an admin approves them in /admin-reviews.html.

   IMPORTANT: this file only enforces UX-level rules. The actual
   security boundary MUST be enforced with Firestore Security
   Rules — see /FIRESTORE_RULES.txt for the rules to paste into
   the Firebase console. Without them, this is not production-safe.
   ============================================================ */
import { db } from "./firebase-config.js";
import {
  collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const REVIEWS_COLLECTION = "reviews";
const RATE_LIMIT_KEY = "cfx_last_review_submit";
const RATE_LIMIT_MS = 60 * 1000; // one submission per minute per browser, basic spam friction

function starString(n) {
  n = Math.max(0, Math.min(5, Math.round(n)));
  return "★★★★★☆☆☆☆☆".slice(5 - n, 10 - n);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- Render approved reviews + average rating ---------- */
export async function renderReviews(targetSelector) {
  const root = document.querySelector(targetSelector);
  if (!root) return;
  root.innerHTML = '<div class="review-empty-state"><i class="fas fa-spinner fa-spin"></i>Loading reviews…</div>';

  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("status", "==", "approved"),
      orderBy("featured", "desc"),
      orderBy("createdAt", "desc"),
      limit(24)
    );
    const snap = await getDocs(q);
    const reviews = [];
    snap.forEach((d) => reviews.push({ id: d.id, ...d.data() }));

    if (reviews.length === 0) {
      root.innerHTML =
        '<div class="review-empty-state"><i class="far fa-comment"></i>' +
        "<p>Be the first to leave a review.</p></div>";
      return;
    }

    const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;

    let html = '<div class="review-summary">' +
      '<span class="stars">' + starString(avg) + "</span>" +
      '<span class="avg">' + avg.toFixed(1) + "</span>" +
      '<span class="count">based on ' + reviews.length + (reviews.length === 1 ? " review" : " reviews") + "</span>" +
      "</div>";

    html += '<div class="review-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;">';
    reviews.forEach((r) => {
      html +=
        '<div class="review-card">' +
        '<div class="stars">' + starString(r.rating) + (r.featured ? '<span class="rfeatured">Featured</span>' : "") + "</div>" +
        '<div class="rname">' + escapeHtml(r.name || "Anonymous") + "</div>" +
        '<div class="rdate">' + (r.createdAt && r.createdAt.toDate ? r.createdAt.toDate().toLocaleDateString() : "") + "</div>" +
        '<div class="rtext">' + escapeHtml(r.comment || "") + "</div>" +
        "</div>";
    });
    html += "</div>";
    root.innerHTML = html;
  } catch (err) {
    console.error("Failed to load reviews:", err);
    root.innerHTML = '<div class="review-empty-state"><i class="fas fa-triangle-exclamation"></i><p>Reviews are temporarily unavailable. Please try again shortly.</p></div>';
  }
}

/* ---------- Review submission modal ---------- */
export function initReviewForm(buttonSelector) {
  const buttons = document.querySelectorAll(buttonSelector);
  if (!buttons.length) return;

  // Build modal once
  let overlay = document.getElementById("reviewModalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "review-modal-overlay";
    overlay.id = "reviewModalOverlay";
    overlay.innerHTML = `
      <div class="review-modal" role="dialog" aria-label="Leave a review">
        <h3>Leave a Review</h3>
        <p class="sub">Your review is real, honest, and will be checked by our team before it goes live.</p>
        <form id="reviewForm" novalidate>
          <div class="review-star-picker" id="starPicker" role="radiogroup" aria-label="Rating">
            <i class="fas fa-star" data-val="1"></i><i class="fas fa-star" data-val="2"></i>
            <i class="fas fa-star" data-val="3"></i><i class="fas fa-star" data-val="4"></i>
            <i class="fas fa-star" data-val="5"></i>
          </div>
          <input type="hidden" id="rvRating" name="rating" required>
          <input class="form-control" type="text" id="rvName" placeholder="Your name" required maxlength="60">
          <input class="form-control" type="email" id="rvEmail" placeholder="Email (optional, not published)" maxlength="120">
          <textarea class="form-control" id="rvComment" placeholder="Tell us about your experience..." rows="4" required maxlength="600"></textarea>
          <input type="text" class="rv-hp" id="rvHoneypot" name="company" tabindex="-1" autocomplete="off">
          <button type="submit" class="btn btn-primary" style="width:100%;"><i class="fas fa-paper-plane"></i> Submit Review</button>
          <div class="review-form-msg" id="reviewFormMsg"></div>
        </form>
        <button type="button" class="assistant-close" id="reviewModalClose" style="position:absolute;top:1rem;right:1.25rem;" aria-label="Close">&times;</button>
      </div>`;
    document.body.appendChild(overlay);

    const stars = overlay.querySelectorAll("#starPicker i");
    let rating = 0;
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        rating = parseInt(star.getAttribute("data-val"), 10);
        document.getElementById("rvRating").value = rating;
        stars.forEach((s) => s.classList.toggle("active", parseInt(s.getAttribute("data-val"), 10) <= rating));
      });
    });

    overlay.querySelector("#reviewModalClose").addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });

    overlay.querySelector("#reviewForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msgEl = document.getElementById("reviewFormMsg");
      msgEl.className = "review-form-msg";
      msgEl.textContent = "";

      const honeypot = document.getElementById("rvHoneypot").value;
      if (honeypot) return; // silently drop bot submissions

      const last = parseInt(localStorage.getItem(RATE_LIMIT_KEY) || "0", 10);
      if (Date.now() - last < RATE_LIMIT_MS) {
        msgEl.className = "review-form-msg error";
        msgEl.textContent = "Please wait a moment before submitting another review.";
        return;
      }

      const name = document.getElementById("rvName").value.trim();
      const email = document.getElementById("rvEmail").value.trim();
      const comment = document.getElementById("rvComment").value.trim();
      const rating = parseInt(document.getElementById("rvRating").value || "0", 10);

      if (!name || !comment || rating < 1 || rating > 5) {
        msgEl.className = "review-form-msg error";
        msgEl.textContent = "Please add your name, a rating, and a short comment.";
        return;
      }

      try {
        await addDoc(collection(db, REVIEWS_COLLECTION), {
          name, email: email || null, comment, rating,
          status: "pending", featured: false,
          createdAt: serverTimestamp()
        });
        localStorage.setItem(RATE_LIMIT_KEY, String(Date.now()));
        msgEl.className = "review-form-msg success";
        msgEl.textContent = "Thank you! Your review has been submitted and will appear once approved.";
        e.target.reset();
        stars.forEach((s) => s.classList.remove("active"));
        setTimeout(() => overlay.classList.remove("open"), 2200);
      } catch (err) {
        console.error("Review submit failed:", err);
        msgEl.className = "review-form-msg error";
        msgEl.textContent = "Something went wrong. Please try again or contact us on WhatsApp.";
      }
    });
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => overlay.classList.add("open")));
}
