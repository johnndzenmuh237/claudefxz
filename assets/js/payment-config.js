/* ============================================================
   CLAUDEFX ACADEMY — assets/js/payment-config.js
   THE ONLY FILE YOU EDIT FOR PAYMENT DETAILS + THE CHECKOUT VIDEO.

   VIDEO: paste any YouTube link between the quotes on the
   `checkoutVideoUrl` line (watch?v=, youtu.be, shorts all work).
   - A coin with an empty address ("") or enabled:false is hidden.
   - Mobile Money with an empty number ("") is hidden too.
   ============================================================ */
window.PAYMENT_CONFIG = {

  /* ---------- CHECKOUT VIDEO ---------- */
  checkoutVideoUrl: "",            // <<< PASTE HERE your default YouTube link ("" = hide the video)
  checkoutVideoTitle: "Watch before you pay",
  // Optional per-product video (product id from catalog.js as the key), e.g.
  //   "risk-management-guide": "https://youtu.be/XXXXXXXXXXX",
  productVideos: {
  },

  /* ---------- CRYPTO WALLETS ---------- */
  cryptoWallets: {
    btc:        { enabled: true, label: "Bitcoin",  network: "Bitcoin (BTC)", address: "bc1qmrx53ld85qftp4ng4gp4vcg3d38el34s00tq0l", confirmationsNote: "Wait for at least 2 confirmations on a Bitcoin block explorer." },
    eth:        { enabled: true, label: "Ethereum", network: "Ethereum (ERC-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F", confirmationsNote: "Wait for at least 12 confirmations on Etherscan." },
    usdt_trc20: { enabled: true, label: "USDT (Tron)", network: "TRON (TRC-20)", address: "TX7CpBYg8Gph7A4T2EqyS586qaMYENDteL", confirmationsNote: "1 confirmation is usually enough — check on Tronscan." },
    usdt_erc20: { enabled: true, label: "USDT (Ethereum)", network: "Ethereum (ERC-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F", confirmationsNote: "Wait for at least 12 confirmations on Etherscan." },
    usdt_bep20: { enabled: true, label: "USDT (BNB Smart Chain)", network: "BNB Smart Chain (BEP-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F", confirmationsNote: "Wait for at least 3 confirmations on BscScan." },
    bnb:        { enabled: true, label: "BNB", network: "BNB Smart Chain (BEP-20)", address: "0x0971f00CD9Fd439F0735a4D1Eafa18400B72862F", confirmationsNote: "Wait for at least 3 confirmations on BscScan." },
    ltc:        { enabled: true, label: "Litecoin", network: "Litecoin (LTC)", address: "ltc1q24x8pkfndpk8nrvkrufye0f8j449jkqust9knk", confirmationsNote: "Wait for at least 3 confirmations on a Litecoin explorer." },
    trx:        { enabled: true, label: "TRON", network: "TRON (TRC-20)", address: "TX7CpBYg8Gph7A4T2EqyS586qaMYENDteL", confirmationsNote: "1 confirmation is usually enough — check on Tronscan." },
    doge:       { enabled: true, label: "Dogecoin", network: "Dogecoin (DOGE)", address: "D668QwSx5oaMN1P3eeted6hHeX5Mw1kDbc", confirmationsNote: "Wait for at least 6 confirmations on a Dogecoin explorer." },
    sol:        { enabled: true, label: "Solana", network: "Solana (SOL)", address: "4LG1DZX1TsahLXd9EfzNrpscvvQH33jeX1nXiWHhaQWD", confirmationsNote: "Wait for the transaction to show \"finalized\" on Solscan." },
  },

  /* ---------- MOBILE MONEY (paid in CFA / XAF) ----------
     logo: optional official logo file, e.g. "../assets/images/logo/mtn.png".
     Empty = built-in logo is shown. */
  mobileMoney: {
    mtn:    { enabled: true, providerName: "MTN Mobile Money", accountName: "JOHN NDZENMUH", accountNumber: "+237679806062", logo: "", ussd: "*126#" },
    orange: { enabled: true, providerName: "Orange Money",     accountName: "JOHN NDZENMUH", accountNumber: "+237679806062", logo: "", ussd: "#150#" },
  },

  pendingReviewWindowHours: 24,
  supportWhatsApp: "https://wa.me/237675175534",
  supportPhone: "+237679806062",
  supportEmail: "skillhub372@gmail.com",
};
