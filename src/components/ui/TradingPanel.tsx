"use client";
// src/components/TradingPanel.tsx
// A buy/sell panel shown on the asset chart page.
// Uses PortfolioContext to execute trades.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortfolio } from "@/context/PortfolioContext";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TradingPanelProps {
  assetId: string;
  assetName: string;
  currentPrice: number;
}

export default function TradingPanel({ assetId, assetName, currentPrice }: TradingPanelProps) {
  const { balance, holdings, buyAsset, sellAsset } = usePortfolio();
  const [qty, setQty]         = useState(1);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  const holding = holdings.find((h) => h.assetId === assetId);
  const fee     = currentPrice * qty * 0.001;
  const buyTotal  = currentPrice * qty + fee;
  const sellTotal = currentPrice * qty - fee;

  function handleBuy() {
    const msg = buyAsset(assetId, assetName, currentPrice, qty);
    setMessage(msg);
    setMsgType(msg.startsWith("✅") ? "success" : "error");
    setTimeout(() => setMessage(""), 4000);
  }

  function handleSell() {
    const msg = sellAsset(assetId, assetName, currentPrice, qty);
    setMessage(msg);
    setMsgType(msg.startsWith("✅") ? "success" : "error");
    setTimeout(() => setMessage(""), 4000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-lg p-5 shadow-lg"
    >
      <h3 className="text-white font-bold text-lg mb-4">Trade {assetName}</h3>

      {/* Balance and Holdings */}
      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400">Available Balance</div>
          <div className="text-white font-semibold">₹{balance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-gray-700 rounded p-2">
          <div className="text-gray-400">Holdings</div>
          <div className="text-white font-semibold">
            {holding ? `${holding.quantity} units` : "None"}
          </div>
        </div>
      </div>

      {/* Current Price */}
      <div className="bg-gray-700 rounded p-2 mb-4 text-sm">
        <div className="text-gray-400">Current Price</div>
        <div className="text-blue-400 font-bold">
          ₹{currentPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="text-gray-400 text-sm block mb-1">Quantity</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Cost Preview */}
      <div className="text-xs text-gray-400 mb-4 space-y-1">
        <div>Buy total: ₹{buyTotal.toFixed(2)} (incl. fee ₹{fee.toFixed(2)})</div>
        {holding && (
          <div>Sell proceeds: ₹{sellTotal.toFixed(2)} (after fee ₹{fee.toFixed(2)})</div>
        )}
        {holding && (
          <div className={holding.currentPrice >= holding.avgCost ? "text-green-400" : "text-red-400"}>
            Unrealised P&L: ₹{((holding.currentPrice - holding.avgCost) * holding.quantity).toFixed(2)}
          </div>
        )}
      </div>

      {/* Buy / Sell Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBuy}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <TrendingUp size={16} /> Buy
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSell}
          disabled={!holding}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <TrendingDown size={16} /> Sell
        </motion.button>
      </div>

      {/* Trade Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-sm p-2 rounded ${
              msgType === "success"
                ? "bg-green-500/20 text-green-400 border border-green-500"
                : "bg-red-500/20 text-red-400 border border-red-500"
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}