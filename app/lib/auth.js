'use client';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";

// --- IMPORTANT: Firebase Config Re-import (Ensure this is correct for your setup) ---
// যদি আপনার কনফিগ অন্য কোনো ফাইলে থাকে, তবে সেটি আমদানি করুন।
// কোডটিকে স্বতন্ত্র রাখার জন্য, আমি এখানে config আবার ব্যবহার করছি।
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Get Auth and Provider instances
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Google Sign-in with Popup
 * @returns {Promise<import('firebase/auth').User | null>} The signed-in user object or null on failure.
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // User signed in successfully
    return result.user; 
  } catch (error) {
    // Handle Errors here.
    console.error("Google Sign-In Error: ", error);
    // You might want to check for error.code === 'auth/popup-closed-by-user' 
    return null;
  }
};

/**
 * Signs out the current user.
 */
export const logOut = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Error: ", error);
    }
}

// Export auth and the listener for state changes
export { auth, onAuthStateChanged };