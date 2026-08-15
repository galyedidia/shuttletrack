// src/lib/firebase.ts

// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  RecaptchaVerifier,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "shuttletrack-rgjhw",
  appId: "1:179200842382:web:5f46033fbeb7af37b607df",
  storageBucket: "shuttletrack-rgjhw.firebasestorage.app",
  apiKey: "AIzaSyC3JNaoeb_RP2iYdiu0DmNRZC950EQLoT0",
  authDomain: "shuttletrack-rgjhw.firebaseapp.com",
  messagingSenderId: "179200842382",
};

// Initialize Firebase
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// ---- Auth with robust, persistent storage (client-only) ----
let _auth: Auth | null = null;

export function ensureAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (_auth) return _auth;
  try {
    _auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
  } catch {
    _auth = getAuth(app);
  }
  return _auth;
}

// Export ready-to-use Auth for client components
export const auth = ensureAuth();

// Helper function for Recaptcha
export const getRecaptchaVerifier = (containerId: string) => {
  if (typeof window === "undefined") return null;
  const a = ensureAuth() || auth;
  if (!a) return null;

  const w = window as any;
  if (w.recaptchaVerifier) {
    try {
      w.recaptchaVerifier.clear();
    } catch {
      // ignore
    }
    w.recaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  w.recaptchaVerifier = new RecaptchaVerifier(a, containerId, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
  });

  return w.recaptchaVerifier as RecaptchaVerifier;
};

