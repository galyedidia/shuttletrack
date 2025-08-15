// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
