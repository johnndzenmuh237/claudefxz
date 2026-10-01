/* ============================================================
   CLAUDEFX ACADEMY PRO — student-portal/checkout.html logic
   Manual payment system (MTN / Orange / Crypto) on Firestore.
   Customer pays -> submits reference -> order is "pending" ->
   admin approves in admin-payments.html -> library unlocks.
   ============================================================ */
import { requireUser, populateUserUI } from './auth-helpers.js';
import { db } from './firebase-config.js';
import { doc, runTransaction, serverTimestamp, collection, query, where, getDocs }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getUsdToXafRate } from './exchange-rate.js';
import { openUrl } from './access.js';

const CFG = window.PAYMENT_CONFIG || {};
const params = new URLSearchParams(window.location.search);
const slug = params.get('product');
const product = (window.CATALOG || {})[slug];

let currentUser = null, xafRate = null, selectedCoin = null, selectedMomo = null;

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function showMsg(id, text) { const d = document.createElement('div'); d.className = 'co-alert'; d.textContent = text; $(id).replaceChildren(d); }

/* ---------------- LOGOS ---------------- */
const SVG_MTN = `<svg viewBox="0 0 120 72" role="img" aria-label="MTN"><ellipse cx="60" cy="36" rx="58" ry="34" fill="#ffcc00"/><text x="60" y="47" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="30" fill="#000">MTN</text></svg>`;
const SVG_ORANGE = `<svg viewBox="0 0 72 72" role="img" aria-label="Orange"><rect width="72" height="72" fill="#ff7900"/><text x="36" y="66" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-weight="700" font-size="12" fill="#fff">orange™</text></svg>`;
function momoLogoHtml(key) {
  const p = CFG.mobileMoney[key];
  if (p.logo) return `<img src="${esc(p.logo)}" alt="${esc(p.providerName)}">`;
  return key === 'mtn' ? SVG_MTN : SVG_ORANGE;
}
const COIN_TICKER = { btc:'btc', eth:'eth', usdt_trc20:'usdt', usdt_erc20:'usdt', usdt_bep20:'usdt', bnb:'bnb', ltc:'ltc', trx:'trx', doge:'doge', sol:'sol' };
const COIN_GECKO  = { btc:'bitcoin', eth:'ethereum', usdt_trc20:'tether', usdt_erc20:'tether', usdt_bep20:'tether', bnb:'binancecoin', ltc:'litecoin', trx:'tron', doge:'dogecoin', sol:'solana' };
const COIN_SYMBOL = { btc:'BTC', eth:'ETH', usdt_trc20:'USDT', usdt_erc20:'USDT', usdt_bep20:'USDT', bnb:'BNB', ltc:'LTC', trx:'TRX', doge:'DOGE', sol:'SOL' };
function coinSources(code) {
  const t = COIN_TICKER[code] || code;
  return [
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/svg/color/${t}.svg`,
    `https://assets.coincap.io/assets/icons/${t}@2x.png`,
    `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/${t}.png`,
  ];
}
// Real coin logo with 2 fallback CDNs, then a letter badge.
function coinIconEl(code, label) {
  const wrap = document.createElement('span');
  wrap.className = 'coin-ico';
  const srcs = coinSources(code);
  let i = 0;
  const img = new Image();
  img.alt = label || '';
  img.onerror = () => {
    i++;
    if (i < srcs.length) img.src = srcs[i];
    else { img.remove(); wrap.textContent = (COIN_SYMBOL[code] || code).slice(0, 1); }
  };
  img.src = srcs[0];
  wrap.appendChild(img);
  return wrap;
}

/* ---------------- VIDEO (YouTube link from payment-config.js) ---------------- */
function youtubeId(url) {
  if (!url) return null;
  const u = String(url).trim();
  const m = u.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(u) ? u : null;
}
function setupVideo() {
  const url = (CFG.productVideos && CFG.productVideos[slug]) || product.videoUrl || CFG.checkoutVideoUrl;
  const id = youtubeId(url);
  if (!id) return;
  $('videoFrame').src = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
  $('videoTitle').textContent = CFG.checkoutVideoTitle || 'Watch before you pay';
  $('videoCard').style.display = 'block';
}

/* ---------------- STEPS ---------------- */
const STEP_MAP = { stepMethod: 1, stepMomo: 2, stepCryptoCoins: 2, stepCryptoPay: 2, pendingBox: 3, approvedBox: 3 };
const STEP_LABELS = ['Method', 'Pay', 'Confirmed'];
const ALL_STEPS = ['stepMethod','stepMomo','stepCryptoCoins','stepCryptoPay','pendingBox','approvedBox'];
function renderStepIndicator(current) {
  let html = '<div class="co-steps">';
  for (let i = 1; i <= 3; i++) {
    const cls = i < current ? 'done' : (i === current ? 'active' : '');
    html += `<div><div class="dot ${cls}">${i < current ? '<i class="fas fa-check"></i>' : i}</div><div class="lbl">${STEP_LABELS[i-1]}</div></div>`;
    if (i < 3) html += '<div class="line"></div>';
  }
  $('stepIndicator').innerHTML = html + '</div>';
}
function showStep(id) {
  ALL_STEPS.forEach(s => $(s).style.display = 'none');
  $(id).style.display = 'block';
  renderStepIndicator(STEP_MAP[id] || 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------- METHOD CARDS ---------------- */
function buildMethodCards() {
  const cards = [];
  const mm = CFG.mobileMoney || {};
  for (const key of ['mtn', 'orange']) {
    const p = mm[key];
    if (!p || p.enabled === false || !p.accountNumber) continue;
    cards.push(`<button type="button" class="co-method" data-method="${key}">
      <div class="logo-box">${momoLogoHtml(key)}</div>
      <span class="name">${esc(p.providerName)}</span><small>Pay in CFA (XAF)</small></button>`);
  }
  const hasCrypto = Object.values(CFG.cryptoWallets || {}).some(w => w.enabled && w.address);
  if (hasCrypto) {
    cards.push(`<button type="button" class="co-method" data-method="crypto">
      <div class="logo-box"><div class="logo-pair" id="cryptoPair"></div></div>
      <span class="name">Cryptocurrency</span><small>BTC, ETH, USDT, SOL &amp; more</small></button>`);
  }
  $('methodCards').innerHTML = cards.join('') || '<p class="co-alert">No payment method is available right now. Please contact support.</p>';
  const pair = $('cryptoPair');
  if (pair) ['btc', 'eth', 'usdt_trc20'].forEach(c => pair.appendChild(coinIconEl(c)));
  document.querySelectorAll('[data-method]').forEach(card => card.addEventListener('click', () => onMethod(card.dataset.method)));
}

async function onMethod(method) {
  if (method === 'crypto') { buildCoinGrid(); showStep('stepCryptoCoins'); return; }
  selectedMomo = method;
  const p = CFG.mobileMoney[method];
  $('momoLogo').innerHTML = momoLogoHtml(method);
  $('momoHeading').textContent = 'Pay with ' + p.providerName;
  $('momoProviderName2').textContent = p.providerName;
  $('momoUssd').textContent = p.ussd || 'your Mobile Money menu';
  $('momoName').textContent = p.accountName || '(contact support)';
  $('momoNumber').textContent = p.accountNumber;
  $('momoAmount').textContent = 'Calculating…';
  $('momoAmountSub').textContent = '';
  $('momoMsg').innerHTML = '';
  showStep('stepMomo');
  try {
    if (!xafRate) xafRate = await getUsdToXafRate();
    if (!xafRate || !isFinite(xafRate)) throw new Error('rate');
    const amountXaf = Math.ceil(product.priceUsd * xafRate);
    $('momoAmount').textContent = amountXaf.toLocaleString('en-US') + ' CFA';
    $('momoAmountSub').textContent = `≈ $${product.priceUsd} USD · rate 1 USD = ${Math.round(xafRate).toLocaleString('en-US')} CFA`;
  } catch (err) {
    xafRate = null;
    $('momoAmount').textContent = 'Amount unavailable';
    $('momoAmountSub').textContent = 'Could not load the exchange rate — refresh the page and try again.';
  }
}
document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => showStep(btn.dataset.back)));

/* ---------------- CRYPTO ---------------- */
function buildCoinGrid() {
  const grid = $('coinGrid');
  const entries = Object.entries(CFG.cryptoWallets || {}).filter(([, w]) => w.enabled && w.address);
  grid.innerHTML = '';
  if (!entries.length) { $('noCryptoMsg').style.display = 'block'; return; }
  $('noCryptoMsg').style.display = 'none';
  entries.forEach(([code, w]) => {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'coin-btn';
    btn.appendChild(coinIconEl(code, w.label));
    const t = document.createElement('span');
    t.innerHTML = `${esc(w.label)}<br><small>${esc(w.network)}</small>`;
    btn.appendChild(t);
    btn.addEventListener('click', () => selectCoin(code));
    grid.appendChild(btn);
  });
}

async function selectCoin(code) {
  selectedCoin = code;
  const w = CFG.cryptoWallets[code];
  const newIco = coinIconEl(code, w.label); newIco.id = 'cryptoLogo';
  $('cryptoLogo').replaceWith(newIco);
  $('cryptoHeading').textContent = 'Pay with ' + w.label;
  $('cryptoNetworkName').textContent = w.network;
  $('cryptoAddress').textContent = w.address;
  $('confNote').innerHTML = w.confirmationsNote ? `<i class="far fa-clock" style="color:var(--color-gold);"></i> ${esc(w.confirmationsNote)}` : '';
  $('cryptoMsg').innerHTML = '';
  $('qrHolder').innerHTML = '';
  if (window.QRCode) new QRCode($('qrHolder'), { text: w.address, width: 170, height: 170 });
  $('cryptoAmount').textContent = `$${product.priceUsd} USD`;
  $('cryptoAmountSub').textContent = 'Calculating coin amount…';
  showStep('stepCryptoPay');

  const sym = COIN_SYMBOL[code] || w.label;
  if (COIN_GECKO[code] === 'tether') {
    $('cryptoAmount').textContent = `${Number(product.priceUsd).toFixed(2)} USDT`;
    $('cryptoAmountSub').textContent = `1 USDT ≈ $1 · send on ${w.network}. Network fees are paid by you.`;
    return;
  }
  try {
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${COIN_GECKO[code]}&vs_currencies=usd`);
    const j = await r.json();
    const price = j[COIN_GECKO[code]].usd;
    const amt = product.priceUsd / price;
    const dec = price > 1000 ? 6 : price > 10 ? 5 : price > 1 ? 4 : 2;
    $('cryptoAmount').textContent = `≈ ${amt.toFixed(dec)} ${sym}`;
    $('cryptoAmountSub').textContent = `$${product.priceUsd} USD at 1 ${sym} = $${price.toLocaleString('en-US')}. Send at least this value; network fees are paid by you.`;
  } catch (e) {
    $('cryptoAmount').textContent = `$${product.priceUsd} USD in ${sym}`;
    $('cryptoAmountSub').textContent = 'Send the USD equivalent at the current market price. Network fees are paid by you.';
  }
}

function flash(btn) { const old = btn.innerHTML; btn.innerHTML = '<i class="fas fa-check"></i> Copied'; setTimeout(() => btn.innerHTML = old, 1500); }
async function copyText(text, btn) {
  try { await navigator.clipboard.writeText(text); }
  catch { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
  flash(btn);
}
$('copyAddrBtn').addEventListener('click', (e) => copyText($('cryptoAddress').textContent, e.currentTarget));
$('copyMomoBtn').addEventListener('click', (e) => copyText($('momoNumber').textContent, e.currentTarget));

/* ---------------- SUBMIT ---------------- */
function genReference(prefix) {
  const d = new Date();
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
  return `${prefix}-${y}${m}${day}-${Math.floor(100000 + Math.random() * 900000)}`;
}

// Duplicate protection: the tx id / hash is the document ID in `usedReferences`.
// firestore.rules only lets users CREATE there, so a reused reference is rejected by Firestore itself.
async function submitOrder({ method, amountUsd, extra, rawReference }) {
  const refKey = rawReference.trim().toLowerCase().replace(/\s+/g, '').replace(/\//g, '_');
  if (refKey.length < 4) throw new Error('Please enter a valid transaction ID.');
  const internalRef = genReference(method === 'crypto' ? 'CRYPTO' : 'PAY');
  const orderRef = doc(db, 'orders', internalRef);
  const usedRefRef = doc(db, 'usedReferences', refKey);

  await runTransaction(db, async (tx) => {
    const usedSnap = await tx.get(usedRefRef);
    if (usedSnap.exists()) throw new Error('DUPLICATE');
    tx.set(usedRefRef, { uid: currentUser.uid, orderId: internalRef, createdAt: serverTimestamp() });
    tx.set(orderRef, {
      id: internalRef,
      uid: currentUser.uid,
      buyerEmail: currentUser.email || null,
      slug,
      title: product.title,
      type: product.type,
      priceUsd: product.priceUsd,
      amount: amountUsd,
      method,
      refKey,
      status: 'pending',
      rejectionReason: null,
      submittedAt: serverTimestamp(),
      verifiedAt: null,
      verifiedBy: null,
      durationDays: (window.getCatalogDuration ? window.getCatalogDuration(slug) : null),
      ...extra,
    });
  });
  return internalRef;
}
function friendlyError(err) {
  if (err.code === 'permission-denied') return 'This transaction ID may already be used, or the submission was blocked. Check the ID and try again, or contact support.';
  return err.message || 'Something went wrong. Please try again.';
}

$('momoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  if (!xafRate) { showMsg('momoMsg', 'The CFA amount could not be calculated. Please refresh the page and try again.'); return; }
  btn.disabled = true;
  const p = CFG.mobileMoney[selectedMomo];
  const amountXaf = Math.ceil(product.priceUsd * xafRate);
  try {
    const ref = await submitOrder({
      method: 'momo', amountUsd: product.priceUsd, rawReference: $('momoTxId').value,
      extra: {
        provider: selectedMomo, providerName: p.providerName,
        recipientName: p.accountName, recipientNumber: p.accountNumber,
        senderPhone: $('momoSenderPhone').value.trim() || null,
        transactionId: $('momoTxId').value.trim(),
        amountXaf, xafRate, currency: 'XAF',
      },
    });
    $('refDisplay').textContent = ref;
    showStep('pendingBox');
  } catch (err) {
    btn.disabled = false;
    showMsg('momoMsg', err.message === 'DUPLICATE' ? 'This transaction ID has already been used. Please submit a different transaction ID.' : friendlyError(err));
  }
});

$('cryptoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  const w = CFG.cryptoWallets[selectedCoin];
  try {
    const ref = await submitOrder({
      method: 'crypto', amountUsd: product.priceUsd, rawReference: $('txHash').value,
      extra: {
        cryptocurrency: w.label, network: w.network, walletAddress: w.address,
        senderWallet: $('senderWallet').value.trim() || null,
        transactionHash: $('txHash').value.trim(), currency: 'USD',
      },
    });
    $('refDisplay').textContent = ref;
    showStep('pendingBox');
  } catch (err) {
    btn.disabled = false;
    showMsg('cryptoMsg', err.message === 'DUPLICATE' ? 'This transaction has already been submitted or used for another payment.' : friendlyError(err));
  }
});

/* ---------------- INIT ---------------- */
async function existingOrderStatus() {
  try {
    const snap = await getDocs(query(collection(db, 'orders'), where('uid', '==', currentUser.uid)));
    let found = null;
    snap.forEach(d => {
      const o = d.data();
      if (o.slug !== slug) return;
      if (o.status === 'approved') found = { status: 'approved', o };
      else if (o.status === 'pending' && (!found || found.status !== 'approved')) found = { status: 'pending', o };
    });
    return found;
  } catch (e) { return null; }
}

requireUser().then(async ({ user, profile }) => {
  currentUser = user;
  populateUserUI(profile);
  $('loadingBox').style.display = 'none';
  if (!product) { $('notFoundBox').style.display = 'block'; return; }

  $('productTitle').textContent = product.title;
  $('productPrice').textContent = '$' + product.priceUsd + ' USD';
  setupVideo();
  buildMethodCards();
  if (CFG.supportWhatsApp) { $('helpWa').href = CFG.supportWhatsApp; $('helpLine').style.display = 'block'; }

  const existing = await existingOrderStatus();
  if (existing && existing.status === 'approved') {
    const go = $('openPaidBtn'); go.href = openUrl(slug);
    go.innerHTML = product.type === 'ebook' ? '<i class="fas fa-download"></i> Go to My Ebooks' : '<i class="fas fa-play"></i> Open my ' + (product.type === 'course' ? 'course' : product.type === 'bot' ? 'bot' : 'mentorship');
    showStep('approvedBox'); return;
  }
  if (existing && existing.status === 'pending') { $('refDisplay').textContent = existing.o.id; showStep('pendingBox'); return; }
  showStep('stepMethod');
}).catch(() => { /* requireUser() already redirects to login */ });
