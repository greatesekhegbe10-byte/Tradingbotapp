import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Wallet, Activity, AlertTriangle, Settings, Power, Link2, Shield } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { AuthPage } from './components/AuthPage';
import { BrokerModal } from './components/BrokerModal';
import { AIChat } from './components/AIChat';
import { MarketDataPoint, Trade, TradeType, AnalysisResult, BotConfig } from './types';
import { generateMarketData, generateInitialHistory } from './services/marketService';
import { analyzeMarket } from './services/geminiService';

const App: React.FC = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);

  // --- App State ---
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Confirmation Modal State
  const [pendingTrade, setPendingTrade] = useState<{ type: TradeType; price: number } | null>(null);

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    riskLevel: 'MEDIUM',
    pair: 'BTC/USD',
    balance: 100000,
    broker: undefined
  });

  const [currentHoldings, setCurrentHoldings] = useState<number>(0);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

  // 1. Initialize Market Data
  useEffect(() => {
    setMarketData(generateInitialHistory(50));
  }, []);

  // 2. Real-time Market Ticker
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = generateMarketData();
        const updated = [...prev, newData];
        if (updated.length > 100) updated.shift();
        return updated;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 3. Trade Monitoring (SL/TP)
  useEffect(() => {
    if (marketData.length === 0) return;
    const currentPrice = marketData[marketData.length - 1].price;

    setTrades(prevTrades => {
        let balanceAdjustment = 0;
        let holdingsAdjustment = 0;
        let hasUpdates = false;

        const updatedTrades = prevTrades.map(trade => {
            if (trade.status !== 'OPEN') return trade;

            let shouldClose = false;
            let profit = 0;

            // Check SL/TP
            if (trade.type === TradeType.BUY) {
                if (trade.stopLoss && currentPrice <= trade.stopLoss) shouldClose = true;
                if (trade.takeProfit && currentPrice >= trade.takeProfit) shouldClose = true;
                if (shouldClose) profit = (currentPrice - trade.price) * trade.amount;
            } else if (trade.type === TradeType.SELL) {
                if (trade.stopLoss && currentPrice >= trade.stopLoss) shouldClose = true;
                if (trade.takeProfit && currentPrice <= trade.takeProfit) shouldClose = true;
                if (shouldClose) profit = (trade.price - currentPrice) * trade.amount;
            }

            if (shouldClose) {
                hasUpdates = true;
                balanceAdjustment += profit + (trade.price * trade.amount); // Return principal + profit (simplified for BUY)
                
                if (trade.type === TradeType.BUY) {
                     balanceAdjustment = (trade.price * trade.amount) + profit;
                     holdingsAdjustment -= trade.amount;
                } else {
                     balanceAdjustment = profit;
                     holdingsAdjustment += trade.amount;
                }
                
                return {
                    ...trade,
                    status: 'CLOSED',
                    profit,
                    closePrice: currentPrice,
                    closeTime: new Date()
                } as Trade;
            }
            return trade;
        });

        if (hasUpdates) {
             setTimeout(() => {
                setConfig(c => ({ ...c, balance: c.balance + balanceAdjustment }));
                setCurrentHoldings(h => h + holdingsAdjustment);
             }, 0);
             return updatedTrades;
        }

        return prevTrades;
    });
  }, [marketData]);

  // 4. Automated Entry Logic
  useEffect(() => {
    if (!config.isActive || !analysis) return;
    const currentPrice = marketData[marketData.length - 1]?.price;
    if (!currentPrice) return;

    const timeSinceAnalysis = new Date().getTime() - analysis.timestamp.getTime();
    if (timeSinceAnalysis > 5000) return;

    // Only trade if we don't have too many open positions (Simple limit)
    const openTrades = trades.filter(t => t.status === 'OPEN').length;
    if (openTrades >= 3) return;

    if (analysis.recommendation === TradeType.BUY && analysis.confidence > 75) {
      executeTrade(TradeType.BUY, currentPrice, analysis.stopLoss, analysis.takeProfit);
    } else if (analysis.recommendation === TradeType.SELL && analysis.confidence > 60) {
      executeTrade(TradeType.SELL, currentPrice, analysis.stopLoss, analysis.takeProfit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, config.isActive]); 

  // --- Handlers ---

  const performAnalysis = useCallback(async () => {
    if (isAnalyzing || marketData.length < 20) return;
    
    setIsAnalyzing(true);
    const result = await analyzeMarket(marketData, config.balance, config.riskLevel);
    setAnalysis(result);
    setIsAnalyzing(false);
  }, [marketData, config.balance, config.riskLevel, isAnalyzing]);

  useEffect(() => {
    if (config.isActive && isAuthenticated) {
      analysisIntervalRef.current = setInterval(() => {
        performAnalysis();
      }, 10000);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [config.isActive, performAnalysis, isAuthenticated]);

  const initiateManualTrade = (type: TradeType) => {
    const currentPrice = marketData[marketData.length - 1]?.price || 0;
    setPendingTrade({ type, price: currentPrice });
  };

  const confirmTrade = () => {
    if (pendingTrade) {
      executeTrade(pendingTrade.type, pendingTrade.price);
      setPendingTrade(null);
    }
  };

  const executeTrade = (type: TradeType, price: number, sl?: number, tp?: number) => {
    // Dynamic Position Sizing
    let riskPct = 0.02; // Low
    if (config.riskLevel === 'MEDIUM') riskPct = 0.05;
    if (config.riskLevel === 'HIGH') riskPct = 0.10;

    const tradeValue = config.balance * riskPct;
    const amount = parseFloat((tradeValue / price).toFixed(6));

    if (amount <= 0) return;

    // Safety check for balance
    if (type === TradeType.BUY && config.balance < tradeValue) return;

    // Default SL/TP if manual
    const stopLoss = sl || (type === TradeType.BUY ? price * 0.98 : price * 1.02);
    const takeProfit = tp || (type === TradeType.BUY ? price * 1.05 : price * 0.95);

    const newTrade: Trade = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      price,
      amount,
      timestamp: new Date(),
      status: 'OPEN',
      stopLoss,
      takeProfit
    };

    setTrades(prev => [newTrade, ...prev]);

    // Deduct balance for BUY (Simulation)
    if (type === TradeType.BUY) {
        setConfig(prev => ({ ...prev, balance: prev.balance - tradeValue }));
        setCurrentHoldings(prev => prev + amount);
    } else {
        // For sell, we just track margin usage in a real app
        setCurrentHoldings(prev => prev - amount);
    }
  };

  const toggleBot = () => {
    setConfig(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  // --- Render ---

  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const currentPrice = marketData[marketData.length - 1]?.price || 0;
  const priceChange = marketData.length > 2 
    ? currentPrice - marketData[marketData.length - 2].price 
    : 0;

  return (
    <div className="min-h-screen bg-background text-gray-200 font-sans pb-12 relative">
      
      <BrokerModal 
        isOpen={isBrokerModalOpen} 
        onClose={() => setIsBrokerModalOpen(false)}
        onConnect={(broker) => setConfig(prev => ({ ...prev, broker }))}
      />

      <AIChat 
        marketContext={`Price: ${currentPrice}, Trend: ${priceChange > 0 ? 'Up' : 'Down'}, Active Trades: ${trades.filter(t => t.status === 'OPEN').length}`} 
      />

      {/* Trade Confirmation Modal */}
      {pendingTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl p-6 transform transition-all scale-100">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full ${pendingTrade.type === TradeType.BUY ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirm Order</h3>
                <p className="text-xs text-gray-400">Manual Execution</p>
              </div>
            </div>
            
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Are you sure you want to open a <span className={`font-bold ${pendingTrade.type === TradeType.BUY ? 'text-success' : 'text-danger'}`}>{pendingTrade.type}</span> position at approximately <span className="text-white font-mono">${pendingTrade.price.toLocaleString()}</span>?
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingTrade(null)}
                className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium transition-colors border border-gray-700"
              >
                Cancel
              </button>
              <button 
                onClick={confirmTrade}
                className={`flex-1 py-2.5 rounded-lg text-white font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  pendingTrade.type === TradeType.BUY 
                    ? 'bg-success hover:bg-green-600 shadow-green-900/20' 
                    : 'bg-danger hover:bg-red-600 shadow-red-900/20'
                }`}
              >
                Confirm {pendingTrade.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-surface/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-lg shadow-primary/20">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">NexusTrade AI</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => setIsBrokerModalOpen(true)}
                className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${config.broker ? 'bg-success/10 border-success/30 text-success' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
              >
                {config.broker ? (
                   <><Link2 className="w-3 h-3" /> Connected: {config.broker}</>
                ) : (
                   <><Power className="w-3 h-3" /> Connect Broker</>
                )}
              </button>

              <div className="h-6 w-px bg-gray-700"></div>
              
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Wallet className="w-4 h-4 text-gray-400" />
                ${config.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Warning / Notifications */}
        {!process.env.API_KEY && (
           <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-200 p-4 rounded-xl mb-8 flex items-center gap-3 animate-fade-in">
             <AlertTriangle className="w-5 h-5" />
             <p className="text-sm">Running in Simulation Mode. Add API Key for real-time Gemini intelligence.</p>
           </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            label="Live Price (BTC)" 
            value={`$${currentPrice.toLocaleString()}`} 
            trend={`${Math.abs(priceChange).toFixed(2)}`}
            trendUp={priceChange >= 0}
            icon={Activity}
            color="text-primary"
          />
          <StatsCard 
            label="Total Equity" 
            value={`$${config.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            trend="1.2%"
            trendUp={true}
            icon={Wallet}
            color="text-success"
          />
          <StatsCard 
            label="Net Exposure" 
            value={`${currentHoldings.toFixed(4)} BTC`} 
            icon={Shield}
            color="text-accent"
          />
           <StatsCard 
            label="Risk Configuration" 
            value={config.riskLevel} 
            icon={Settings}
            color="text-warning"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Chart & History */}
          <div className="lg:col-span-2 space-y-8">
            <ChartPanel data={marketData} />
            <TradeHistory trades={trades} />
          </div>

          {/* Right Column: AI & Controls */}
          <div className="space-y-8">
            <BotStatusPanel 
              analysis={analysis} 
              config={config} 
              onToggleActive={toggleBot}
              isAnalyzing={isAnalyzing}
            />
            
            {/* Manual Controls */}
            <div className="bg-surface p-6 rounded-xl border border-gray-700 shadow-lg">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Manual Execution</h3>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Override AI</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => initiateManualTrade(TradeType.BUY)}
                  className="bg-success hover:bg-green-500 text-white shadow-lg shadow-green-900/20 py-3 rounded-lg font-bold transition-all active:scale-95"
                 >
                   BUY MARKET
                 </button>
                 <button 
                   onClick={() => initiateManualTrade(TradeType.SELL)}
                   className="bg-danger hover:bg-red-500 text-white shadow-lg shadow-red-900/20 py-3 rounded-lg font-bold transition-all active:scale-95"
                  >
                   SELL MARKET
                 </button>
               </div>
               <p className="text-xs text-center text-gray-500 mt-3">
                 Smart SL/TP applied automatically based on risk profile.
               </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;