"use client";
// src/context/PortfolioContext.tsx
// Manages the user's virtual portfolio.
// Handles buy/sell actions, tracks holdings, P&L, and trade history.
// Saves everything to Firebase Firestore for persistence.

import { createContext, useContext, useEffect, useState } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

// ---------- Types ----------
export interface Holding {
  assetId: string;
  name: string;
  quantity: number;
  avgCost: number;      // average buy price
  currentPrice: number;
}

export interface Trade {
  id: string;
  assetId: string;
  name: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  fee: number;          // 0.1% transaction fee
  timestamp: string;
}

interface PortfolioContextType {
  balance: number;
  holdings: Holding[];
  trades: Trade[];
  buyAsset: (assetId: string, name: string, price: number, qty: number) => string;
  sellAsset: (assetId: string, name: string, price: number, qty: number) => string;
  updatePrices: (assetId: string, newPrice: number) => void;
  getTotalValue: () => number;
  getTotalPnL: () => number;
}

const PortfolioContext = createContext<PortfolioContextType>({} as PortfolioContextType);

const TRANSACTION_FEE_RATE = 0.001; // 0.1% fee per trade
const STARTING_BALANCE = 50000;     // ₹50,000 virtual money

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades]     = useState<Trade[]>([]);

  // Load portfolio from Firestore when user logs in
  useEffect(() => {
    if (!user) return;
    async function loadPortfolio() {
      const ref  = doc(db, "users", user!.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setBalance(data.balance ?? STARTING_BALANCE);
        setHoldings(data.portfolio ?? []);
        setTrades(data.trades ?? []);
      }
    }
    loadPortfolio();
  }, [user]);

  // Save portfolio to Firestore whenever something changes
  async function saveToFirestore(
    newBalance: number,
    newHoldings: Holding[],
    newTrades: Trade[]
  ) {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, {
      balance: newBalance,
      portfolio: newHoldings,
      trades: newTrades,
    });
  }

  // ── BUY ─────────────────────────────────────────────────────────────────────
  function buyAsset(assetId: string, name: string, price: number, qty: number): string {
    const fee   = price * qty * TRANSACTION_FEE_RATE;
    const total = price * qty + fee;

    if (total > balance) return "❌ Insufficient balance for this trade.";
    if (qty <= 0)        return "❌ Quantity must be greater than zero.";

    const newBalance = balance - total;

    // Update existing holding or add a new one
    const existing = holdings.find((h) => h.assetId === assetId);
    let newHoldings: Holding[];

    if (existing) {
      // Recalculate average cost
      const totalQty  = existing.quantity + qty;
      const totalCost = existing.avgCost * existing.quantity + price * qty;
      newHoldings = holdings.map((h) =>
        h.assetId === assetId
          ? { ...h, quantity: totalQty, avgCost: totalCost / totalQty, currentPrice: price }
          : h
      );
    } else {
      newHoldings = [
        ...holdings,
        { assetId, name, quantity: qty, avgCost: price, currentPrice: price },
      ];
    }

    const newTrade: Trade = {
      id: Date.now().toString(),
      assetId, name,
      type: "BUY",
      quantity: qty,
      price, total, fee,
      timestamp: new Date().toLocaleString(),
    };
    const newTrades = [newTrade, ...trades];

    setBalance(newBalance);
    setHoldings(newHoldings);
    setTrades(newTrades);
    saveToFirestore(newBalance, newHoldings, newTrades);

    return `✅ Bought ${qty} units of ${name} at ₹${price.toFixed(2)}. Fee: ₹${fee.toFixed(2)}`;
  }

  // ── SELL ─────────────────────────────────────────────────────────────────────
  function sellAsset(assetId: string, name: string, price: number, qty: number): string {
    const existing = holdings.find((h) => h.assetId === assetId);
    if (!existing)            return "❌ You don't hold this asset.";
    if (qty > existing.quantity) return "❌ You don't have enough units to sell.";
    if (qty <= 0)             return "❌ Quantity must be greater than zero.";

    const fee   = price * qty * TRANSACTION_FEE_RATE;
    const total = price * qty - fee;
    const newBalance = balance + total;

    let newHoldings: Holding[];
    if (existing.quantity === qty) {
      newHoldings = holdings.filter((h) => h.assetId !== assetId);
    } else {
      newHoldings = holdings.map((h) =>
        h.assetId === assetId
          ? { ...h, quantity: h.quantity - qty, currentPrice: price }
          : h
      );
    }

    const newTrade: Trade = {
      id: Date.now().toString(),
      assetId, name,
      type: "SELL",
      quantity: qty,
      price, total, fee,
      timestamp: new Date().toLocaleString(),
    };
    const newTrades = [newTrade, ...trades];

    setBalance(newBalance);
    setHoldings(newHoldings);
    setTrades(newTrades);
    saveToFirestore(newBalance, newHoldings, newTrades);

    const pnl = (price - existing.avgCost) * qty;
    return `✅ Sold ${qty} units of ${name}. P&L: ₹${pnl.toFixed(2)} | Fee: ₹${fee.toFixed(2)}`;
  }

  // Update current price of a holding (called by live price updates)
  function updatePrices(assetId: string, newPrice: number) {
    setHoldings((prev) =>
      prev.map((h) => (h.assetId === assetId ? { ...h, currentPrice: newPrice } : h))
    );
  }

  // Total portfolio value = balance + market value of all holdings
  function getTotalValue() {
    const holdingsValue = holdings.reduce(
      (sum, h) => sum + h.currentPrice * h.quantity,
      0
    );
    return balance + holdingsValue;
  }

  // Total P&L = current value of holdings - cost basis
  function getTotalPnL() {
    return holdings.reduce(
      (sum, h) => sum + (h.currentPrice - h.avgCost) * h.quantity,
      0
    );
  }

  return (
    <PortfolioContext.Provider
      value={{ balance, holdings, trades, buyAsset, sellAsset, updatePrices, getTotalValue, getTotalPnL }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  return useContext(PortfolioContext);
}