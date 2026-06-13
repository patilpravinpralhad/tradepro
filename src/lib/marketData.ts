// src/lib/marketData.ts
// Generates random OHLC (candlestick) data for any asset.
// Used by the chart page for multi-asset comparison.

export type CandleData = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type AssetType = "stock" | "crypto" | "bond";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  basePrice: number;
  color: string;
}

// Predefined assets users can compare
export const ASSETS: Asset[] = [
  { id: "RELIANCE", name: "Reliance", type: "stock", basePrice: 2345, color: "#3B82F6" },
  { id: "TCS",      name: "TCS",      type: "stock", basePrice: 3800, color: "#10B981" },
  { id: "BITCOIN",  name: "Bitcoin",  type: "crypto", basePrice: 4200000, color: "#F59E0B" },
  { id: "ETHEREUM", name: "Ethereum", type: "crypto", basePrice: 220000, color: "#8B5CF6" },
  { id: "BOND10Y",  name: "10Y Bond", type: "bond",  basePrice: 98.5,  color: "#EF4444" },
];

// Generate an array of candle data points starting from a base price
export function generateCandleData(basePrice: number, points: number): CandleData[] {
  const candles: CandleData[] = [];
  let price = basePrice;

  for (let i = points; i >= 0; i--) {
    const time = new Date(Date.now() - i * 60000).toLocaleTimeString();
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.01; // slight upward bias
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low  = Math.min(open, close) - Math.random() * price * 0.005;
    candles.push({ time, open, high, low, close });
    price = close;
  }
  return candles;
}

// Convert CandleData to Google Charts format for CandlestickChart
// Format: ["Time", Low, Open, Close, High]
export function toGoogleCandlestick(candles: CandleData[]): (string | number)[][] {
  const header = ["Time", "Low", "Open", "Close", "High"];
  const rows = candles.map((c) => [c.time, c.low, c.open, c.close, c.high]);
  return [header, ...rows];
}

// Convert CandleData to Google Charts format for LineChart
// Format: ["Time", "Price"]
export function toGoogleLine(candles: CandleData[], label: string): (string | number)[][] {
  const header = ["Time", label];
  const rows = candles.map((c) => [c.time, c.close]);
  return [header, ...rows];
}

// Get a new single candle (used to append live data)
export function getNextCandle(lastClose: number): CandleData {
  const open = lastClose;
  const change = (Math.random() - 0.48) * lastClose * 0.01;
  const close = open + change;
  const high = Math.max(open, close) + Math.random() * lastClose * 0.005;
  const low  = Math.min(open, close) - Math.random() * lastClose * 0.005;
  return {
    time: new Date().toLocaleTimeString(),
    open, high, low, close,
  };
}