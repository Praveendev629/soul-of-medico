const firebaseConfig = {
    apiKey: "AIzaSyAzIPV5K7CD0rLAVMugcck2fIAhD-t7RFQ",
    authDomain: "soul-of-medico-2-0.firebaseapp.com",
    projectId: "soul-of-medico-2-0",
    storageBucket: "soul-of-medico-2-0.firebasestorage.app",
    messagingSenderId: "536812727833",
    appId: "1:536812727833:web:cfe2362fabfbec388e8488"
};

const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();
