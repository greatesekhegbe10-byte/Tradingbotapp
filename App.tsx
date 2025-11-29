import React, { useState, useEffect, useRef } from 'react';
import { Bot, Wallet, Activity, AlertTriangle } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { MarketDataPoint, Trade, TradeType, AnalysisResult, BotConfig } from './types';
import { generateMarketData } from './services/marketService';
import { analyzeMarket } from './services/geminiService';

const App: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    riskLevel: 'MEDIUM',
    pair: 'BTC/USD',
    balance: 10000
  });

  // Track manual trade requests
  const [pendingTrade, setPendingTrade] = useState<{ type: TradeType; price: number } | null>(null);

  // Initial Data Load
  useEffect(() => {
    const initialData: MarketDataPoint[] = [];
    let price = 65000;
    const now = new Date();
    for (let i = 0; i < 50; i++) {
      initialData.push({
        time: new Date(now.getTime() - (50 - i) * 1000).toLocaleTimeString(),
        price: price + (Math.random() - 0.5) * 100,
        volume: Math.floor(Math.random() * 100)
      });
    }
    setMarketData(initialData);
  }, []);

  // Real-time Market Data Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = generateMarketData(prev[prev.length - 1]?.price || 65000);
        const updated = [...prev, newData];
        if (updated.length > 50) updated.shift();
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Smart Risk Management (Trailing Stop) & Trade Monitoring
  useEffect(() => {
    if (marketData.length === 0) return;
    const currentPrice = marketData[marketData.length - 1].price;

    setTrades(prevTrades => {
      return prevTrades.map(trade => {
        if (trade.status !== 'OPEN') return trade;

        let shouldClose = false;
        let profit = 0;
        let currentSL = trade.stopLoss || 0;
        let newSL = currentSL;
        let isTrailing = trade.isTrailing || false;

        // --- TRAILING STOP LOGIC FOR MINIMAL LOSSES ---
        // If profit > 0.5%, move SL to Entry (Break Even)
        // If profit > 1.5%, trail SL behind price by 0.5%
        
        if (trade.type === TradeType.BUY) {
           const currentProfitPct = (currentPrice - trade.price) / trade.price;

           // Move to Break Even
           if (currentProfitPct > 0.005 && currentSL < trade.price) {
               newSL = trade.price;
               isTrailing = true;
           }
           // Trailing
           const trailGap = trade.price * 0.005; // 0.5% gap
           const potentialSL = currentPrice - trailGap;
           if (currentProfitPct > 0.015 && potentialSL > newSL) {
               newSL = potentialSL;
               isTrailing = true;
           }

           if (trade.stopLoss && currentPrice <= newSL) shouldClose = true;
           if (trade.takeProfit && currentPrice >= trade.takeProfit) shouldClose = true;
           if (shouldClose) profit = (currentPrice - trade.price) * trade.amount;

        } else if (trade.type === TradeType.SELL) {
           const currentProfitPct = (trade.price - currentPrice) / trade.price;

           // Move to Break Even
           if (currentProfitPct > 0.005 && currentSL > trade.price) {
               newSL = trade.price;
               isTrailing = true;
           }
           // Trailing
           const trailGap = trade.price * 0.005;
           const potentialSL = currentPrice + trailGap;
           if (currentProfitPct > 0.015 && potentialSL < newSL) {
               newSL = potentialSL;
               isTrailing = true;
           }

           if (trade.stopLoss && currentPrice >= newSL) shouldClose = true;
           if (trade.takeProfit && currentPrice <= trade.takeProfit) shouldClose = true;
           if (shouldClose) profit = (trade.price - currentPrice) * trade.amount;
        }

        if (shouldClose) {
          setConfig(prev => ({ ...prev, balance: prev.balance + profit }));
          return { ...trade, status: 'CLOSED', profit, closePrice: currentPrice, closeTime: new Date() };
        }

        // Update SL if trailing changed
        if (newSL !== currentSL) {
            return { ...trade, stopLoss: newSL, isTrailing: true };
        }

        return trade;
      });
    });
  }, [marketData]);

  // AI Analysis & Auto-Trading
  useEffect(() => {
    if (marketData.length < 10) return;

    const performAnalysis = async () => {
      setIsAnalyzing(true);
      const result = await analyzeMarket(marketData, config.balance, config.riskLevel, config.pair);
      setAnalysis(result);
      setIsAnalyzing(false);

      // Auto-Trade Execution with Strict Confidence > 70%
      if (config.isActive && result.confidence > 70) {
        if (result.recommendation === TradeType.BUY || result.recommendation === TradeType.SELL) {
          executeTrade(result.recommendation, result.stopLoss, result.takeProfit);
        }
      }
    };

    const analysisInterval = setInterval(performAnalysis, 5000);
    return () => clearInterval(analysisInterval);
  }, [marketData, config.isActive, config.balance, config.riskLevel, config.pair]);

  const executeTrade = (type: TradeType, sl?: number, tp?: number) => {
    const price = marketData[marketData.length - 1].price;
    const amount = (config.balance * 0.1) / price; // 10% position size

    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: config.pair,
      type,
      price,
      amount: parseFloat(amount.toFixed(4)),
      timestamp: new Date(),
      status: 'OPEN',
      stopLoss: sl,
      takeProfit: tp
    };

    setTrades(prev => [newTrade, ...prev]);
  };

  const initiateManualTrade = (type: TradeType) => {
    // If we have AI analysis, use its suggested SL/TP, otherwise default generic levels
    const price = marketData[marketData.length - 1].price;
    let sl = undefined;
    let tp = undefined;

    if (analysis && analysis.recommendation === type) {
        sl = analysis.stopLoss;
        tp = analysis.takeProfit;
    } else {
        // Fallback generic 1% SL / 2% TP
        if (type === TradeType.BUY) {
            sl = price * 0.99;
            tp = price * 1.02;
        } else {
            sl = price * 1.01;
            tp = price * 0.98;
        }
    }
    executeTrade(type, sl, tp);
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans p-6">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-8 bg-surface p-4 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">NexusTrade AI</h1>
            <p className="text-xs text-gray-400">Institutional Trading Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account Balance</span>
             <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-success" />
                <span className="text-2xl font-mono font-bold">${config.balance.toFixed(2)}</span>
             </div>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Col: Chart & Controls */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <StatsCard label="24h Volume" value="$1.2B" trend="12%" trendUp icon={Activity} />
                <StatsCard label="Win Rate" value="78%" trend="4%" trendUp icon={Bot} color="text-accent" />
                <StatsCard label="Risk Mode" value={config.riskLevel} icon={AlertTriangle} color={config.riskLevel === 'HIGH' ? 'text-danger' : 'text-warning'} />
            </div>

            <ChartPanel data={marketData} pair={config.pair} trades={trades} />

            {/* Manual Trade Controls */}
            <div className="bg-surface p-6 rounded-xl border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Manual Execution</h3>
                    <p className="text-sm text-gray-400">Execute instant trades based on current price.</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => initiateManualTrade(TradeType.BUY)}
                        className="flex-1 md:flex-none px-8 py-4 bg-success hover:bg-green-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-900/20"
                    >
                        BUY MARKET
                    </button>
                    <button 
                        onClick={() => initiateManualTrade(TradeType.SELL)}
                        className="flex-1 md:flex-none px-8 py-4 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20"
                    >
                        SELL MARKET
                    </button>
                </div>
            </div>
        </div>

        {/* Right Col: AI & History */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <BotStatusPanel 
            analysis={analysis} 
            config={config} 
            onToggleActive={() => setConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
            isAnalyzing={isAnalyzing}
          />
          <TradeHistory trades={trades} />
        </div>

      </div>
    </div>
  );
};

export default App;