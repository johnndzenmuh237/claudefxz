# Payment System Setup — MTN, Orange & Manual Crypto (100% Free)

No NOWPayments, no payment gateway, no API keys, no billing account
anywhere. You get paid directly to your own MTN/Orange numbers and your
own crypto wallets — you just tell the system what those are, once, by
editing one file.

## How it works (the short version)

1. Customer picks a product → picks MTN, Orange, or Crypto → sees exactly
   where to send money (your number/wallet) and exactly how much
2. They pay you directly (outside this system entirely — it never touches
   the money)
3. They come back and type in their transaction ID / hash
4. That sits as **pending** — nothing unlocks yet
5. You open `/student-portal/admin-payments.html`, check your own MTN
   text / Orange text / wallet history to confirm the payment really
   happened, then click **Approve** (or **Reject** with a reason)
6. Only after you approve does the ebook/course unlock in their dashboard

Nothing is ever unlocked automatically just because someone typed
something into a box.

---

## Part 1 — Fill in your payment details

Open **`cloudflare/src/index.js`** in a text editor. Right at the top
there's a clearly marked section:

```js
const MOBILE_MONEY = {
  mtn: {
    recipientName: "PASTE_MTN_RECIPIENT_NAME_HERE",
    number: "PASTE_MTN_NUMBER_HERE",
  },
  orange: {
    recipientName: "PASTE_ORANGE_RECIPIENT_NAME_HERE",
    number: "PASTE_ORANGE_NUMBER_HERE",
  },
};

const CRYPTO_WALLETS = {
  btc: { coin: "BTC", network: "Bitcoin", address: "PASTE_BTC_ADDRESS_HERE" },
  eth: { coin: "ETH", network: "Ethereum (ERC-20)", address: "PASTE_ETH_ADDRESS_HERE" },
  usdt_trc20: { coin: "USDT", network: "Tron (TRC-20)", address: "PASTE_USDT_TRC20_ADDRESS_HERE" },
  usdt_erc20: { coin: "USDT", network: "Ethereum (ERC-20)", address: "PASTE_USDT_ERC20_ADDRESS_HERE" },
  usdt_bep20: { coin: "USDT", network: "BNB Smart Chain (BEP-20)", address: "PASTE_USDT_BEP20_ADDRESS_HERE" },
  bnb_bep20: { coin: "BNB", network: "BNB Smart Chain (BEP-20)", address: "PASTE_BNB_ADDRESS_HERE" },
};

const ADMIN_EMAILS = ["PASTE_YOUR_ADMIN_EMAIL_HERE@example.com"];
```

Replace every `PASTE_...` placeholder:
- Your real MTN name + number, Orange name + number
- Your real wallet address for each crypto/network you want to accept.
  **Delete any line you don't want to offer** (e.g. if you don't have a
  BNB wallet, delete the `bnb_bep20` line entirely — the checkout page
  automatically only shows what's listed here)
- Your own login email in `ADMIN_EMAILS` (the email you'll use to sign
  into `/student-portal/admin-payments.html`) — you can list more than
  one email if more than one person will verify payments

Save the file. That's the only file you need to edit for payment
methods.

---

## Part 2 — Deploy the Worker (free, no card)

```powershell
cd C:\Users\dell\Desktop\claudefxz\cloudflare
npm install
npx wrangler login
```

Create your KV namespace (stores orders, download tokens, audit log):
```powershell
npx wrangler kv namespace create ORDERS_KV
```
Copy the printed `id` into `wrangler.toml`, replacing
`PASTE_YOUR_KV_NAMESPACE_ID_HERE`.

Create your R2 bucket (stores ebooks AND course videos):
```powershell
npx wrangler r2 bucket create claudefx-media
```

Deploy:
```powershell
npx wrangler deploy
```
Copy the printed URL (looks like
`https://claudefx-crypto-checkout.your-subdomain.workers.dev`).

---

## Part 3 — Point the site at your deployed Worker

Open these **4 files** and replace the placeholder URL with your real one
from Part 2 in each:

- `assets/js/checkout.js`
- `assets/js/library.js`
- `student-portal/checkout.html` *(only if you edited it directly — normally not needed, it just loads checkout.js)*
- `student-portal/admin-payments.html`

Each has this exact line near the top:
```js
const WORKER_BASE_URL = "https://claudefx-crypto-checkout.YOUR-SUBDOMAIN.workers.dev";
```

Then:
```powershell
cd C:\Users\dell\Desktop\claudefxz
firebase deploy --only hosting,firestore:rules
```

---

## Part 4 — Upload your ebooks and course videos

R2 doesn't have real folders, but you can use `/` in filenames to
organize things the same way. Match these exactly (they must match
`PRODUCTS` in `cloudflare/src/index.js`):

**Ebooks** (already configured, just upload the files):
```
ebooks/risk-management-guide.pdf
ebooks/technical-analysis-guide.pdf
ebooks/fundamental-analysis-guide.pdf
ebooks/psychology-guide.pdf
ebooks/strategy-playbook.pdf
```

**Course videos** — one example course is already configured
(`forex-full-course`) with 3 sample video slots + 1 workbook PDF:
```
courses/forex-full-course/01-introduction.mp4
courses/forex-full-course/02-market-structure.mp4
courses/forex-full-course/03-risk-management.mp4
courses/forex-full-course/course-workbook.pdf
```

Upload via the dashboard (Cloudflare → R2 → `claudefx-media` → Upload),
or from the command line:
```powershell
npx wrangler r2 object put claudefx-media/ebooks/risk-management-guide.pdf --file="C:\path\to\your\file.pdf"
npx wrangler r2 object put claudefx-media/courses/forex-full-course/01-introduction.mp4 --file="C:\path\to\your\video.mp4"
```

### Adding a new course or ebook later
Open `cloudflare/src/index.js`, find the `PRODUCTS` object, and copy an
existing block (ebook or course) as a template — change the id, title,
price, and file list to match. Upload the matching files to R2 using the
same key you wrote in the `key` field. Redeploy:
```powershell
cd cloudflare
npx wrangler deploy
```

---

## Part 5 — Make yourself an admin

Two separate things both need to be true for you to access payment
verification — this is intentional (two independent checks, so a bug in
either one alone can't expose it):

1. **In Firestore** (gates the admin page itself): Console → Firestore →
   `users` collection → your document → add field `role` (string) =
   `admin`
2. **In the Worker config** (gates the actual approve/reject API calls):
   your email must be in the `ADMIN_EMAILS` array in
   `cloudflare/src/index.js` (Part 1 above)

---

## Part 6 — Test the full flow

1. Visit your site → `pricing.html` → **Get Lifetime Access** on any
   ebook → you land on `/student-portal/checkout.html`
2. Try **MTN** or **Orange**: confirm the CFA amount shown looks right
   (it's your USD price × today's live rate)
3. Try **Crypto**: confirm your real wallet address and QR code show up
4. Submit a test reference (anything, for testing) → confirm it shows
   "pending"
5. Sign in as your admin account → `/student-portal/admin-payments.html`
   → find your test order → **Approve**
6. Back on the customer account → `/student-portal/library.html` → the
   ebook/video should now be there, playable/readable and downloadable

---

## Everyday commands

```powershell
# After editing cloudflare/src/index.js (new product, changed wallet, etc.):
cd cloudflare
npx wrangler deploy

# After editing any .html/.css/.js on the main site:
cd ..
firebase deploy --only hosting

# See live Worker logs/errors:
cd cloudflare
npx wrangler tail
```

---

## Honesty about limits of this approach

- **The exchange rate for MTN/Orange is a live rate, refreshed every 6
  hours** — it comes from a free ECB-sourced rate (USD→EUR) combined with
  the CFA franc's fixed peg to the Euro (655.957, unchanged since 1999 —
  this part is a treaty peg, not a floating estimate). If Cloudflare
  can't reach the rate source for some reason, it falls back to an
  approximate rate rather than breaking checkout — check
  `cloudflare/src/index.js`'s `getUsdToXafRate` if you ever want to
  update that fallback number.
- **Duplicate-reference protection isn't perfectly atomic.** Workers KV
  doesn't support database-style locking, so in the extremely unlikely
  case of two people submitting the exact same reference in the same
  split second, both could theoretically get through. For a
  manually-reviewed, low-volume payment flow like this, that's a
  reasonable tradeoff — and you're checking every payment by hand anyway,
  so you'd catch it. If this ever needs to scale to high transaction
  volume, that's the point to move orders into a real database.
- **Nothing here verifies a crypto transaction hash against the actual
  blockchain automatically** — by design, per what you asked for. You're
  expected to paste the hash into Tronscan/Etherscan/BscScan/a Bitcoin
  explorer yourself before approving. The system is architected so
  automatic verification could be added later (see the note at the
  bottom of `cloudflare/src/index.js`'s `handleAdminApprove` area) without
  rebuilding anything — but that's not built now, and nothing pretends
  it's built now.
