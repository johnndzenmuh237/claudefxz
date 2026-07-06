/* ============================================================
   FOREX ACADEMY PRO — auth-helpers.js
   Shared authentication guard used by every protected page
   ============================================================ */

import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ────────────────────────────────────────────────────────────
   requireUser()
   Call at the top of every student portal page.
   Redirects to login if not authenticated.
   Resolves with { user, profile } if authenticated.
──────────────────────────────────────────────────────────── */
export function requireUser() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        window.location.href = '../auth/login.html';
        return reject('not-authenticated');
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      const profile = snap.exists() ? snap.data() : {};
      resolve({ user, profile });
    });
  });
}

/* ────────────────────────────────────────────────────────────
   requireAdmin()
   Call at the top of every admin page.
   Redirects to admin login if not an admin.
──────────────────────────────────────────────────────────── */
export function requireAdmin() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) {
        window.location.href = '../auth/admin-login.html';
        return reject('not-authenticated');
      }
      const snap = await getDoc(doc(db, 'users', user.uid));
      const profile = snap.exists() ? snap.data() : {};
      if (profile.role !== 'admin') {
        await signOut(auth);
        window.location.href = '../auth/admin-login.html';
        return reject('not-admin');
      }
      resolve({ user, profile });
    });
  });
}

/* ────────────────────────────────────────────────────────────
   signOutUser()
   Signs out and redirects to login
──────────────────────────────────────────────────────────── */
export async function signOutUser(isAdmin = false) {
  await signOut(auth);
  window.location.href = isAdmin ? '../auth/admin-login.html' : '../auth/login.html';
}

/* ────────────────────────────────────────────────────────────
   createUserProfile()
   Called after signup (or first Google sign-in) to initialise
   the Firestore document. Safe to call more than once — uses
   merge so it never clobbers existing stats/courses/etc.
──────────────────────────────────────────────────────────── */
export async function createUserProfile(uid, data) {
  const defaultProfile = {
    uid,
    role:          'student',
    plan:          'Starter',
    displayName:   data.displayName   || '',
    email:         data.email         || '',
    country:       data.country       || '',
    phone:         data.phone         || '',
    tradingStyle:  data.tradingStyle  || '',
    experience:    data.experience    || 'beginner',
    bio:           '',
    createdAt:     serverTimestamp(),
    lastLogin:     serverTimestamp(),
    stats: {
      coursesEnrolled:    0,
      lessonsCompleted:   0,
      certificatesEarned: 0,
      dayStreak:          0,
    },
    courses: [],
    recentActivity: [],
    upcomingSessions: [],
    notifications: [],
    adminNotes: '',
    isActive: true,
  };

  await setDoc(doc(db, 'users', uid), defaultProfile, { merge: true });
  return defaultProfile;
}

/* ────────────────────────────────────────────────────────────
   populateUserUI()
   Fills in display name, avatar initials, plan badge
   across all portal pages
──────────────────────────────────────────────────────────── */
export function populateUserUI(profile) {
  const name    = profile.displayName || profile.email?.split('@')[0] || 'Trader';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name);
  document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = profile.email || '');
  document.querySelectorAll('[data-user-plan]').forEach(el => el.textContent = profile.plan || 'Starter');
  document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = initials);

  const firstName = name.split(' ')[0];
  document.querySelectorAll('[data-user-greeting]').forEach(el => {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    el.textContent = `${greet}, ${firstName} 👋`;
  });

  if (profile.stats) {
    const s = profile.stats;
    document.querySelectorAll('[data-stat-courses]').forEach(el => el.textContent = s.coursesEnrolled ?? 0);
    document.querySelectorAll('[data-stat-lessons]').forEach(el => el.textContent = s.lessonsCompleted ?? 0);
    document.querySelectorAll('[data-stat-certs]').forEach(el => el.textContent = s.certificatesEarned ?? 0);
    document.querySelectorAll('[data-stat-streak]').forEach(el => el.textContent = s.dayStreak ?? 0);
  }

  document.querySelectorAll('.sidebar-user-avatar, .topbar-user img').forEach(img => {
    img.onerror = () => {
      const span = document.createElement('span');
      span.textContent = initials;
      span.style.cssText = `display:inline-flex;align-items:center;justify-content:center;
        width:${img.style.width||'36px'};height:${img.style.height||'36px'};
        border-radius:50%;background:var(--color-dark-3);color:var(--color-gold);
        font-weight:700;font-size:13px;flex-shrink:0;`;
      img.replaceWith(span);
    };
  });
}
