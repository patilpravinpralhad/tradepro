// src/lib/indicators.ts
// Pure calculation functions for technical indicators.
// Input: array of closing prices. Output: array of values.

// ── MOVING AVERAGE (MA) ───────────────────────────────────────────────────────
// Returns the average of the last `period` closing prices at each point.
// Leading values (before enough data) are null.
export function calcMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

// ── RSI (Relative Strength Index) ────────────────────────────────────────────
// RSI measures momentum. Range: 0–100.
// Above 70 = overbought (might fall), Below 30 = oversold (might rise).
export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(period).fill(null);

  for (let i = period; i < closes.length; i++) {
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) {
      result.push(100);
    } else {
      const rs = avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

// ── BOLLINGER BANDS ───────────────────────────────────────────────────────────
// Returns upper band, middle band (MA), and lower band.
// Upper = MA + (2 × std dev), Lower = MA − (2 × std dev).
// Wide bands = high volatility, Narrow bands = low volatility.
export interface BollingerBand {
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

export function calcBollingerBands(closes: number[], period = 20): BollingerBand[] {
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null };

    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: mean + 2 * stdDev,
      middle: mean,
      lower: mean - 2 * stdDev,
    };
  });
}

// ── VOLATILITY ─────────────────────────────────────────────────────────────────
// Standard deviation of last N closing prices as a percentage of mean.
export function calcVolatility(closes: number[], period = 14): number {
  if (closes.length < period) return 0;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  return (Math.sqrt(variance) / mean) * 100;
}

// ── STRATEGY SIGNALS ─────────────────────────────────────────────────────────
// Returns "BUY", "SELL", or "HOLD" based on simple rules.
export type Signal = "BUY" | "SELL" | "HOLD";

export function getMACrossSignal(closes: number[], shortPeriod = 10, longPeriod = 20): Signal {
  const shortMA = calcMA(closes, shortPeriod);
  const longMA  = calcMA(closes, longPeriod);
  const i = closes.length - 1;

  const shortNow  = shortMA[i];
  const shortPrev = shortMA[i - 1];
  const longNow   = longMA[i];
  const longPrev  = longMA[i - 1];

  if (!shortNow || !shortPrev || !longNow || !longPrev) return "HOLD";

  if (shortPrev <= longPrev && shortNow > longNow) return "BUY";  // Golden cross
  if (shortPrev >= longPrev && shortNow < longNow) return "SELL"; // Death cross
  return "HOLD";
}

export function getRSISignal(closes: number[]): Signal {
  const rsi = calcRSI(closes);
  const lastRSI = rsi.filter((v) => v !== null).pop();
  if (lastRSI === undefined || lastRSI === null) return "HOLD";
  if (lastRSI < 30) return "BUY";
  if (lastRSI > 70) return "SELL";
  return "HOLD";
}