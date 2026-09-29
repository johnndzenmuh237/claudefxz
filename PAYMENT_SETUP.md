# Payment system (manual MTN / Orange / Crypto) — setup

No Cloudflare Worker needed any more. Everything runs on Firebase (Firestore).

## 1. Publish the Firestore rules  (required or checkout will fail)
Firebase Console -> Firestore Database -> Rules -> paste the contents of `firestore.rules` -> Publish.

## 2. Your details (only file: `assets/js/payment-config.js`)
- MTN / Orange name + number, crypto wallets  (already filled in)
- `checkoutVideoUrl` -> paste your YouTube link (or `productVideos` for one product)

## 3. Your products (`assets/js/catalog.js`)
Paste your PDF link (`kind:"pdf"`) or YouTube lesson links (`kind:"youtube"`) into the empty `url:""` fields.
These show in **My Library** only after you approve a payment.
Note: links are only shown to approved buyers, but a link itself can be shared — use *unlisted* YouTube videos.

## 4. Approving payments
Log in as admin -> `student-portal/admin-payments.html` -> check your real MTN/Orange/wallet records -> Approve / Reject.
Your Firestore user document (`users/<your uid>`) needs the field `role: "admin"`.

## Buy links
`student-portal/checkout.html?product=<id>` — ids are in catalog.js
(ebooks on pricing.html; courses: course-1 … course-9 and full-course).
