// ========================================
// FIREBASE CONFIGURATION
// ========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


// ========================================
// FIREBASE CONFIG
// ========================================

const firebaseConfig = {
  apiKey: "AIzaSyDO3bftDtmS5KEzYI-TwL26ApJC6N3f51o",
  authDomain: "chating-78345.firebaseapp.com",
  projectId: "chating-78345",
  storageBucket: "chating-78345.firebasestorage.app",
  messagingSenderId: "123012306699",
  appId: "1:123012306699:web:1661236f2a8f3da0b4340e"
};


// ========================================
// INITIALIZE FIREBASE
// ========================================

const app = initializeApp(firebaseConfig);


// ========================================
// FIRESTORE
// ========================================

const db = getFirestore(app);


// ========================================
// AUTHENTICATION
// ========================================

const auth = getAuth(app);


// ========================================
// EXPORT
// ========================================

export {
  app,
  db,
  auth
};

console.log("🔥 Firebase berhasil diinisialisasi");
