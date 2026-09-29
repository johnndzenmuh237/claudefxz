/* ============================================================
   CLAUDEFX ACADEMY PRO — student-portal/checkout.html logic
   ============================================================ */
import { auth, db } from "../assets/js/firebase-config.js";
import { requireUser, populateUserUI } from "../assets/js/auth-helpers.js";

// ⚠️ Must match the URL from `wrangler deploy` (see CLOUDFLARE_SETUP.md)
const WORKER_BASE_URL = "https://claudefx-crypto-checkout.YOUR-SUBDOMAIN.workers.dev";

const params = new URLSearchParams(window.location.search);
const productId = params.get("product");

let paymentMethodsData = null;
let selectedMethod = null;
let currentOrderId = null;
let pollTimer = null;

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

async function loadProduct() {
  const res = await fetch(WORKER_BASE_URL + "/api/product?id=" + encodeURIComponent(productId));
  if (!res.ok) throw new Error("Product not found");
  const product = await res.json();
  el("coProductTitle").textContent = product.title;
  el("coProductPrice").textContent = "$" + product.priceUSD;
  return product;
}

async function loadPaymentMethods() {
  const res = await fetch(WORKER_BASE_URL + "/api/payment-methods");
  paymentMethodsData = await res.json();
}

function selectMethod(method, product) {
  selectedMethod = method;
  document.querySelectorAll(".co-method-btn").forEach((b) => b.classList.toggle("active", b.dataset.method === method));
  el("coMomoPanel").classList.toggle("active", method === "mtn" || method === "orange");
  el("coCryptoPanel").classList.toggle("active", method === "crypto");
  el("coForm").style.display = "block";
  el("coSenderPhone").style.display = method === "crypto" ? "none" : "block";
  el("coSenderWallet").style.display = method === "crypto" ? "block" : "none";
  el("coRefLabel").textContent = method === "crypto" ? "Transaction Hash / TXID" : "Transaction ID";

  if (method === "mtn" || method === "orange") {
    const cfg = paymentMethodsData.mobileMoney[method];
    const amountXAF = Math.round(product.priceUSD * paymentMethodsData.fx.usdToXaf);
    el("coMomoName").textContent = cfg.recipientName;
    el("coMomoNumber").childNodes[0].textContent = cfg.number + " ";
    el("coMomoAmount").childNodes[0].textContent = amountXAF.toLocaleString() + " XAF ";
  } else if (method === "crypto") {
    renderCryptoOptions(product);
  }
}

function renderCryptoOptions(product) {
  const select = el("coCryptoSelect");
  select.innerHTML = Object.entries(paymentMethodsData.cryptoWallets)
    .map(([key, w]) => `<option value="${key}">${w.coin} — ${w.network}</option>`)
    .join("");
  const updateCryptoPanel = () => {
    const w = paymentMethodsData.cryptoWallets[select.value];
    el("coCryptoNetwork").textContent = w.network;
    el("coCryptoAddress").childNodes[0].textContent = w.address + " ";
    el("coCryptoAmount").textContent = "$" + product.priceUSD + " worth of " + w.coin;
    el("coQr").innerHTML = "";
    // eslint-disable-next-line no-undef
    new QRCode(el("coQr"), { text: w.address, width: 160, height: 160 });
  };
  select.addEventListener("change", updateCryptoPanel);
  updateCryptoPanel();
}

function showMsg(text, type) {
  const msg = el("coMsg");
  msg.textContent = text;
  msg.className = "co-msg " + type;
}

async function submitPayment(e) {
  e.preventDefault();
  const submitBtn = el("coSubmitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting…";

  try {
    const body = {
      productId,
      method: selectedMethod,
      reference: el("coReference").value.trim(),
    };
    if (selectedMethod === "crypto") {
      body.cryptoAsset = el("coCryptoSelect").value;
      body.senderWallet = el("coSenderWallet").value.trim() || null;
    } else {
      body.senderPhone = el("coSenderPhone").value.trim() || null;
    }

    const data = await authedFetch("/api/submit-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    currentOrderId = data.orderId;
    localStorage.setItem("cfx_last_order_" + productId, data.orderId);
    showStatus("pending");
    startPolling();
  } catch (err) {
    showMsg(err.message || "Something went wrong. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Payment for Verification";
  }
}

function showStatus(status, reason) {
  document.querySelector(".co-card").style.display = status ? "none" : "block";
  el("coStatusPending").style.display = status === "pending" ? "block" : "none";
  el("coStatusApproved").style.display = status === "approved" ? "block" : "none";
  el("coStatusRejected").style.display = status === "rejected" ? "block" : "none";
  if (status === "rejected") el("coRejectReason").textContent = reason || "";
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    try {
      const data = await authedFetch("/api/order-status?orderId=" + encodeURIComponent(currentOrderId));
      if (data.status === "approved") {
        clearInterval(pollTimer);
        showStatus("approved");
      } else if (data.status === "rejected") {
        clearInterval(pollTimer);
        showStatus("rejected", data.rejectionReason);
      }
    } catch (err) {
      console.warn("Status poll failed:", err.message);
    }
  }, 8000);
}

el("coTryAgainBtn")?.addEventListener("click", () => {
  currentOrderId = null;
  showStatus(null);
  el("coForm").reset();
  showMsg("", "");
});

document.querySelectorAll(".co-copy").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.copy;
    const text = el(targetId).childNodes[0].textContent.trim();
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1200);
    });
  });
});

document.querySelectorAll(".co-method-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const product = await loadProduct();
    selectMethod(btn.dataset.method, product);
  });
});

el("coForm").addEventListener("submit", submitPayment);

(async function init() {
  try {
    const { profile } = await requireUser();
    populateUserUI(profile);

    if (!productId) {
      el("coProductTitle").textContent = "Product not specified";
      return;
    }

    const [product] = await Promise.all([loadProduct(), loadPaymentMethods()]);

    // If there's already a pending/approved order for this product, show its status
    try {
      const { orders } = await authedFetch("/api/my-orders");
      const existing = orders.find((o) => o.productId === productId && (o.status === "pending" || o.status === "approved"));
      if (existing) {
        currentOrderId = existing.orderId;
        showStatus(existing.status);
        if (existing.status === "pending") startPolling();
      }
    } catch (err) {
      console.warn("Could not load existing orders:", err.message);
    }
  } catch (err) {
    // requireUser() already redirects to login
  }
})();
