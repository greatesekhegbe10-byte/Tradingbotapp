import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Wallet, Activity, AlertTriangle, Settings, Power, Link2, Shield, ChevronDown, Menu } from 'lucide-react';
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

const AVAILABLE_PAIRS = [
  'BTC/USD', 'ETH/USD', 'SOL/USD', 
  'XAU/USD', 
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF',
  'NZD/USD', 'EUR/GBP', 'EUR/JPY'
];

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

  // 1. Initialize or Switch Market Data when Pair changes
  useEffect(() => {
    // Generate fresh history for the new pair immediately to avoid empty chart
    setMarketData(generateInitialHistory(50, config.pair));
    setAnalysis(null); // Reset analysis for new pair
  }, [config.pair]);

  // 2. Real-time Market Ticker
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = generateMarketData(config.pair);
        const updated = [...prev, newData];
        if (updated.length > 100) updated.shift();
        return updated;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isAuthenticated, config.pair]);

  // 3. Trade Monitoring (SL/TP) - Runs for ALL open trades
  useEffect(() => {
    if (marketData.length === 0) return;
    const currentPrice = marketData[marketData.length - 1].price;

    setTrades(prevTrades => {
        let balanceAdjustment = 0;
        let holdingsAdjustment = 0;
        let hasUpdates = false;

        const updatedTrades = prevTrades.map(trade => {
            if (trade.status !== 'OPEN') return trade;
            
            // Only process trades for the current pair in this simplified simulation loop
            // In a real app, we would need real-time prices for ALL symbols simultaneously
            if (trade.symbol !== config.pair) return trade;

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
                balanceAdjustment += profit + (trade.price * trade.amount); // Return principal (approx) + profit
                
                // Adjust holdings (simplified)
                if (trade.type === TradeType.BUY) {
                     holdingsAdjustment -= trade.amount;
                } else {
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
             // Defer state update to avoid conflicts during render
             setTimeout(() => {
                setConfig(c => ({ ...c, balance: c.balance + balanceAdjustment }));
                if (Math.abs(holdingsAdjustment) > 0) {
                     setCurrentHoldings(h => h + holdingsAdjustment);
                }
             }, 0);
             return updatedTrades;
        }

        return prevTrades;
    });
  }, [marketData, config.pair]);

  // 4. Automated Entry Logic
  useEffect(() => {
    if (!config.isActive || !analysis) return;
    const currentPrice = marketData[marketData.length - 1]?.price;
    if (!currentPrice) return;

    const timeSinceAnalysis = new Date().getTime() - analysis.timestamp.getTime();
    if (timeSinceAnalysis > 15000) return; // Increased validity window

    // Only trade if we don't have too many open positions on THIS pair
    const openTradesForPair = trades.filter(t => t.status === 'OPEN' && t.symbol === config.pair).length;
    if (openTradesForPair >= 3) return;

    if (analysis.recommendation === TradeType.BUY && analysis.confidence > 75) {
      executeTrade(TradeType.BUY, currentPrice, analysis.stopLoss, analysis.takeProfit);
    } else if (analysis.recommendation === TradeType.SELL && analysis.confidence > 60) {
      executeTrade(TradeType.SELL, currentPrice, analysis.stopLoss, analysis.takeProfit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, config.isActive, config.pair]); 

  // --- Handlers ---

  const performAnalysis = useCallback(async () => {
    if (isAnalyzing || marketData.length < 20) return;
    
    setIsAnalyzing(true);
    const result = await analyzeMarket(marketData, config.balance, config.riskLevel, config.pair);
    setAnalysis(result);
    setIsAnalyzing(false);
  }, [marketData, config.balance, config.riskLevel, config.pair, isAnalyzing]);

  useEffect(() => {
    if (config.isActive && isAuthenticated) {
      // Trigger immediately on start
      performAnalysis();
      analysisIntervalRef.current = setInterval(() => {
        performAnalysis();
      }, 10000);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [config.isActive, isAuthenticated, config.pair]);

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
      symbol: config.pair,
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
        marketContext={`Pair: ${config.pair}, Price: ${currentPrice}, Trend: ${priceChange > 0 ? 'Up' : 'Down'}, Active Trades: ${trades.filter(t => t.status === 'OPEN').length}`} 
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
                <p className="text-xs text-gray-400">Manual Execution • {config.pair}</p>
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
              <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-lg shadow-primary/20 shrink-0">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold tracking-tight text-white hidden sm:block">NexusTrade AI</span>
              <span className="text-lg font-bold tracking-tight text-white block sm:hidden">Nexus</span>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              
              {/* Pair Selector */}
              <div className="relative group">
                <button className="flex items-center gap-2 bg-gray-800/80 hover:bg-gray-700 border border-gray-700 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white transition-colors">
                  {config.pair} <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-0 mt-2 w-48 bg-surface border border-gray-700 rounded-lg shadow-xl overflow-y-auto max-h-64 hidden group-hover:block z-50">
                  {AVAILABLE_PAIRS.map(pair => (
                    <button 
                      key={pair}
                      onClick={() => setConfig(prev => ({ ...prev, pair }))}
                      className={`w-full text-left px-4 py-3 text-sm border-b border-gray-700/50 hover:bg-gray-800 ${config.pair === pair ? 'text-primary font-bold bg-primary/10' : 'text-gray-300'}`}
                    >
                      {pair}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-6 w-px bg-gray-700"></div>

              <button 
                onClick={() => setIsBrokerModalOpen(true)}
                className={`flex items-center gap-2 text-xs font-medium px-2 sm:px-3 py-1.5 rounded-full border transition-all ${config.broker ? 'bg-success/10 border-success/30 text-success' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
              >
                {config.broker ? (
                   <><Link2 className="w-3 h-3" /> <span className="hidden sm:inline">Connected</span></>
                ) : (
                   <><Power className="w-3 h-3" /> <span className="hidden sm:inline">Connect</span></>
                )}
              </button>
              
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium text-white">
                <Wallet className="w-4 h-4 text-gray-400" />
                <span>${(config.balance / 1000).toFixed(1)}k</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
        
        {/* Warning / Notifications */}
        {!process.env.API_KEY && (
           <div className="bg-yellow-900/20 border border-yellow-700/50 text-yellow-200 p-4 rounded-xl mb-8 flex items-center gap-3 animate-fade-in">
             <AlertTriangle className="w-5 h-5 flex-shrink-0" />
             <p className="text-sm">Running in Simulation Mode. Add API Key for real-time Gemini intelligence.</p>
           </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            label={`Live Price`} 
            value={`$${currentPrice.toLocaleString()}`} 
            trend={`${Math.abs(priceChange).toFixed(4)}`}
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
            value={`${currentHoldings.toFixed(4)}`} 
            icon={Shield}
            color="text-accent"
          />
           <StatsCard 
            label="Risk Config" 
            value={config.riskLevel} 
            icon={Settings}
            color="text-warning"
          />
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Chart & History */}
          <div className="lg:col-span-2 space-y-8 min-w-0">
            <ChartPanel data={marketData} pair={config.pair} trades={trades} />
            <TradeHistory trades={trades} />
          </div>

          {/* Right Column: AI & Controls */}
          <div className="space-y-8 min-w-0">
            <BotStatusPanel 
              analysis={analysis} 
              config={config} 
              onToggleActive={toggleBot}
              isAnalyzing={isAnalyzing}
            />
            
            {/* Manual Controls */}
            <div className="bg-surface p-6 rounded-xl border border-gray-700">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                   <Activity className="w-5 h-5 text-primary" /> Manual Execution
                </h3>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                        onClick={() => initiateManualTrade(TradeType.BUY)}
                        className="py-3 bg-success hover:bg-green-600 text-white rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-green-900/20 text-sm sm:text-base"
                   >
                        BUY MARKET
                   </button>
                   <button 
                        onClick={() => initiateManualTrade(TradeType.SELL)}
                        className="py-3 bg-danger hover:bg-red-600 text-white rounded-lg font-bold transition-all active:scale-95 shadow-lg shadow-red-900/20 text-sm sm:text-base"
                   >
                        SELL MARKET
                   </button>
                </div>
                
                {/* Risk Settings */}
                <div className="mt-6 pt-6 border-t border-gray-700">
                    <h4 className="text-gray-400 text-sm font-medium mb-3">Risk Configuration</h4>
                    <div className="flex bg-gray-900 rounded-lg p-1">
                        {['LOW', 'MEDIUM', 'HIGH'].map(level => (
                            <button 
                                key={level}
                                onClick={() => setConfig(prev => ({...prev, riskLevel: level as any}))}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${config.riskLevel === level ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;