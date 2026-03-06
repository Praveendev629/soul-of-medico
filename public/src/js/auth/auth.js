import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function login() {
    try {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await signInWithPopup(window.auth, provider);
        const user = result.user;

        // Ensure user document exists in Firestore with proper role
        const userRef = doc(window.db, "users", user.uid);
        const isAdmin = user.email === 'soulofmedico001@gmail.com';
        
        try {
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create new user document with role
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    role: isAdmin ? 'ADMIN' : 'USER',
                    photoURL: user.photoURL,
                    createdAt: new Date().toISOString()
                });
                
                console.log(`User document created for ${user.email} with role: ${isAdmin ? 'ADMIN' : 'USER'}`);
            } else {
                // Check if role is missing and update if needed
                const userData = userSnap.data();
                if (!userData.role || (isAdmin && userData.role !== 'ADMIN')) {
                    await updateDoc(userRef, { role: isAdmin ? 'ADMIN' : 'USER' });
                    console.log(`Updated role for ${user.email} to ${isAdmin ? 'ADMIN' : 'USER'}`);
                }
                console.log(`Existing user: ${user.email}, role: ${userData.role || (isAdmin ? 'ADMIN' : 'USER')}`);
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

// Email/Password Sign In
export async function signInWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(window.auth, email, password);
        const user = result.user;
        
        if (!user.emailVerified) {
            await signOut(window.auth);
            throw new Error('Please verify your email before logging in. Check your inbox.');
        }
        
        // Check and update user role for admin
        const userRef = doc(window.db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            // Update role if this is admin email but role is not set correctly
            const userData = userSnap.data();
            if (email === 'soulofmedico001@gmail.com' && userData.role !== 'ADMIN') {
                await updateDoc(userRef, { role: 'ADMIN' });
                console.log('Updated admin role for soulofmedico001@gmail.com');
            }
        } else {
            // Create user document if doesn't exist
            const isAdmin = email === 'soulofmedico001@gmail.com';
            await setDoc(userRef, {
                email: user.email,
                displayName: user.displayName || email.split('@')[0],
                role: isAdmin ? 'ADMIN' : 'USER',
                createdAt: new Date().toISOString()
            });
        }
        
        return user;
    } catch (error) {
        console.error("Email sign in error:", error);
        throw error;
    }
}

// Email/Password Sign Up
export async function signUpWithEmail(email, password, displayName) {
    try {
        const result = await createUserWithEmailAndPassword(window.auth, email, password);
        const user = result.user;
        
        // Send verification email
        await sendEmailVerification(user);
        
        // Update profile with display name
        await updateProfile(user, {
            displayName: displayName
        });
        
        // Create user document in Firestore
        const userRef = doc(window.db, "users", user.uid);
        await setDoc(userRef, {
            email: user.email,
            displayName: displayName,
            role: 'USER',
            emailVerified: false,
            createdAt: new Date().toISOString()
        });
        
        return user;
    } catch (error) {
        console.error("Sign up error:", error);
        throw error;
    }
}

// Password Reset
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(window.auth, email);
        console.log('Password reset email sent');
    } catch (error) {
        console.error("Password reset error:", error);
        throw error;
    }
}

// Update User Profile
export async function updateUserProfile(userId, updates) {
    try {
        const userRef = doc(window.db, "users", userId);
        await updateDoc(userRef, updates);
        console.log('Profile updated successfully');
    } catch (error) {
        console.error("Profile update error:", error);
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
                    const isAdmin = user.email === 'soulofmedico001@gmail.com';
                    console.log(`User document not found, defaulting to ${isAdmin ? 'ADMIN' : 'USER'} based on email`);
                    onLogin(user, isAdmin ? 'ADMIN' : 'USER');
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
                // Fallback: check if admin email
                const isAdmin = user.email === 'soulofmedico001@gmail.com';
                console.warn(`Using fallback role detection: ${isAdmin ? 'ADMIN' : 'USER'}`);
                onLogin(user, isAdmin ? 'ADMIN' : 'USER');
            }
        } else {
            console.log('User logged out');
            onLogout();
        }
    });
}
