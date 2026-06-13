// src/lib/firebase.ts
// Replace the firebaseConfig values below with your actual Firebase project credentials.
// Get them from: https://console.firebase.google.com -> Your Project -> Project Settings -> Your Apps

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8Hix45CzmziP6oJ4--7xhnhKZ9Y4ntVg",
  authDomain: "tradepro-c45b1.firebaseapp.com",
  projectId: "tradepro-c45b1",
  storageBucket: "tradepro-c45b1.firebasestorage.app",
  messagingSenderId: "921063617370",
  appId: "1:921063617370:web:03e5592e601afe51d03963",
};

// Prevent re-initializing Firebase on hot reload in Next.js
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;