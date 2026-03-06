import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-functions.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyCmn2ZmvawQZKMc0mfMVV--K3ffZ7IyThg",
    authDomain: "soul-of-medico-f61bd.firebaseapp.com",
    projectId: "soul-of-medico-f61bd",
    storageBucket: "soul-of-medico-f61bd.firebasestorage.app",
    messagingSenderId: "1046648330898",
    appId: "1:1046648330898:web:e1f97900cbcb3c8731644b",
    measurementId: "G-2DGGTZ25LK"
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
