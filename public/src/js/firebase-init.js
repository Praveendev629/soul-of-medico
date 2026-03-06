import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCU-iriPdLHhm8VhDkSOvRfwJmWRm3riN0",
    authDomain: "soul-of-medico-001.firebaseapp.com",
    projectId: "soul-of-medico-001",
    storageBucket: "soul-of-medico-001.appspot.com",
    messagingSenderId: "233619301443",
    appId: "1:233619301443:web:1dae184db8473dfcd960f6",
    measurementId: "G-RVXL86WYY5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if running in browser (not in service worker)
let analytics;
if (typeof window !== 'undefined') {
    try {
        analytics = getAnalytics(app);
    } catch (e) {
        console.log('Analytics not available:', e);
    }
}

// Make available globally for auth.js and other modules
window.auth = getAuth(app);
window.db = getFirestore(app);
window.functions = getFunctions(app);
window.storage = getStorage(app);

console.log('Firebase initialized successfully');
