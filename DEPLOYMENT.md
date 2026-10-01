# Deployment Guide — Claudefx Academy Pro (100% Free Stack)

Everything here runs on free tiers — Firebase Spark plan (not Blaze) +
Cloudflare's free plan. No credit card required anywhere. Run commands in
PowerShell from your project root
(`C:\Users\dell\Desktop\claudefxz`) unless told otherwise.

## 1. Get the code deployed

```powershell
node -v
npm -v
npm install -g firebase-tools
firebase --version
firebase login
firebase use swiftchain-827f2
firebase deploy --only firestore:rules,hosting
```
This publishes your site to `https://swiftchain-827f2.web.app` and
deploys the Firestore rules (reviews + user profiles — free, no billing
needed).

## 2. Set up the payment system

**Go do the entire `CLOUDFLARE_SETUP.md` guide now.** It covers:
- Filling in your real MTN/Orange numbers and crypto wallet addresses
- Deploying the free Cloudflare Worker that runs checkout + the admin
  verification dashboard
- Uploading your ebook PDFs and course videos
- Making yourself an admin so you can approve/reject payments

That guide is the real deployment guide for anything payment- or
media-related — this file only covers the Firebase/website side.

## 3. Test everything end to end

Covered in detail in `CLOUDFLARE_SETUP.md` Part 6 — the short version:
buy something as a test customer → approve it as admin → confirm it
unlocks in `/student-portal/library.html`.

## 4. If you want your own custom domain

1. Firebase Console → Hosting → **Add custom domain** → follow the DNS
   steps (free, no billing account needed)
2. Replace the placeholder domain used throughout the repo:
```powershell
$old = "claudefxacademy.com"
$new = "your-real-domain.com"
Get-ChildItem -Recurse -Include *.html,*.txt,*.xml,*.js | ForEach-Object {
  (Get-Content $_.FullName -Raw) -replace [regex]::Escape($old), $new | Set-Content $_.FullName
}
firebase deploy --only hosting
```

## 5. Ongoing changes

```powershell
git add -A
git commit -m "describe your change"
git push

firebase deploy --only hosting              # site html/css/js/images
firebase deploy --only firestore:rules      # if you changed firestore.rules

cd cloudflare
npx wrangler deploy                         # if you changed cloudflare/src/index.js (new product, wallet, etc.)
```

---

## Troubleshooting

**Checkout page shows the wrong or no CFA amount** — the Worker's FX
cache may be stale or unreachable; check `cloudflare/src/index.js`'s
`getUsdToXafRate` fallback, or just wait — it refreshes every 6 hours
automatically.

**"Admin access required" even though you added your email** — the
Worker needs redeploying after any `cloudflare/src/index.js` edit:
```powershell
cd cloudflare
npx wrangler deploy
```
Also double check you're signed in with the *exact* email listed in
`ADMIN_EMAILS` (case doesn't matter, but typos do).

**Video won't play / stalls** — check the file actually uploaded to
Backblaze B2 under the exact path listed in `PRODUCTS`. Open your B2
bucket in the Backblaze dashboard and confirm the file exists at that
exact path/name (e.g. `courses/forex-full-course/01-introduction.mp4`).
If it's missing or misnamed, that's why it won't load.

**General debugging** — live Worker logs:
```powershell
cd cloudflare
npx wrangler tail
```

---

## If `swiftchain-827f2` isn't actually your Firebase project

```powershell
firebase projects:create your-project-id
```
Update `firebaseConfig` in `assets/js/firebase-config.js` (values from
Firebase Console → Project Settings → General → Your apps), update
`FIREBASE_PROJECT_ID` in `cloudflare/src/index.js`, update `.firebaserc`'s
`"default"` value, then repeat step 1 onward above.
