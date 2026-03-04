import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const provider = new GoogleAuthProvider();

export async function login() {
    try {
        const result = await signInWithPopup(window.auth, provider);
        const user = result.user;

        // Ensure user document exists in Firestore
        const userRef = doc(window.db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // New user, default role is 'USER'
            await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName,
                role: 'USER',
                createdAt: new Date().toISOString()
            });
        }

        return user;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

export async function logout() {
    try {
        await signOut(window.auth);
    } catch (error) {
        console.error("Logout error:", error);
    }
}

export function initAuthListener(onLogin, onLogout) {
    onAuthStateChanged(window.auth, async (user) => {
        if (user) {
            // Get user role
            try {
                const userRef = doc(window.db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                const role = userSnap.exists() ? userSnap.data().role : 'USER';
                onLogin(user, role);
            } catch (error) {
                console.error("Error fetching user role", error);
                onLogin(user, 'USER'); // Fallback
            }
        } else {
            onLogout();
        }
    });
}
