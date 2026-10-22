/* ============================================================
   CLAUDEFX ACADEMY PRO — assets/js/admin-sales.js
   The ONLY place payments are approved / rejected from the admin panel.

   approveOrder()  ONE atomic Firestore transaction that
                     1. marks the order "approved"   (this is what unlocks the buyer)
                     2. creates sales/{orderId}       (ledger entry with the product name)
                     3. updates stats/sales           (the dashboard "Total sales balance")
                     4. writes an audit-log entry
                   Either all four happen or none do, and an order can never be
                   credited twice (sale doc ID == order ID, status must be "pending").

   Firestore functions are passed in (`fs`) so this file has no hard dependency on the
   CDN and can be unit-tested against an in-memory fake.
   ============================================================ */
import {
  buildSale, applySaleToStats, aggregateSales, emptyStats, salesError,
} from './admin-sales-core.js';

/* Firestore rules allow at most 20 document look-ups per batched write and each ledger
   entry costs one, so back-fill writes are sent in small batches. */
const SYNC_BATCH_SIZE = 10;

export function createSalesService({ db, fs, getAdminEmail }) {
  const {
    doc, collection, runTransaction, writeBatch, getDocs, setDoc, query, where,
    serverTimestamp, getCountFromServer,
  } = fs;

  const statsRef = () => doc(db, 'stats', 'sales');
  const adminEmail = () => (getAdminEmail && getAdminEmail()) || 'admin';

  /* ----------------------------- APPROVE ----------------------------- */
  async function approveOrder(orderId) {
    const email = adminEmail();
    let result = null;

    await runTransaction(db, async (tx) => {
      const orderRef = doc(db, 'orders', orderId);
      const saleRef = doc(db, 'sales', orderId);

      // All reads first (Firestore requirement), then all writes.
      const orderSnap = await tx.get(orderRef);
      const saleSnap = await tx.get(saleRef);
      const statsSnap = await tx.get(statsRef());

      if (!orderSnap.exists()) throw salesError('sales/not-found', 'This order no longer exists.');
      const order = { ...orderSnap.data(), id: orderId };
      if (order.status !== 'pending') {
        throw salesError('sales/not-pending', `This payment was already ${order.status}.`);
      }
      if (saleSnap.exists()) {
        throw salesError('sales/already-credited', 'This order is already in the sales ledger.');
      }

      const sale = buildSale(order, email);
      const next = applySaleToStats(statsSnap.exists() ? statsSnap.data() : emptyStats(), sale, serverTimestamp());

      tx.update(orderRef, {
        status: 'approved', verifiedAt: serverTimestamp(), verifiedBy: email, rejectionReason: null,
      });
      tx.set(saleRef, { ...sale, approvedAt: serverTimestamp() });
      tx.set(statsRef(), { ...next, updatedAt: serverTimestamp() });
      tx.set(doc(collection(db, 'auditLog')), {
        orderId, action: 'approved', by: email, at: serverTimestamp(),
        productName: sale.productName, amountUsd: sale.amountUsd,
      });

      result = { sale, totalUsd: next.totalUsd, salesCount: next.salesCount };
    });

    return result;
  }

  /* ----------------------------- REJECT ----------------------------- */
  /**
   * Only a still-pending order can be rejected — so an order that was already approved
   * (and credited) can never be flipped to rejected by a stale screen.
   * `freeReference` lets the buyer re-submit a corrected transaction ID.
   */
  async function rejectOrder(orderId, { reason, freeReference = true } = {}) {
    const email = adminEmail();
    await runTransaction(db, async (tx) => {
      const orderRef = doc(db, 'orders', orderId);
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists()) throw salesError('sales/not-found', 'This order no longer exists.');
      const order = orderSnap.data();
      if (order.status !== 'pending') {
        throw salesError('sales/not-pending', `This payment was already ${order.status}.`);
      }
      tx.update(orderRef, {
        status: 'rejected', rejectionReason: reason || 'Rejected', verifiedAt: serverTimestamp(), verifiedBy: email,
      });
      if (freeReference && order.refKey) tx.delete(doc(db, 'usedReferences', order.refKey));
      tx.set(doc(collection(db, 'auditLog')), {
        orderId, action: 'rejected', by: email, at: serverTimestamp(), reason: reason || 'Rejected',
        productName: order.title || null,
      });
    });
  }

  /* ------------------------- SYNC / RECALCULATE ------------------------- */
  /**
   * 1. Any order that is already "approved" but has no ledger entry (e.g. approved before this
   *    feature existed) gets one, dated with its ORIGINAL approval time.
   * 2. The balance is then rebuilt from the whole ledger — so it always equals the sum of sales.
   */
  async function syncFromOrders() {
    const email = adminEmail();
    const [approvedSnap, salesSnap] = await Promise.all([
      getDocs(query(collection(db, 'orders'), where('status', '==', 'approved'))),
      getDocs(collection(db, 'sales')),
    ]);

    const have = new Set();
    const ledger = [];
    salesSnap.forEach((d) => { have.add(d.id); ledger.push({ ...d.data(), orderId: d.id }); });

    const toCreate = [];
    const skipped = [];
    approvedSnap.forEach((d) => {
      if (have.has(d.id)) return;
      const order = { ...d.data(), id: d.id };
      try {
        const sale = buildSale(order, order.verifiedBy || email, { source: 'backfill' });
        toCreate.push({ id: d.id, data: { ...sale, approvedAt: order.verifiedAt || serverTimestamp() } });
      } catch (e) {
        skipped.push({ id: d.id, reason: e.message });
      }
    });

    for (let i = 0; i < toCreate.length; i += SYNC_BATCH_SIZE) {
      const batch = writeBatch(db);
      toCreate.slice(i, i + SYNC_BATCH_SIZE).forEach((c) => batch.set(doc(db, 'sales', c.id), c.data));
      await batch.commit();
    }

    const stats = aggregateSales([...ledger, ...toCreate.map((c) => c.data)]);
    await setDoc(statsRef(), { ...stats, updatedAt: serverTimestamp(), rebuiltAt: serverTimestamp() });
    return { created: toCreate.length, skipped, totalUsd: stats.totalUsd, salesCount: stats.salesCount };
  }

  /** Cheap server-side count (no document reads) used to detect un-synced approvals. */
  async function countApprovedOrders() {
    const snap = await getCountFromServer(query(collection(db, 'orders'), where('status', '==', 'approved')));
    return snap.data().count;
  }

  return { approveOrder, rejectOrder, syncFromOrders, countApprovedOrders };
}
