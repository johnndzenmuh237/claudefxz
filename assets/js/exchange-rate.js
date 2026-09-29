/* USD → XAF (CFA franc) live rate, cached 1 hour. Two free sources, no API key. */
const CACHE_KEY = 'cfx_usd_xaf';
const TTL_MS = 60 * 60 * 1000;

async function fromErApi() {
  const r = await fetch('https://open.er-api.com/v6/latest/USD');
  const j = await r.json();
  const v = j && j.rates && j.rates.XAF;
  if (!v) throw new Error('no XAF');
  return v;
}
// XAF is pegged to the euro: 1 EUR = 655.957 XAF
async function fromFrankfurter() {
  const r = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
  const j = await r.json();
  if (!j || !j.rates || !j.rates.EUR) throw new Error('no EUR');
  return j.rates.EUR * 655.957;
}

export async function getUsdToXafRate() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (c && Date.now() - c.t < TTL_MS) return c.v;
  } catch (e) {}
  let v;
  try { v = await fromErApi(); } catch (e) { v = await fromFrankfurter(); }
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ v, t: Date.now() })); } catch (e) {}
  return v;
}
