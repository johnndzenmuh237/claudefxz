/* ============================================================
   FOREX ACADEMY PRO — firebase-config.js
   ============================================================ */
const firebaseConfig = {
  apiKey:            "AIzaSyDn2t_SrCp3ekILRWv9uZj_59y82_bn7Og",
  authDomain:        "dashboared-f3415.firebaseapp.com",
  projectId:         "dashboared-f3415",
  storageBucket:     "dashboared-f3415.firebasestorage.app",
  messagingSenderId: "895902567656",
  appId:             "1:895902567656:web:b4fb684e6d53280572cd5d",
  measurementId:     "G-1P4MEV11LT"
};

/* ── Initialise Firebase ── */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };