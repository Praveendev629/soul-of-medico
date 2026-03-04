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
                
                // Create new user document
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    role: isAdmin ? 'ADMIN' : 'USER',
                    createdAt: new Date().toISOString()
                });
                
                console.log(`User document created for ${user.email} with role: ${isAdmin ? 'ADMIN' : 'USER'}`);
            } else {
                console.log(`Existing user: ${user.email}, role: ${userSnap.data().role}`);
            }
        } catch (firestoreError) {
            console.error("Firestore error during user document check:", firestoreError);
            // Don't throw - allow login to proceed even if Firestore fails
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
            // Get user role from Firestore
            try {
                const userRef = doc(window.db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const userData = userSnap.data();
                    const role = userData.role || 'USER';
                    console.log(`Auth state changed - User: ${user.email}, Role: ${role}`);
                    onLogin(user, role);
                } else {
                    // User document doesn't exist yet - check if admin email
                    const isAdmin = user.email === 'soulofmedico@gmail.com';
                    console.log(`User document not found, defaulting to ${isAdmin ? 'ADMIN' : 'USER'} based on email`);
                    onLogin(user, isAdmin ? 'ADMIN' : 'USER');
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
                // Fallback: check if admin email
                const isAdmin = user.email === 'soulofmedico@gmail.com';
                console.warn(`Using fallback role detection: ${isAdmin ? 'ADMIN' : 'USER'}`);
                onLogin(user, isAdmin ? 'ADMIN' : 'USER');
            }
        } else {
            console.log('User logged out');
            onLogout();
        }
    });
}
