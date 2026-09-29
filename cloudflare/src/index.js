/* ============================================================
   CLAUDEFX ACADEMY PRO — Cloudflare Worker
   Manual MTN Mobile Money / Orange Money / Crypto payment system
   + gated ebook & course-video delivery, all inside the student
   dashboard. 100% free stack (Cloudflare Workers + KV, Backblaze B2
   for files) — no billing account anywhere, no automatic payment
   gateway, no card required by any service used here.

   FLOW: user pays manually → submits a reference (MoMo transaction
   ID, or crypto tx hash) → order sits as "pending" → YOU (the admin)
   check the real payment yourself → approve or reject in
   /student-portal/admin-payments.html → only then is content unlocked.
   Nothing here ever auto-approves a payment.
   ============================================================ */

/* ================================================================
   ⚠️  EDIT THIS SECTION — this is the ONLY place you paste your
   real payment details. Nothing else in this file needs editing
   for normal use.
   ================================================================ */

// --- Mobile Money recipients (Cameroon, CFA / XAF) ---
const MOBILE_MONEY = {
  mtn: {
    label: "MTN Mobile Money",
    recipientName: "JOHN NDZENMUH",
    number: "+237679806062", // e.g. "677123456"
  },
  orange: {
    label: "Orange Money",
    recipientName: "JOHN NDZENMUH",
    number: "+237695", // e.g. "699123456"
  },
};

// --- Crypto wallets. Add/remove entries freely — the checkout page
// automatically lists whatever is here. Each entry = one coin+network
// combination. Never reuse one address across two different networks.
const CRYPTO_WALLETS = {
  btc: { coin: "BTC", network: "Bitcoin", address: "bc1qmrx53ld85qftp4ng4gp4vcg3d38el34s00tq0l" },
  eth: { coin: "ETH", network: "Ethereum (ERC-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F" },
  usdt_trc20: { coin: "USDT", network: "Tron (TRC-20)", address: "TX7CpBYg8Gph7A4T2EqyS586qaMYENDteL" },
  usdt_erc20: { coin: "USDT", network: "Ethereum (ERC-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F" },
  usdt_bep20: { coin: "USDT", network: "BNB Smart Chain (BEP-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F" },
  bnb_bep20: { coin: "BNB", network: "BNB Smart Chain (BEP-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F" },
};

// --- Who is allowed to approve/reject payments (their Firebase login email) ---
const ADMIN_EMAILS = ["PASTE_YOUR_ADMIN_EMAIL_HERE@example.com"];

/* ================================================================
   Products — ebooks + courses. "files" are what unlock after an
   approved payment. Each "key" must match exactly what you upload to
   your Backblaze B2 bucket (see CLOUDFLARE_SETUP.md for the exact
   folder/filename convention). Add more products by copying a block
   below — no other code needs to change.
   ================================================================ */
const PRODUCTS = {
  "risk-management-guide": {
    type: "ebook",
    title: "Risk Management Guide",
    priceUSD: 29,
    files: [{ key: "ebooks/risk-management-guide.pdf", kind: "pdf", label: "Risk Management Guide (PDF)" }],
  },
  "technical-analysis-guide": {
    type: "ebook",
    title: "Technical Analysis Guide",
    priceUSD: 29,
    files: [{ key: "ebooks/technical-analysis-guide.pdf", kind: "pdf", label: "Technical Analysis Guide (PDF)" }],
  },
  "fundamental-analysis-guide": {
    type: "ebook",
    title: "Fundamental Analysis Guide",
    priceUSD: 29,
    files: [{ key: "ebooks/fundamental-analysis-guide.pdf", kind: "pdf", label: "Fundamental Analysis Guide (PDF)" }],
  },
  "psychology-guide": {
    type: "ebook",
    title: "Psychology vs Physiology in Trading",
    priceUSD: 29,
    files: [{ key: "ebooks/psychology-guide.pdf", kind: "pdf", label: "Psychology vs Physiology in Trading (PDF)" }],
  },
  "strategy-playbook": {
    type: "ebook",
    title: "Trading Strategy Playbook",
    priceUSD: 39,
    files: [{ key: "ebooks/strategy-playbook.pdf", kind: "pdf", label: "Trading Strategy Playbook (PDF)" }],
  },

  // Example course with videos — copy this block for each real course.
  // Upload matching video files to B2 under courses/<product-id>/...
  "forex-full-course": {
    type: "course",
    title: "Forex Full Course & Mentorship",
    priceUSD: 297,
    files: [
      { key: "courses/forex-full-course/01-introduction.mp4", kind: "video", label: "1. Introduction" },
      { key: "courses/forex-full-course/02-market-structure.mp4", kind: "video", label: "2. Market Structure" },
      { key: "courses/forex-full-course/03-risk-management.mp4", kind: "video", label: "3. Risk Management" },
      { key: "courses/forex-full-course/course-workbook.pdf", kind: "pdf", label: "Course Workbook (PDF)" },
    ],
  },
};

const FIREBASE_PROJECT_ID = "swiftchain-827f2"; // must match assets/js/firebase-config.js
const ALLOWED_ORIGIN = "*"; // tighten to your real domain once you have one

/* ================================================================
   Below this line: implementation. You shouldn't need to edit
   anything past here for normal use.
   ================================================================ */

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function nowIso() {
  return new Date().toISOString();
}

function makeOrderId() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `PAY-${stamp}-${rand}`;
}

function normalizeRef(ref) {
  return String(ref || "").trim().toLowerCase().replace(/\s+/g, "");
}

/* ------------------------------------------------------------------ */
/* Firebase ID token verification (no Firebase Admin SDK needed —      */
/* this only checks WHO the user is; it's free and doesn't touch any   */
/* paid Firebase service).                                             */
/* ------------------------------------------------------------------ */
let cachedJwks = null;
let cachedJwksAt = 0;

async function getGoogleJwks() {
  const now = Date.now();
  if (cachedJwks && now - cachedJwksAt < 60 * 60 * 1000) return cachedJwks;
  const res = await fetch(
    "https://www.googleapis.com/service_accounts/v1/jwk/[email protected]"
  );
  const data = await res.json();
  cachedJwks = data.keys;
  cachedJwksAt = now;
  return cachedJwks;
}

function base64UrlToUint8Array(base64url) {
  const padded = base64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    base64url.length + ((4 - (base64url.length % 4)) % 4),
    "="
  );
  const raw = atob(padded);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function base64UrlToJson(base64url) {
  return JSON.parse(new TextDecoder().decode(base64UrlToUint8Array(base64url)));
}

async function verifyFirebaseToken(idToken) {
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [headerB64, payloadB64, sigB64] = parts;
  const header = base64UrlToJson(headerB64);
  const payload = base64UrlToJson(payloadB64);

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== FIREBASE_PROJECT_ID) throw new Error("Wrong audience");
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) throw new Error("Wrong issuer");
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.iat > now + 60) throw new Error("Token issued in the future");
  if (!payload.sub) throw new Error("Missing subject");

  const jwks = await getGoogleJwks();
  const jwk = jwks.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("No matching signing key");

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const signature = base64UrlToUint8Array(sigB64);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signedData);
  if (!valid) throw new Error("Invalid signature");

  return { uid: payload.sub, email: payload.email || null };
}

async function requireAuth(request) {
  const authHeader = request.headers.get("Authorization") || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error("Missing Authorization header");
  return verifyFirebaseToken(match[1]);
}

async function requireAdmin(request) {
  const auth = await requireAuth(request);
  if (!auth.email || !ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(auth.email.toLowerCase())) {
    throw new Error("Not an admin");
  }
  return auth;
}

/* ------------------------------------------------------------------ */
/* USD → XAF exchange rate.                                            */
/* XAF is fixed by treaty at 1 EUR = 655.957 XAF (unchanged since      */
/* 1999 — this is a monetary-union peg, not a floating rate, so it's   */
/* safe to hardcode). Only the USD→EUR leg actually moves day to day,  */
/* so that's the only part we fetch live, from Frankfurter (free,      */
/* no API key, sourced from the European Central Bank).                */
/* ------------------------------------------------------------------ */
const EUR_TO_XAF_PEG = 655.957;
const FX_CACHE_KEY = "fx-rate:usd-xaf";
const FX_CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

async function getUsdToXafRate(env) {
  const cached = await env.ORDERS_KV.get(FX_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  let usdToEur;
  try {
    const res = await fetch("https://api.frankfurter.dev/v2/latest?base=USD&symbols=EUR");
    const data = await res.json();
    usdToEur = data.rates.EUR;
  } catch (err) {
    // Fallback if Frankfurter is briefly unreachable — a recent-history
    // approximate rate, better than failing checkout entirely. Update this
    // occasionally if you notice it drifting.
    usdToEur = 0.92;
  }

  const usdToXaf = usdToEur * EUR_TO_XAF_PEG;
  const result = { usdToXaf: Math.round(usdToXaf * 100) / 100, usdToEur, updatedAt: nowIso() };
  await env.ORDERS_KV.put(FX_CACHE_KEY, JSON.stringify(result), { expirationTtl: FX_CACHE_TTL_SECONDS });
  return result;
}

/* ------------------------------------------------------------------ */
/* Backblaze B2 file storage (ebooks + course videos).                 */
/* Used instead of Cloudflare R2 because R2 requires a payment method  */
/* on file to activate, even for free-tier usage. B2 does not — its    */
/* free 10GB tier needs no card at signup. See CLOUDFLARE_SETUP.md.    */
/* Set B2_KEY_ID, B2_APPLICATION_KEY, B2_BUCKET_NAME with:              */
/*   wrangler secret put B2_KEY_ID   (etc.)                            */
/* ------------------------------------------------------------------ */
const B2_AUTH_CACHE_KEY = "b2-auth";
const B2_AUTH_CACHE_TTL_SECONDS = 23 * 60 * 60; // B2 tokens last 24h — refresh a bit early

async function getB2Auth(env) {
  const cached = await env.ORDERS_KV.get(B2_AUTH_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const credentials = btoa(`${env.B2_KEY_ID}:${env.B2_APPLICATION_KEY}`);
  const res = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: { Authorization: `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error("Could not authenticate with Backblaze B2 — check your B2 secrets.");
  const data = await res.json();
  const result = { authorizationToken: data.authorizationToken, downloadUrl: data.downloadUrl };

  await env.ORDERS_KV.put(B2_AUTH_CACHE_KEY, JSON.stringify(result), { expirationTtl: B2_AUTH_CACHE_TTL_SECONDS });
  return result;
}

/* ------------------------------------------------------------------ */
/* Payment submission & storage                                        */
/* ------------------------------------------------------------------ */
async function writeAuditLog(env, entry) {
  const paddedTime = String(Date.now()).padStart(15, "0"); // sortable lexicographically
  await env.ORDERS_KV.put(`audit:${paddedTime}:${entry.orderId}`, JSON.stringify({ ...entry, at: nowIso() }));
}

async function handleSubmitPayment(request, env) {
  let auth;
  try {
    auth = await requireAuth(request);
  } catch (err) {
    return json({ error: "Please sign in: " + err.message }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const { productId, method, reference, senderPhone, cryptoAsset, senderWallet } = body;

  const product = PRODUCTS[productId];
  if (!product) return json({ error: "Unknown product" }, 400);
  if (!["mtn", "orange", "crypto"].includes(method)) return json({ error: "Invalid payment method" }, 400);
  if (!reference || !reference.trim()) return json({ error: "Please enter your transaction reference." }, 400);
  if (method === "crypto" && !CRYPTO_WALLETS[cryptoAsset]) {
    return json({ error: "Please select a valid crypto asset." }, 400);
  }

  // ---- Duplicate transaction reference protection (server-side, not just UI) ----
  const refKey = `txref:${normalizeRef(reference)}`;
  const existingRef = await env.ORDERS_KV.get(refKey);
  if (existingRef) {
    return json({ error: "This transaction reference has already been submitted. Please check your reference or contact support." }, 409);
  }

  // ---- Authoritative amount — always computed server-side, never trusted from the browser ----
  let amountXAF = null;
  let fxRateUsed = null;
  if (method === "mtn" || method === "orange") {
    const fx = await getUsdToXafRate(env);
    amountXAF = Math.round(product.priceUSD * fx.usdToXaf);
    fxRateUsed = fx.usdToXaf;
  }

  const orderId = makeOrderId();
  const order = {
    orderId,
    uid: auth.uid,
    email: auth.email,
    productId,
    productTitle: product.title,
    method,
    reference: reference.trim(),
    senderPhone: senderPhone || null,
    cryptoAsset: method === "crypto" ? cryptoAsset : null,
    cryptoNetwork: method === "crypto" ? CRYPTO_WALLETS[cryptoAsset].network : null,
    senderWallet: method === "crypto" ? senderWallet || null : null,
    amountUSD: product.priceUSD,
    amountXAF,
    fxRateUsed,
    status: "pending",
    submittedAt: nowIso(),
  };

  await env.ORDERS_KV.put(`order-by-id:${orderId}`, JSON.stringify(order));
  await env.ORDERS_KV.put(`order:${auth.uid}:${productId}:${orderId}`, JSON.stringify(order));
  await env.ORDERS_KV.put(refKey, orderId);
  await env.ORDERS_KV.put(`pending:${orderId}`, "1");

  await writeAuditLog(env, { orderId, action: "submitted", by: auth.email || auth.uid, newStatus: "pending" });

  return json({ orderId, status: "pending", amountUSD: product.priceUSD, amountXAF });
}

async function handleOrderStatus(request, url, env) {
  let auth;
  try {
    auth = await requireAuth(request);
  } catch (err) {
    return json({ error: "Please sign in" }, 401);
  }
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return json({ error: "Missing orderId" }, 400);

  const raw = await env.ORDERS_KV.get(`order-by-id:${orderId}`);
  if (!raw) return json({ error: "Order not found" }, 404);
  const order = JSON.parse(raw);
  if (order.uid !== auth.uid) return json({ error: "Not your order" }, 403);

  return json({
    status: order.status,
    rejectionReason: order.rejectionReason || null,
    productTitle: order.productTitle,
  });
}

async function handleMyOrders(request, env) {
  let auth;
  try {
    auth = await requireAuth(request);
  } catch (err) {
    return json({ error: "Please sign in" }, 401);
  }
  const list = await env.ORDERS_KV.list({ prefix: `order:${auth.uid}:` });
  const orders = [];
  for (const key of list.keys) {
    const raw = await env.ORDERS_KV.get(key.name);
    if (raw) orders.push(JSON.parse(raw));
  }
  orders.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  return json({ orders });
}

const PAID_STATUSES = ["approved"];

async function getOwnedProductIds(env, uid) {
  const list = await env.ORDERS_KV.list({ prefix: `order:${uid}:` });
  const owned = new Set();
  for (const key of list.keys) {
    const raw = await env.ORDERS_KV.get(key.name);
    if (!raw) continue;
    const order = JSON.parse(raw);
    if (PAID_STATUSES.includes(order.status)) owned.add(order.productId);
  }
  return owned;
}

async function handleMyLibrary(request, env) {
  let auth;
  try {
    auth = await requireAuth(request);
  } catch (err) {
    return json({ error: "Please sign in" }, 401);
  }
  const owned = await getOwnedProductIds(env, auth.uid);
  const items = [...owned].map((productId) => {
    const product = PRODUCTS[productId];
    if (!product) return null;
    return {
      productId,
      title: product.title,
      type: product.type,
      files: product.files.map((f) => ({ key: f.key, kind: f.kind, label: f.label })),
    };
  }).filter(Boolean);

  return json({ items });
}

/* ------------------------------------------------------------------ */
/* Admin: review, approve, reject                                      */
/* ------------------------------------------------------------------ */
async function handleAdminPendingPayments(request, env) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return json({ error: "Admin access required: " + err.message }, 403);
  }
  const list = await env.ORDERS_KV.list({ prefix: "pending:" });
  const orders = [];
  for (const key of list.keys) {
    const orderId = key.name.replace("pending:", "");
    const raw = await env.ORDERS_KV.get(`order-by-id:${orderId}`);
    if (raw) orders.push(JSON.parse(raw));
  }
  orders.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)); // oldest first
  return json({ orders });
}

async function handleAdminApprove(request, env) {
  let admin;
  try {
    admin = await requireAdmin(request);
  } catch (err) {
    return json({ error: "Admin access required: " + err.message }, 403);
  }
  const body = await request.json().catch(() => ({}));
  const { orderId } = body;
  const raw = await env.ORDERS_KV.get(`order-by-id:${orderId}`);
  if (!raw) return json({ error: "Order not found" }, 404);
  const order = JSON.parse(raw);
  if (order.status !== "pending") return json({ error: `Order is already ${order.status}` }, 400);

  order.status = "approved";
  order.approvedAt = nowIso();
  order.approvedBy = admin.email;

  await env.ORDERS_KV.put(`order-by-id:${orderId}`, JSON.stringify(order));
  await env.ORDERS_KV.put(`order:${order.uid}:${order.productId}:${orderId}`, JSON.stringify(order));
  await env.ORDERS_KV.delete(`pending:${orderId}`);
  await writeAuditLog(env, { orderId, action: "approved", by: admin.email, previousStatus: "pending", newStatus: "approved" });

  return json({ ok: true, order });
}

async function handleAdminReject(request, env) {
  let admin;
  try {
    admin = await requireAdmin(request);
  } catch (err) {
    return json({ error: "Admin access required: " + err.message }, 403);
  }
  const body = await request.json().catch(() => ({}));
  const { orderId, reason } = body;
  if (!reason || !reason.trim()) return json({ error: "A rejection reason is required" }, 400);

  const raw = await env.ORDERS_KV.get(`order-by-id:${orderId}`);
  if (!raw) return json({ error: "Order not found" }, 404);
  const order = JSON.parse(raw);
  if (order.status !== "pending") return json({ error: `Order is already ${order.status}` }, 400);

  order.status = "rejected";
  order.rejectedAt = nowIso();
  order.rejectedBy = admin.email;
  order.rejectionReason = reason.trim();

  await env.ORDERS_KV.put(`order-by-id:${orderId}`, JSON.stringify(order));
  await env.ORDERS_KV.put(`order:${order.uid}:${order.productId}:${orderId}`, JSON.stringify(order));
  // Free up the reference so the customer can submit a corrected one
  await env.ORDERS_KV.delete(`txref:${normalizeRef(order.reference)}`);
  await env.ORDERS_KV.delete(`pending:${orderId}`);
  await writeAuditLog(env, { orderId, action: "rejected", by: admin.email, previousStatus: "pending", newStatus: "rejected", reason: reason.trim() });

  return json({ ok: true, order });
}

async function handleAdminAuditLog(request, env) {
  try {
    await requireAdmin(request);
  } catch (err) {
    return json({ error: "Admin access required: " + err.message }, 403);
  }
  const list = await env.ORDERS_KV.list({ prefix: "audit:", limit: 200 });
  const entries = [];
  for (const key of list.keys) {
    const raw = await env.ORDERS_KV.get(key.name);
    if (raw) entries.push(JSON.parse(raw));
  }
  entries.reverse(); // most recent first
  return json({ entries });
}

/* ------------------------------------------------------------------ */
/* Public config endpoints — no secrets, safe for any visitor          */
/* ------------------------------------------------------------------ */
async function handleGetProduct(url) {
  const id = url.searchParams.get("id");
  const product = PRODUCTS[id];
  if (!product) return json({ error: "Product not found" }, 404);
  return json({ id, title: product.title, priceUSD: product.priceUSD, type: product.type });
}

async function handlePaymentMethods(env) {
  const fx = await getUsdToXafRate(env);
  return json({
    mobileMoney: MOBILE_MONEY,
    cryptoWallets: CRYPTO_WALLETS,
    fx: { usdToXaf: fx.usdToXaf, updatedAt: fx.updatedAt },
  });
}

/* ------------------------------------------------------------------ */
/* Gated media delivery (ebooks + course videos)                       */
/* ------------------------------------------------------------------ */
async function handleGetMediaToken(request, env) {
  let auth;
  try {
    auth = await requireAuth(request);
  } catch (err) {
    return json({ error: "Please sign in" }, 401);
  }
  const body = await request.json().catch(() => ({}));
  const { productId, fileKey } = body;
  const product = PRODUCTS[productId];
  if (!product) return json({ error: "Unknown product" }, 400);
  const file = product.files.find((f) => f.key === fileKey);
  if (!file) return json({ error: "Unknown file for this product" }, 400);

  const owned = await getOwnedProductIds(env, auth.uid);
  if (!owned.has(productId)) {
    return json({ error: "No approved purchase found for this product." }, 403);
  }

  const token = crypto.randomUUID();
  await env.ORDERS_KV.put(
    `mediatoken:${token}`,
    JSON.stringify({ uid: auth.uid, fileKey: file.key, kind: file.kind, label: file.label }),
    { expirationTtl: 3600 } // 1 hour — comfortable for a full video sitting
  );

  return json({ token, kind: file.kind, label: file.label });
}

async function handleMediaFile(request, url, env) {
  const token = url.searchParams.get("token");
  const mode = url.searchParams.get("mode") === "attachment" ? "attachment" : "inline";
  if (!token) return new Response("Missing token", { status: 400 });

  const raw = await env.ORDERS_KV.get(`mediatoken:${token}`);
  if (!raw) return new Response("This link has expired. Please go back and try again.", { status: 403 });
  const { fileKey, kind, label } = JSON.parse(raw);

  let auth;
  try {
    auth = await getB2Auth(env);
  } catch (err) {
    return new Response("Storage authentication failed. Please contact support.", { status: 502 });
  }

  const contentType = kind === "video" ? "video/mp4" : "application/pdf";
  const ext = kind === "video" ? "mp4" : "pdf";
  const safeName = label.replace(/[^a-z0-9 \-]/gi, "");

  const b2Url = `${auth.downloadUrl}/file/${env.B2_BUCKET_NAME}/${fileKey}`;
  const rangeHeader = request.headers.get("Range");

  const b2Res = await fetch(b2Url, {
    headers: {
      Authorization: auth.authorizationToken,
      ...(rangeHeader ? { Range: rangeHeader } : {}),
    },
  });

  if (b2Res.status === 404) return new Response("File not found. Please contact support.", { status: 404 });
  if (!b2Res.ok && b2Res.status !== 206) {
    return new Response("Could not load the file from storage. Please contact support.", { status: 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", contentType);
  headers.set("Content-Disposition", `${mode}; filename="${safeName}.${ext}"`);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Accept-Ranges", "bytes");
  const contentRange = b2Res.headers.get("Content-Range");
  if (contentRange) headers.set("Content-Range", contentRange);
  const contentLength = b2Res.headers.get("Content-Length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(b2Res.body, { status: b2Res.status, headers });
}

/* ------------------------------------------------------------------ */
/* Router                                                               */
/* ------------------------------------------------------------------ */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      // Public
      if (url.pathname === "/api/product" && request.method === "GET") return await handleGetProduct(url);
      if (url.pathname === "/api/payment-methods" && request.method === "GET") return await handlePaymentMethods(env);

      // User (signed in)
      if (url.pathname === "/api/submit-payment" && request.method === "POST") return await handleSubmitPayment(request, env);
      if (url.pathname === "/api/order-status" && request.method === "GET") return await handleOrderStatus(request, url, env);
      if (url.pathname === "/api/my-orders" && request.method === "GET") return await handleMyOrders(request, env);
      if (url.pathname === "/api/my-library" && request.method === "GET") return await handleMyLibrary(request, env);
      if (url.pathname === "/api/get-media-token" && request.method === "POST") return await handleGetMediaToken(request, env);
      if (url.pathname === "/api/media-file" && request.method === "GET") return await handleMediaFile(request, url, env);

      // Admin (signed in + email in ADMIN_EMAILS)
      if (url.pathname === "/api/admin/pending-payments" && request.method === "GET") return await handleAdminPendingPayments(request, env);
      if (url.pathname === "/api/admin/approve-payment" && request.method === "POST") return await handleAdminApprove(request, env);
      if (url.pathname === "/api/admin/reject-payment" && request.method === "POST") return await handleAdminReject(request, env);
      if (url.pathname === "/api/admin/audit-log" && request.method === "GET") return await handleAdminAuditLog(request, env);

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Unhandled error:", err);
      return json({ error: "Server error" }, 500);
    }
  },
};