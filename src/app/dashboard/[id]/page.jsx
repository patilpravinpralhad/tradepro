"use client";
// src/app/dashboard/[Id]/page.jsx

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import {
  Search, Bell, User, Eye, PlusCircle,
  Menu, X, ArrowUpRight, ArrowDownRight, Clock,
  DollarSign, BarChart2, Zap, TrendingUp, Activity,
} from "lucide-react";
import { Chart } from "react-google-charts";
import { useRouter } from "next/navigation";
import TradingPanel from "@/components/TradingPanel";
import { usePortfolio } from "@/context/PortfolioContext";
import {
  generateCandleData, toGoogleCandlestick, getNextCandle, ASSETS,
} from "@/lib/marketData";
import { detectPatterns } from "@/lib/patterns";
import {
  calcMA, calcRSI, calcBollingerBands, calcVolatility,
  getMACrossSignal, getRSISignal,
} from "@/lib/indicators";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  return (
    <motion.header
      {...fadeInUp}
      className="flex justify-between items-center p-4 bg-gray-900 text-white sticky top-0 z-10"
    >
      <div className="flex items-center space-x-8">
        <motion.span onClick={() => router.push("/")} className="text-2xl font-bold text-blue-500 cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          TradePro
        </motion.span>
        <nav className="hidden md:block">
          <ul className="flex space-x-4">
            <li><a href="/dashboard" className="text-blue-500 font-semibold flex items-center"><Zap className="mr-1" size={16} /> Explore</a></li>
            <li><a href="/portfolio" className="text-gray-300 hover:text-blue-500 flex items-center"><TrendingUp className="mr-1" size={16} /> Portfolio</a></li>
            <li><a href="/analytics" className="text-gray-300 hover:text-blue-500 flex items-center"><Activity className="mr-1" size={16} /> Analytics</a></li>
          </ul>
        </nav>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search assets..." className="pl-10 pr-4 py-2 bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Bell className="text-gray-300 hover:text-blue-500 cursor-pointer" /></motion.div>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><User className="text-gray-300 hover:text-blue-500 cursor-pointer" onClick={() => router.push("/portfolio")} /></motion.div>
        <motion.div className="md:hidden" whileHover={{ scale: 1.1 }} onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu className="text-gray-300" /></motion.div>
      </div>
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, x: "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: "100%" }} transition={{ type: "tween" }} className="fixed top-0 right-0 h-full w-64 bg-gray-800 p-4 z-50">
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4"><X /></button>
            <nav className="mt-8">
              <ul className="space-y-4">
                <li><a href="/dashboard" className="text-blue-500 font-semibold flex items-center"><Zap className="mr-2" size={16} />Explore</a></li>
                <li><a href="/portfolio" className="text-gray-300 hover:text-blue-500 flex items-center"><TrendingUp className="mr-2" size={16} />Portfolio</a></li>
                <li><a href="/analytics" className="text-gray-300 hover:text-blue-500 flex items-center"><Activity className="mr-2" size={16} />Analytics</a></li>
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

const StockChart = ({ stock }) => {
  const { updatePrices } = usePortfolio();

  // ✅ KEY FIX: Decode "Tata%20Motors" → "Tata Motors"
  const decodedStock = decodeURIComponent(stock);

  const assetInfo = ASSETS.find((a) => a.id === decodedStock) || {
    id: decodedStock, name: decodedStock, type: "stock", basePrice: 425371, color: "#3B82F6",
  };

  const [chartType, setChartType]           = useState("candlestick");
  const [candles, setCandles]               = useState(() => generateCandleData(assetInfo.basePrice, 30));
  const [currentValue, setCurrentValue]     = useState(assetInfo.basePrice);
  const [change, setChange]                 = useState({ value: 0, percentage: 0 });
  const [timeRange, setTimeRange]           = useState("15M");
  const [compareAssets, setCompareAssets]   = useState([]);
  const [compareData, setCompareData]       = useState({});
  const [patterns, setPatterns]             = useState([]);
  const [filterPattern, setFilterPattern]   = useState("All");
  const [showMA, setShowMA]                 = useState(false);
  const [maPeriod, setMaPeriod]             = useState(10);
  const [showRSI, setShowRSI]               = useState(false);
  const [showBB, setShowBB]                 = useState(false);
  const [strategySignal, setStrategySignal] = useState("HOLD");

  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        const next = getNextCandle(prev[prev.length - 1].close);
        const updated = [...prev.slice(-49), next];
        const initial = updated[0].open;
        const current = next.close;
        setCurrentValue(current);
        setChange({ value: current - initial, percentage: ((current - initial) / initial) * 100 });
        updatePrices(decodedStock, current);
        setPatterns(detectPatterns(updated));
        const closes = updated.map((c) => c.close);
        const maSignal = getMACrossSignal(closes, maPeriod, maPeriod * 2);
        const rsiSignal = getRSISignal(closes);
        setStrategySignal(maSignal !== "HOLD" ? maSignal : rsiSignal);
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [decodedStock, maPeriod, updatePrices]);

  useEffect(() => {
    compareAssets.forEach((id) => {
      const a = ASSETS.find((x) => x.id === id);
      if (!a) return;
      setCompareData((prev) => ({ ...prev, [id]: generateCandleData(a.basePrice, 30) }));
    });
  }, [compareAssets]);

  const closes    = candles.map((c) => c.close);
  const maValues  = showMA  ? calcMA(closes, maPeriod)   : [];
  const rsiValues = showRSI ? calcRSI(closes)            : [];
  const bbValues  = showBB  ? calcBollingerBands(closes) : [];
  const volatility = calcVolatility(closes);

  const chartData = useMemo(() => {
    if (chartType === "candlestick") return toGoogleCandlestick(candles);
    const header = ["Time", decodedStock, ...(showMA ? [`MA(${maPeriod})`] : []), ...compareAssets];
    const rows = candles.map((c, i) => [
      c.time, c.close,
      ...(showMA && maValues[i] != null ? [maValues[i]] : showMA ? [null] : []),
      ...compareAssets.map((id) => { const cd = compareData[id]; return cd && cd[i] ? cd[i].close : null; }),
    ]);
    return [header, ...rows];
  }, [candles, chartType, showMA, maValues, maPeriod, compareAssets, compareData, decodedStock]);

  const chartOptions = useMemo(() => ({
    backgroundColor: "transparent",
    chartArea: { width: "90%", height: "75%" },
    hAxis: { textStyle: { color: "#9CA3AF" }, baselineColor: "#4B5563", gridlines: { color: "transparent" } },
    vAxis: { textStyle: { color: "#9CA3AF" }, baselineColor: "#4B5563", gridlines: { color: "#374151" } },
    legend: chartType === "line" ? { position: "top", textStyle: { color: "#9CA3AF" } } : { position: "none" },
    candlestick: { fallingColor: { strokeWidth: 0, fill: "#EF4444" }, risingColor: { strokeWidth: 0, fill: "#10B981" } },
    colors: ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"],
    animation: { startup: true, duration: 500, easing: "out" },
  }), [chartType]);

  const bbChartData = useMemo(() => {
    if (!showBB || bbValues.length === 0) return null;
    const header = ["Time", "Upper", "Middle", "Lower", "Price"];
    const rows = candles.map((c, i) => { const bb = bbValues[i]; return [c.time, bb.upper, bb.middle, bb.lower, c.close]; });
    return [header, ...rows];
  }, [showBB, bbValues, candles]);

  const rsiChartData = useMemo(() => {
    if (!showRSI) return null;
    const header = ["Time", "RSI", "Overbought (70)", "Oversold (30)"];
    const rows = candles.map((c, i) => [c.time, rsiValues[i] ?? null, 70, 30]);
    return [header, ...rows];
  }, [showRSI, rsiValues, candles]);

  const visiblePatterns = filterPattern === "All" ? patterns : patterns.filter((p) => p.name === filterPattern);
  const patternNames = ["All", ...new Set(patterns.map((p) => p.name))];
  const signalColor = strategySignal === "BUY" ? "text-green-400 bg-green-900/30 border-green-500" : strategySignal === "SELL" ? "text-red-400 bg-red-900/30 border-red-500" : "text-gray-400 bg-gray-700/30 border-gray-600";

  return (
    <div className="space-y-4">
      <motion.div {...fadeInUp} className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">{decodedStock}</h2>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-3xl font-bold text-white">{currentValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              <motion.span className={`flex items-center ${change.value >= 0 ? "text-green-500" : "text-red-500"}`} key={change.value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {change.value >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                {change.value > 0 ? "+" : ""}{change.value.toFixed(2)} ({change.percentage.toFixed(2)}%)
              </motion.span>
              <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${signalColor}`}>{strategySignal}</span>
            </div>
          </div>
          <div className="flex space-x-2 flex-wrap gap-2">
            <motion.button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><PlusCircle className="mr-2" size={16} /> Create Alert</motion.button>
            <motion.button className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center text-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Eye className="mr-2" size={16} /> Watchlist</motion.button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-gray-400 text-sm">Chart Type:</span>
          {["candlestick", "line", "bar"].map((type) => (
            <button key={type} onClick={() => setChartType(type)} className={`px-3 py-1 rounded text-sm capitalize ${chartType === type ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>{type}</button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-gray-400 text-sm">Indicators:</span>
          <button onClick={() => setShowMA(!showMA)} className={`px-3 py-1 rounded text-sm ${showMA ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}>MA({maPeriod})</button>
          {showMA && (<input type="number" min={3} max={50} value={maPeriod} onChange={(e) => setMaPeriod(Number(e.target.value))} className="w-16 bg-gray-700 text-white rounded px-2 py-1 text-sm border border-gray-600" />)}
          <button onClick={() => setShowRSI(!showRSI)} className={`px-3 py-1 rounded text-sm ${showRSI ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300"}`}>RSI</button>
          <button onClick={() => setShowBB(!showBB)} className={`px-3 py-1 rounded text-sm ${showBB ? "bg-yellow-600 text-white" : "bg-gray-700 text-gray-300"}`}>Bollinger Bands</button>
        </div>

        {chartType !== "candlestick" && (
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            <span className="text-gray-400 text-sm">Compare:</span>
            {ASSETS.filter((a) => a.id !== decodedStock).map((a) => (
              <button key={a.id} onClick={() => setCompareAssets((prev) => prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id])} className={`px-3 py-1 rounded text-sm ${compareAssets.includes(a.id) ? "text-white" : "bg-gray-700 text-gray-300"}`} style={compareAssets.includes(a.id) ? { backgroundColor: a.color } : {}}>{a.name}</button>
            ))}
          </div>
        )}

        <Chart chartType={chartType === "candlestick" ? "CandlestickChart" : chartType === "bar" ? "BarChart" : "LineChart"} width="100%" height="380px" data={chartData} options={chartOptions} />

        <div className="flex justify-between mt-4 overflow-x-auto gap-2">
          {["5M", "10M", "15M", "30M", "1H"].map((range) => (
            <motion.button key={range} className={`text-sm ${timeRange === range ? "text-blue-500" : "text-gray-300"} hover:text-blue-500 flex items-center`} onClick={() => setTimeRange(range)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><Clock size={14} className="mr-1" />{range}</motion.button>
          ))}
        </div>

        <div className="mt-3 text-xs text-gray-400">
          Volatility: <span className={`font-semibold ${volatility > 1.5 ? "text-red-400" : "text-green-400"}`}>{volatility.toFixed(2)}%</span>
          <span className="ml-2 text-gray-500">{volatility > 1.5 ? "High risk" : "Stable market"}</span>
        </div>
      </motion.div>

      {showRSI && rsiChartData && (
        <motion.div {...fadeInUp} className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><Activity size={16} className="text-purple-400" /> RSI (14)<span className="text-xs text-gray-400 ml-2">Above 70 = Overbought | Below 30 = Oversold</span></h3>
          <Chart chartType="LineChart" width="100%" height="180px" data={rsiChartData} options={{ backgroundColor: "transparent", chartArea: { width: "90%", height: "70%" }, hAxis: { textStyle: { color: "#9CA3AF" }, gridlines: { color: "transparent" } }, vAxis: { textStyle: { color: "#9CA3AF" }, minValue: 0, maxValue: 100 }, legend: { position: "top", textStyle: { color: "#9CA3AF" } }, colors: ["#A855F7", "#EF4444", "#10B981"], series: { 1: { lineDashStyle: [4, 4] }, 2: { lineDashStyle: [4, 4] } } }} />
        </motion.div>
      )}

      {showBB && bbChartData && (
        <motion.div {...fadeInUp} className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2"><BarChart2 size={16} className="text-yellow-400" /> Bollinger Bands (20)<span className="text-xs text-gray-400 ml-2">Wide = High volatility | Narrow = Low volatility</span></h3>
          <Chart chartType="LineChart" width="100%" height="200px" data={bbChartData} options={{ backgroundColor: "transparent", chartArea: { width: "90%", height: "75%" }, hAxis: { textStyle: { color: "#9CA3AF" }, gridlines: { color: "transparent" } }, vAxis: { textStyle: { color: "#9CA3AF" }, gridlines: { color: "#374151" } }, legend: { position: "top", textStyle: { color: "#9CA3AF" } }, colors: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6"] }} />
        </motion.div>
      )}

      <motion.div {...fadeInUp} className="bg-gray-800 p-5 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-2">
          <h3 className="text-white font-bold flex items-center gap-2"><TrendingUp size={18} className="text-blue-400" />Candlestick Patterns Detected ({patterns.length})</h3>
          <div className="flex gap-2 flex-wrap">
            {patternNames.map((name) => (<button key={name} onClick={() => setFilterPattern(name)} className={`text-xs px-2 py-1 rounded ${filterPattern === name ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`}>{name}</button>))}
          </div>
        </div>
        {visiblePatterns.length === 0 ? (
          <p className="text-gray-400 text-sm">No patterns detected in current data window.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
            {visiblePatterns.slice(0, 9).map((p, i) => (
              <div key={i} className={`p-3 rounded border text-sm ${p.type === "bullish" ? "border-green-500 bg-green-900/20" : p.type === "bearish" ? "border-red-500 bg-red-900/20" : "border-gray-500 bg-gray-700/20"}`}>
                <div className={`font-semibold ${p.type === "bullish" ? "text-green-400" : p.type === "bearish" ? "text-red-400" : "text-gray-300"}`}>{p.name}<span className="ml-1 text-xs text-gray-400">@ candle {p.index + 1}</span></div>
                <div className="text-gray-400 text-xs mt-1">{p.description}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const OptionsTable = ({ stock }) => {
  const decodedStock = decodeURIComponent(stock);
  const [options, setOptions] = useState([
    { strike: 25400, callPrice: 115.15, callChange: 17.0,   putPrice: 97.55, putChange: -15.55 },
    { strike: 25300, callPrice: 95.4,   callChange: -10.9,  putPrice: 96.65, putChange: 28.85  },
    { strike: 25200, callPrice: 78.5,   callChange: 32.78,  putPrice: 73.65, putChange: -12.25 },
    { strike: 25100, callPrice: 29.7,   callChange: -10.14, putPrice: 28.3,  putChange: 20.74  },
  ]);
  useEffect(() => {
    const interval = setInterval(() => {
      setOptions((prev) => prev.map((o) => ({ ...o, callPrice: o.callPrice + (Math.random() - 0.5) * 5, callChange: (Math.random() - 0.5) * 10, putPrice: o.putPrice + (Math.random() - 0.5) * 5, putChange: (Math.random() - 0.5) * 10 })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div {...fadeInUp} className="bg-gray-800 p-6 rounded-lg shadow-lg my-6 overflow-x-auto">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center"><DollarSign size={24} className="mr-2" />Top {decodedStock} Options</h3>
      <table className="w-full text-left">
        <thead><tr className="text-gray-400 border-b border-gray-700"><th className="py-2">Strike</th><th className="py-2">Call Price</th><th className="py-2">Put Price</th></tr></thead>
        <tbody>
          {options.map((o, i) => (
            <tr key={i} className="border-b border-gray-700">
              <td className="py-2 text-white font-medium">{o.strike}</td>
              <td className="py-2"><div className="text-white">{o.callPrice.toFixed(2)}</div><div className={o.callChange >= 0 ? "text-green-500 text-xs" : "text-red-500 text-xs"}>{o.callChange.toFixed(2)}%</div></td>
              <td className="py-2"><div className="text-white">{o.putPrice.toFixed(2)}</div><div className={o.putChange >= 0 ? "text-green-500 text-xs" : "text-red-500 text-xs"}>{o.putChange.toFixed(2)}%</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default function AssetPage({ params }) {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 1500); }, []);

  const decodedId = decodeURIComponent(params.id);

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center">
        <motion.div className="text-blue-500 text-2xl font-bold" animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
          Loading {decodedId}...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-300">
      <Header />
      <main className="container mx-auto px-4 py-4">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
          <a href="/" className="hover:text-blue-500">Home</a>
          <span>/</span>
          <a href="/dashboard" className="hover:text-blue-500">Dashboard</a>
          <span>/</span>
          <span className="text-blue-500">{decodedId}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <StockChart stock={params.id} />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <TradingPanel
              assetId={decodedId}
              assetName={decodedId}
              currentPrice={ASSETS.find((a) => a.id === decodedId)?.basePrice || 425371}
            />
          </div>
        </div>
        <OptionsTable stock={params.id} />
      </main>
    </div>
  );
}