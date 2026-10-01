# Payment System Setup — MTN, Orange & Manual Crypto (100% Free, No Card)

No NOWPayments, no payment gateway, no API keys for a payment processor,
no billing account anywhere — including for file storage. You get paid
directly to your own MTN/Orange numbers and your own crypto wallets — you
just tell the system what those are, once, by editing one file.

**A note on the storage choice:** this uses **Backblaze B2** for ebook/video
files, not Cloudflare R2. R2 requires a payment method on file to activate
(confirmed directly — Cloudflare's own signup flow asks for a card before
you can even use the free tier). Backblaze B2 does not — its 10GB free
tier needs no card at signup, confirmed on Backblaze's own site. Workers
and KV (the two Cloudflare pieces still used here) remain genuinely free
with no card required.

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

---

## Part 1 — Fill in your payment details

Open **`cloudflare/src/index.js`**. Near the top:

```js
const MOBILE_MONEY = {
  mtn: { recipientName: "PASTE_MTN_RECIPIENT_NAME_HERE", number: "PASTE_MTN_NUMBER_HERE" },
  orange: { recipientName: "PASTE_ORANGE_RECIPIENT_NAME_HERE", number: "PASTE_ORANGE_NUMBER_HERE" },
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

Replace every `PASTE_...` placeholder with your real details. **Delete
any crypto line you don't want to offer.** Save.

---

## Part 2 — Sign up for Backblaze B2 (free, no card)

1. Go to https://www.backblaze.com/sign-up/cloud-storage
2. Create an account with just your email — no card requested
3. Once logged in, go to **B2 Cloud Storage** in the left menu
4. Click **Create a Bucket**
   - Name it something like `claudefx-media`
   - Set it to **Private** (not public — the Worker gates access, files should never be directly public)
   - Leave other settings as default → **Create Bucket**
5. Go to **App Keys** (left menu) → **Add a New Application Key**
   - Name it `claudefx-worker`
   - Allow access to: your new bucket only (not "All buckets")
   - Type of access: **Read Only** is enough (the Worker only downloads, never uploads)
   - Click **Create New Key**
   - **Copy both the `keyID` and `applicationKey` shown — the applicationKey is only shown once**

You now have 3 values: your **bucket name**, your **keyID**, and your
**applicationKey**. Keep them somewhere safe for Part 4.

---

## Part 3 — Deploy the Worker (Cloudflare, free, no card)

```powershell
cd C:\Users\dell\Desktop\claudefxz\cloudflare
npm install
npx wrangler login
```
(If OAuth login times out, use an API token instead — see the
troubleshooting note at the bottom of `DEPLOYMENT.md`.)

Create your KV namespace:
```powershell
npx wrangler kv namespace create ORDERS_KV
```
Copy the printed `id` into `wrangler.toml`, replacing
`PASTE_YOUR_KV_NAMESPACE_ID_HERE`.

---

## Part 4 — Give the Worker your Backblaze credentials

These are set as secrets (encrypted by Cloudflare, never written into any
file), not pasted into code:

```powershell
npx wrangler secret put B2_KEY_ID
```
Paste your Backblaze **keyID** when prompted, Enter.

```powershell
npx wrangler secret put B2_APPLICATION_KEY
```
Paste your Backblaze **applicationKey** when prompted, Enter.

```powershell
npx wrangler secret put B2_BUCKET_NAME
```
Type your bucket name (e.g. `claudefx-media`) when prompted, Enter.

---

## Part 5 — Deploy

```powershell
npx wrangler deploy
```
Copy the printed URL (looks like
`https://claudefx-crypto-checkout.your-subdomain.workers.dev`).

---

## Part 6 — Point the site at your deployed Worker

Open these files and replace the placeholder URL with your real one from
Part 5 in each:
- `assets/js/checkout.js`
- `assets/js/library.js`
- `student-portal/admin-payments.html`

Each has this line near the top:
```js
const WORKER_BASE_URL = "https://claudefx-crypto-checkout.YOUR-SUBDOMAIN.workers.dev";
```

Then:
```powershell
cd C:\Users\dell\Desktop\claudefxz
firebase deploy --only hosting,firestore:rules
```

---

## Part 7 — Upload your ebooks and course videos

In the Backblaze B2 dashboard, open your bucket → **Upload** (or drag
files in). File names must match **exactly** what's in `PRODUCTS` inside
`cloudflare/src/index.js`:

**Ebooks:**
```
ebooks/risk-management-guide.pdf
ebooks/technical-analysis-guide.pdf
ebooks/fundamental-analysis-guide.pdf
ebooks/psychology-guide.pdf
ebooks/strategy-playbook.pdf
```

**Course videos** (one example course already configured):
```
courses/forex-full-course/01-introduction.mp4
courses/forex-full-course/02-market-structure.mp4
courses/forex-full-course/03-risk-management.mp4
courses/forex-full-course/course-workbook.pdf
```

Backblaze doesn't have real folders either, but typing the full path with
`/` in the filename when you upload creates the same effect — when you
upload, there should be a field for the object/file name; type the full
path shown above (e.g. `ebooks/risk-management-guide.pdf`), not just the
plain filename.

### Adding a new course or ebook later
Open `cloudflare/src/index.js`, find `PRODUCTS`, copy an existing block,
change the id/title/price/file list. Upload matching files to B2 using
the same path. Redeploy:
```powershell
cd cloudflare
npx wrangler deploy
```

---

## Part 8 — Make yourself an admin

Two independent checks, both need to be true:
1. **Firestore** (gates the admin page): Console → Firestore → `users`
   collection → your document → add field `role` (string) = `admin`
2. **Worker config** (gates the actual approve/reject API calls): your
   email must be in `ADMIN_EMAILS` in `cloudflare/src/index.js` (Part 1)

---

## Part 9 — Test the full flow

1. `pricing.html` → **Get Lifetime Access** on any ebook →
   `/student-portal/checkout.html`
2. Try MTN/Orange — confirm the CFA amount looks right
3. Try Crypto — confirm your real wallet address and QR code show up
4. Submit a test reference → confirm "pending"
5. Sign in as admin → `/student-portal/admin-payments.html` → find it →
   **Approve**
6. Back on the customer account → `/student-portal/library.html` → the
   file should be there, playable/readable and downloadable

---

## Everyday commands

```powershell
cd cloudflare
npx wrangler deploy          # after editing cloudflare/src/index.js

cd ..
firebase deploy --only hosting   # after editing site html/css/js

npx wrangler tail            # live Worker logs/errors, run from cloudflare/
```

---

## Cost reality check — every service used, and what it actually needs

| Service | What it's used for | Free tier | Card at signup? |
|---|---|---|---|
| Cloudflare Workers | Payment API, checkout logic | 100,000 requests/day | No |
| Cloudflare Workers KV | Order status, tokens, audit log | 100k reads / 1k writes per day | No |
| Backblaze B2 | Ebook PDFs, course videos | 10 GB storage | **No** (confirmed) |
| Firebase Auth | Sign in / sign up | Unlimited on Spark | No |
| Firebase Firestore | Reviews, user profiles | 50k reads / 20k writes per day | No |
| Firebase Hosting | The website itself | 10 GB storage, 360 MB/day | No |

Cloudflare **R2** is deliberately not in this list — it's the one service
in this whole stack that does ask for a payment method before you can use
even its free tier, which is why it was swapped out for Backblaze B2.

---

## Honesty about limits of this approach

- **Duplicate-reference protection isn't perfectly atomic** (Workers KV
  doesn't support database-style locking) — for a manually-reviewed,
  low-volume flow like this, that's a reasonable tradeoff, and you're
  checking every payment by hand anyway.
- **Nothing verifies a crypto transaction hash against the blockchain
  automatically** — by design. You check it yourself (Tronscan,
  Etherscan, BscScan, a Bitcoin explorer) before approving.
- **B2's free egress is 3x your average monthly storage** — e.g. if you
  store 2GB of ebooks, you get roughly 6GB of free downloads per month.
  For a handful of ebook/course sales, this is not a realistic limit to
  worry about; if you ever have very high download volume, Backblaze
  bills modest overage rather than blocking anything.
