// Next.js-এ এই ফাইলটি ব্যবহার করা হলে, এটি নিশ্চিত করে যে
// পরিবেশ ভেরিয়েবলগুলো রান-টাইমে ঠিকমতো লোড হচ্ছে।
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// পরিবেশ ভেরিয়েবলগুলো Next.js দ্বারা client-side-এ লোড করা হয়।
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
    console.error("FIREBASE ERROR: API Key is missing. Check your .env.local file.");
}

// Firebase অ্যাপ ইনিশিয়ালাইজ করুন
const app = initializeApp(firebaseConfig);

// Firestore সার্ভিস ইনিশিয়ালাইজ করুন
const db = getFirestore(app);

// অন্যান্য ফাইলে ব্যবহারের জন্য এক্সপোর্ট করুন
export { db, app };