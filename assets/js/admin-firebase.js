/* ============================================================
   CLAUDEFX ACADEMY PRO — assets/js/admin-firebase.js
   A SECOND, separately-named Firebase app used only by the admin
   panel (admin/*.html). Firebase keeps each named app's login in its
   own storage slot, so:
     • signing in to the admin panel does NOT sign you in/out of the
       student site, and vice-versa;
     • you can be the admin in one tab and a test student in another
       (needed to test "student pays -> admin approves").
   The project config is reused from firebase-config.js (single source).
   ============================================================ */
import { app as studentApp } from './firebase-config.js';
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const NAME = 'admin';
export const adminApp = getApps().some((a) => a.name === NAME) ? getApp(NAME) : initializeApp(studentApp.options, NAME);
export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
