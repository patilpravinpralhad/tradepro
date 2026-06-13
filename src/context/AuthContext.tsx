"use client";
// src/context/AuthContext.tsx
// This context provides the logged-in user object to every page in the app.
// Wrap your layout with <AuthProvider> and use useAuth() anywhere to get the user.

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ---------- Types ----------
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ---------- Context ----------
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// ---------- Provider ----------
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for login/logout changes automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe(); // cleanup on unmount
  }, []);

  // Create a Firestore document for new users
  async function createUserDocument(firebaseUser: User) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        email: firebaseUser.email,
        createdAt: new Date().toISOString(),
        watchlist: [],
        portfolio: [],
        indicators: [],
        balance: 50000, // Starting virtual balance ₹50,000
      });
    }
  }

  async function signup(email: string, password: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user);
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- Custom Hook ----------
// Use this anywhere: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}