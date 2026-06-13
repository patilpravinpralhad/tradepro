"use client";
// src/app/login/page.tsx
// This page handles both Login and Signup in one place.
// After login/signup, user is redirected to /dashboard.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { TrendingUp, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const router = useRouter();

  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingBtn, setLoadingBtn] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoadingBtn(true);
    try {
      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      // Show friendly error messages
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password") {
        setError("Invalid email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("Email is already registered. Please log in.");
      } else if (code === "auth/weak-password") {
        setError("Password must be at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoadingBtn(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <TrendingUp className="text-blue-500 mr-2" size={32} />
          <span className="text-3xl font-bold text-blue-500">TradePro</span>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          {isSignup ? "Create your account" : "Welcome back"}
        </h2>
        <p className="text-gray-400 text-center mb-6 text-sm">
          {isSignup
            ? "Sign up to start your trading simulation"
            : "Log in to access your portfolio"}
        </p>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-3 mb-4 flex items-center text-sm"
          >
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2.5 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loadingBtn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingBtn ? "Please wait..." : isSignup ? "Create Account" : "Log In"}
          </motion.button>
        </form>

        {/* Toggle between login and signup */}
        <p className="text-center text-gray-400 text-sm mt-6">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => { setIsSignup(!isSignup); setError(""); }}
            className="text-blue-500 hover:underline font-medium"
          >
            {isSignup ? "Log In" : "Sign Up"}
          </button>
        </p>
      </motion.div>
    </div>
  );
}