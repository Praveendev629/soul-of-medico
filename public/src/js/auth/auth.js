import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function login() {
    try {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await signInWithPopup(window.auth, provider);
        const user = result.user;

        // Ensure user document exists in Firestore
        const userRef = doc(window.db, "users", user.uid);
        
        try {
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Check if this is the admin email
                const isAdmin = user.email === 'soulofmedico@gmail.com';
                
                // New user, create document
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    role: isAdmin ? 'ADMIN' : 'USER',
                    createdAt: new Date().toISOString()
                });
            }
        } catch (firestoreError) {
            console.error("Firestore error during login:", firestoreError);
            // If we can't access Firestore, still allow login but warn user
            console.warn("User document not created/accessible, but login successful");
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
                // Default to USER role if Firestore is unavailable
                onLogin(user, 'USER');
            }
        } else {
            onLogout();
        }
    });
}
