// src/lib/patterns.ts
// Detects common candlestick patterns from OHLC data.
// Each function returns true/false based on the candle shape rules.

import { CandleData } from "./marketData";

export interface PatternResult {
  index: number;       // which candle has the pattern
  name: string;        // pattern name e.g. "Hammer"
  description: string; // short explanation for tooltip
  type: "bullish" | "bearish" | "neutral";
}

// ── HAMMER ──────────────────────────────────────────────────────────────────
// Small body near the top, long lower shadow (2x the body), tiny upper shadow.
// Signals a potential bullish reversal.
function isHammer(c: CandleData): boolean {
  const body = Math.abs(c.close - c.open);
  const lowerShadow = Math.min(c.open, c.close) - c.low;
  const upperShadow = c.high - Math.max(c.open, c.close);
  return body > 0 && lowerShadow >= 2 * body && upperShadow <= body * 0.3;
}

// ── DOJI ────────────────────────────────────────────────────────────────────
// Open and close are almost equal — body is very small (< 0.1% of price).
// Signals indecision in the market.
function isDoji(c: CandleData): boolean {
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  return range > 0 && body / range < 0.1;
}

// ── BULLISH ENGULFING ────────────────────────────────────────────────────────
// Current candle is bullish (close > open) and its body completely covers
// the previous bearish candle's body.
function isBullishEngulfing(prev: CandleData, curr: CandleData): boolean {
  const prevBearish = prev.close < prev.open;
  const currBullish = curr.close > curr.open;
  return (
    prevBearish &&
    currBullish &&
    curr.open < prev.close &&
    curr.close > prev.open
  );
}

// ── BEARISH ENGULFING ────────────────────────────────────────────────────────
// Current candle is bearish and its body completely covers
// the previous bullish candle's body.
function isBearishEngulfing(prev: CandleData, curr: CandleData): boolean {
  const prevBullish = prev.close > prev.open;
  const currBearish = curr.close < curr.open;
  return (
    prevBullish &&
    currBearish &&
    curr.open > prev.close &&
    curr.close < prev.open
  );
}

// ── SHOOTING STAR ────────────────────────────────────────────────────────────
// Small body near the low, long upper shadow. Bearish reversal signal.
function isShootingStar(c: CandleData): boolean {
  const body = Math.abs(c.close - c.open);
  const upperShadow = c.high - Math.max(c.open, c.close);
  const lowerShadow = Math.min(c.open, c.close) - c.low;
  return body > 0 && upperShadow >= 2 * body && lowerShadow <= body * 0.3;
}

// ── MAIN DETECTOR ────────────────────────────────────────────────────────────
// Scan all candles and return detected patterns with their index.
export function detectPatterns(candles: CandleData[]): PatternResult[] {
  const results: PatternResult[] = [];

  candles.forEach((candle, i) => {
    if (isHammer(candle)) {
      results.push({
        index: i,
        name: "Hammer",
        description: "Bullish reversal signal. Long lower shadow shows buyers pushed price back up.",
        type: "bullish",
      });
    }
    if (isDoji(candle)) {
      results.push({
        index: i,
        name: "Doji",
        description: "Indecision candle. Open and close are nearly equal — trend may reverse.",
        type: "neutral",
      });
    }
    if (isShootingStar(candle)) {
      results.push({
        index: i,
        name: "Shooting Star",
        description: "Bearish reversal signal. Long upper shadow shows sellers took control.",
        type: "bearish",
      });
    }
    if (i > 0) {
      if (isBullishEngulfing(candles[i - 1], candle)) {
        results.push({
          index: i,
          name: "Bullish Engulfing",
          description: "Strong bullish signal. Current candle fully covers the previous bearish candle.",
          type: "bullish",
        });
      }
      if (isBearishEngulfing(candles[i - 1], candle)) {
        results.push({
          index: i,
          name: "Bearish Engulfing",
          description: "Strong bearish signal. Current candle fully covers the previous bullish candle.",
          type: "bearish",
        });
      }
    }
  });

  return results;
}