/* ============================================================
   CLAUDEFX ACADEMY PRO — Crypto checkout (payment.html)
   ============================================================ */
import { auth, db, functions } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// Curated list of common coins NOWPayments supports. You can add more —
// just make sure the "code" matches NOWPayments' currency code exactly
// (check https://nowpayments.io/supported-coins).
const COINS = [
  { code: "btc", label: "Bitcoin (BTC)" },
  { code: "eth", label: "Ethereum (ETH)" },
  { code: "usdttrc20", label: "USDT (Tron / TRC-20)" },
  { code: "usdterc20", label: "USDT (Ethereum / ERC-20)" },
  { code: "bnbbsc", label: "BNB (BSC)" },
  { code: "ltc", label: "Litecoin (LTC)" },
  { code: "trx", label: "TRON (TRX)" },
  { code: "doge", label: "Dogecoin (DOGE)" },
];

const STATUS_LABELS = {
  waiting: { text: "Waiting for your payment…", cls: "status-waiting" },
  confirming: { text: "Payment detected — confirming on-chain…", cls: "status-confirming" },
  confirmed: { text: "Payment confirmed! Unlocking your ebook…", cls: "status-confirmed" },
  sending: { text: "Confirming…", cls: "status-confirming" },
  partially_paid: { text: "Partial payment received — please send the remaining amount.", cls: "status-waiting" },
  finished: { text: "Payment complete! Your ebook is unlocked.", cls: "status-confirmed" },
  failed: { text: "Payment failed. Please try again or contact support.", cls: "status-failed" },
  refunded: { text: "This payment was refunded.", cls: "status-failed" },
  expired: { text: "This payment address expired. Please start a new payment.", cls: "status-failed" },
};

const params = new URLSearchParams(window.location.search);
const productId = params.get("product");

const els = {
  loading: document.getElementById("pmLoading"),
  notFound: document.getElementById("pmNotFound"),
  authGate: document.getElementById("pmAuthGate"),
  main: document.getElementById("pmMain"),
  productTitle: document.getElementById("pmProductTitle"),
  productPrice: document.getElementById("pmProductPrice"),
  coinSelect: document.getElementById("pmCoinSelect"),
  generateBtn: document.getElementById("pmGenerateBtn"),
  checkoutBox: document.getElementById("pmCheckoutBox"),
  qr: document.getElementById("pmQr"),
  address: document.getElementById("pmAddress"),
  copyBtn: document.getElementById("pmCopyBtn"),
  amount: document.getElementById("pmAmount"),
  statusText: document.getElementById("pmStatusText"),
  successBox: document.getElementById("pmSuccessBox"),
  readBtn: document.getElementById("pmReadBtn"),
  downloadBtn: document.getElementById("pmDownloadBtn"),
  errorBox: document.getElementById("pmError"),
};

function showError(msg) {
  els.errorBox.textContent = msg;
  els.errorBox.style.display = "block";
}

async function loadProduct() {
  if (!productId) {
    els.loading.style.display = "none";
    els.notFound.style.display = "block";
    return;
  }
  const snap = await getDoc(doc(db, "products", productId));
  if (!snap.exists()) {
    els.loading.style.display = "none";
    els.notFound.style.display = "block";
    return;
  }
  const product = snap.data();
  els.productTitle.textContent = product.title;
  els.productPrice.textContent = "$" + product.priceUSD;
  els.loading.style.display = "none";
  els.main.style.display = "block";
}

function renderQr(text) {
  els.qr.innerHTML = "";
  // Uses the qrcode.js library loaded via <script> in payment.html
  // eslint-disable-next-line no-undef
  new QRCode(els.qr, { text, width: 176, height: 176, colorDark: "#0A0B0D", colorLight: "#ffffff" });
}

let unsubscribe = null;

function listenToOrder(paymentId, productTitle) {
  const ref = doc(db, "orders", String(paymentId));
  unsubscribe = onSnapshot(ref, (snap) => {
    if (!snap.exists()) return;
    const order = snap.data();
    const info = STATUS_LABELS[order.status] || { text: "Status: " + order.status, cls: "" };
    els.statusText.textContent = info.text;
    els.statusText.className = "pm-status " + info.cls;

    if (order.status === "finished" || order.status === "confirmed") {
      els.checkoutBox.style.display = "none";
      els.successBox.style.display = "block";
    }
  });
}

async function generatePayment() {
  els.generateBtn.disabled = true;
  els.generateBtn.textContent = "Generating address…";
  els.errorBox.style.display = "none";

  try {
    const createPayment = httpsCallable(functions, "createPayment");
    const result = await createPayment({ productId, payCurrency: els.coinSelect.value });
    const data = result.data;

    els.address.textContent = data.payAddress;
    els.amount.textContent = `${data.payAmount} ${data.payCurrency.toUpperCase()}`;
    renderQr(data.payAddress);
    els.checkoutBox.style.display = "block";
    els.statusText.textContent = "Waiting for your payment…";
    els.statusText.className = "pm-status status-waiting";

    listenToOrder(data.paymentId, data.productTitle);
  } catch (err) {
    console.error("createPayment failed:", err);
    showError(err.message || "Something went wrong creating the payment. Please try again.");
  } finally {
    els.generateBtn.disabled = false;
    els.generateBtn.textContent = "Generate Payment Address";
  }
}

async function downloadEbook(triggerDownload) {
  try {
    const getUrl = httpsCallable(functions, "getEbookDownloadUrl");
    const result = await getUrl({ productId });
    const { url } = result.data;
    if (triggerDownload) {
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else {
      window.location.href = `ebook-reader.html?product=${encodeURIComponent(productId)}`;
    }
  } catch (err) {
    console.error("download failed:", err);
    showError(err.message || "Could not fetch your ebook link. Please refresh and try again.");
  }
}

function populateCoins() {
  els.coinSelect.innerHTML = COINS.map((c) => `<option value="${c.code}">${c.label}</option>`).join("");
}

function init() {
  populateCoins();
  loadProduct();

  els.copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(els.address.textContent).then(() => {
      els.copyBtn.textContent = "Copied!";
      setTimeout(() => (els.copyBtn.textContent = "Copy Address"), 1500);
    });
  });

  els.generateBtn.addEventListener("click", generatePayment);
  els.readBtn.addEventListener("click", () => downloadEbook(false));
  els.downloadBtn.addEventListener("click", () => downloadEbook(true));

  onAuthStateChanged(auth, (user) => {
    if (user) {
      els.authGate.style.display = "none";
    } else {
      els.authGate.style.display = "block";
      els.main.style.display = "none";
      const redirectTarget = "login.html?redirect=" + encodeURIComponent(window.location.pathname + window.location.search);
      const loginLink = document.getElementById("pmLoginLink");
      if (loginLink) loginLink.href = redirectTarget;
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("beforeunload", () => { if (unsubscribe) unsubscribe(); });
