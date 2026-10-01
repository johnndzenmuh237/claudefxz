# Manual Payment System + Dashboard Media Library — What Was Built

This replaces the earlier NOWPayments-based automatic crypto checkout
entirely, per your instructions: **no automatic payment gateway of any
kind.** Every payment — MTN, Orange, or crypto — now follows the same
manual verification flow: customer pays you directly → submits a
reference → sits as pending → you check it yourself → you approve or
reject. Nothing unlocks without you clicking Approve.

Everything also now lives **inside the existing student dashboard**, not
on standalone public pages.

## The full flow

**Customer:**
1. `pricing.html` → **Get Lifetime Access** → `/student-portal/checkout.html`
2. Picks MTN Mobile Money, Orange Money, or Crypto
3. **MTN/Orange:** sees your real name + number + the exact CFA amount to
   send (auto-converted from the USD price using today's live rate)
4. **Crypto:** sees your real wallet address + network + QR code for
   whichever coin they pick — only coins you've actually added a wallet
   for are shown
5. Pays you directly, comes back, types in their transaction ID (or tx
   hash for crypto)
6. Sees "pending verification" — nothing unlocks yet
7. Once approved: `/student-portal/library.html` shows the ebook/videos,
   ready to read/watch in-browser or save to their device

**You (admin):**
1. `/student-portal/admin-payments.html` — see every pending payment:
   who, what product, which method, the reference, the amount
2. Go check your actual MTN messages / Orange messages / wallet
   transaction history yourself
3. **Approve** (confirmation prompt first) → instantly unlocks their
   library — or **Reject** with a reason (dropdown of common reasons +
   free text) → they see exactly why and can resubmit

## Security details that matter

- **A transaction reference can never be used twice.** The backend
  checks this before creating any order — not just a frontend check.
- **The amount is never trusted from the browser.** It's always computed
  server-side from the product's real price (+ live FX rate for
  MTN/Orange).
- **A random/fake reference does nothing.** Submitting a reference only
  ever creates a `pending` order — it can never unlock anything by
  itself. Only an authenticated admin action changes that.
- **Two independent admin checks**, not one: your Firestore user profile
  needs `role: "admin"` (gates the admin *page*) AND your email needs to
  be in the Worker's `ADMIN_EMAILS` list (gates the admin *API calls*).
  A bug in either check alone doesn't expose approve/reject to anyone
  else.
- **Every approval/rejection is logged** — admin, order, previous/new
  status, reason, timestamp — visible in the Audit Log tab of the admin
  page.
- **Ebook PDFs and course videos are never publicly reachable.** They're
  only served through a short-lived (1 hour) token, minted only after
  the Worker confirms an *approved* order for that exact user and
  product.

## Files added

- `cloudflare/src/index.js` — completely rewritten: MTN/Orange/crypto
  config, product catalog (ebooks + courses with video files), live
  FX-rate lookup, payment submission + duplicate protection, admin
  approve/reject/audit-log endpoints, gated media delivery with proper
  HTTP Range support (so videos can be seeked/scrubbed, not just played
  start-to-finish)
- `student-portal/checkout.html` + `assets/js/checkout.js` — the payment
  method picker and submission form, inside the dashboard
- `student-portal/library.html` + `assets/js/library.js` — "My Library":
  every ebook/video the signed-in user has an approved order for, with
  in-page reading/watching (PDF and video, via a modal) and a genuine
  save-to-device download button for each
- `student-portal/admin-payments.html` — the verification dashboard:
  pending queue, approve/reject with reasons, audit log
- `student-portal/crypto-guide.html` — the crypto tutorial, now inside
  the dashboard as asked (what crypto is, why it's useful, step-by-step
  buying guide, video slot, buy-now button)
- Redirect stubs at the old public URLs (`payment.html`,
  `ebook-reader.html`, `crypto-guide.html`) so nothing 404s if bookmarked
  — they forward into the dashboard

## Files removed (superseded, not just abandoned)

- `functions/`, `storage.rules`, `seed-products.js` — the earlier
  Firebase-Functions-based build (required the paid Blaze plan)
- `NOWPAYMENTS_SETUP.md` — no longer relevant; there's no NOWPayments
  integration anymore
- The old standalone `payment.html`/`ebook-reader.html`/`crypto-guide.html`
  content — replaced by the dashboard versions (old URLs now redirect)

## What you need to do

Everything is in **`CLOUDFLARE_SETUP.md`** — the short version:
1. Open `cloudflare/src/index.js`, paste your real MTN/Orange
   name+numbers and crypto wallet addresses into the clearly marked
   config block at the top
2. Add your admin email to the same file
3. Deploy the Worker (`npx wrangler deploy`) — free, no card
4. Paste the deployed Worker URL into 4 files (listed in the guide)
5. Upload your ebook PDFs and course videos to Backblaze B2 (not
   Cloudflare R2 — R2 requires a card to activate, Backblaze doesn't)
   with the exact filenames the guide lists
6. Make yourself an admin in Firestore

## Scope notes — what's a starting template, not a finished catalog

- **One example course** (`forex-full-course`) is wired up with 3 sample
  video slots + a workbook PDF, as a template. Copy that block in
  `PRODUCTS` for each of your real courses — the guide shows exactly how.
- I did not touch the `courses.html` "Enroll Now" buttons — those aren't
  wired to checkout yet. If you want specific courses purchasable the
  same way the ebooks are, tell me which ones and I'll wire them using
  the same `forex-full-course` pattern.
- Video playback uses your browser's native `<video>` player pointed at
  a gated, tokenized URL with Range-request support (so scrubbing/seeking
  works properly) — not a fancy custom player, but a real, working one.
