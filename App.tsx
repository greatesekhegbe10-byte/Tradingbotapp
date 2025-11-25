import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Wallet, Activity, AlertTriangle, Settings, Power, Link2, Shield, ChevronDown, Menu, Crown, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { AuthPage } from './components/AuthPage';
import { BrokerModal } from './components/BrokerModal';
import { UpgradeModal } from './components/UpgradeModal';
import { AIChat } from './components/AIChat';
import { MarketDataPoint, Trade, TradeType, AnalysisResult, BotConfig } from './types';
import { generateMarketData, generateInitialHistory, getPrice } from './services/marketService';
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
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // --- App State ---
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'pending' | 'error'} | null>(null);
  
  // Confirmation Modal State
  const [pendingTrade, setPendingTrade] = useState<{ type: TradeType; price: number } | null>(null);

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    riskLevel: 'MEDIUM',
    pair: 'BTC/USD',
    balance: 100000,
    broker: undefined,
    isPro: false, // Default to free plan
    paymentStatus: 'UNPAID'
  });

  // Track if payment was verified via API Key (simulated)
  const [isApiVerification, setIsApiVerification] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'local' | 'foreign' | null>(null);

  const [currentHoldings, setCurrentHoldings] = useState<number>(0);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

  // Handle Payment Verification Simulation
  useEffect(() => {
    if (config.paymentStatus === 'PENDING') {
      // If API key was provided, verify faster (3s) vs manual (8s)
      const delay = isApiVerification ? 3000 : 8000;
      const bankName = paymentMethod === 'local' ? 'Kuda Bank' : 'Grey';
      
      const timer = setTimeout(() => {
        setConfig(prev => ({
          ...prev,
          paymentStatus: 'VERIFIED',
          isPro: true
        }));
        setNotification({
          message: isApiVerification 
            ? `${bankName} API Confirmed Payment! Pro features unlocked.` 
            : `Payment Verified by ${bankName}! Pro features unlocked.`,
          type: 'success'
        });
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [config.paymentStatus, isApiVerification, paymentMethod]);

  // Notification Timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
        // generateMarketData now updates ALL pairs internally
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
    // We check SL/TP on every tick of market data updates
    if (marketData.length === 0) return;

    setTrades(prevTrades => {
        let balanceAdjustment = 0;
        let holdingsAdjustment = 0;
        let hasUpdates = false;

        const updatedTrades = prevTrades.map(trade => {
            if (trade.status !== 'OPEN') return trade;
            
            // Get the current REAL-TIME price for this trade's symbol
            // This ensures trades on background pairs are monitored correctly
            const livePrice = getPrice(trade.symbol);

            let shouldClose = false;
            let profit = 0;

            // Check SL/TP
            if (trade.type === TradeType.BUY) {
                if (trade.stopLoss && livePrice <= trade.stopLoss) shouldClose = true;
                if (trade.takeProfit && livePrice >= trade.takeProfit) shouldClose = true;
                if (shouldClose) profit = (livePrice - trade.price) * trade.amount;
            } else if (trade.type === TradeType.SELL) {
                if (trade.stopLoss && livePrice >= trade.stopLoss) shouldClose = true;
                if (trade.takeProfit && livePrice <= trade.takeProfit) shouldClose = true;
                if (shouldClose) profit = (trade.price - livePrice) * trade.amount;
            }

            if (shouldClose) {
                hasUpdates = true;
                
                // Return Logic:
                // We deducted (trade.price * trade.amount) as margin when opening.
                // We now return Margin + Profit (or Margin - Loss).
                // trade.amount was calculated based on entry price, so Margin ~= EntryPrice * Amount.
                const initialMargin = trade.price * trade.amount;
                balanceAdjustment += initialMargin + profit;
                
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
                    closePrice: livePrice,
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
                setNotification({ message: 'Trade Closed - Balance Updated', type: 'success' });
             }, 0);
             return updatedTrades;
        }

        return prevTrades;
    });
  }, [marketData]); // Run whenever market data updates (which is every tick)

  // 4. Automated Entry Logic
  useEffect(() => {
    if (!config.isActive || !analysis) return;
    const currentPrice = marketData[marketData.length - 1]?.price;
    if (!currentPrice) return;

    const timeSinceAnalysis = new Date().getTime() - analysis.timestamp.getTime();
    if (timeSinceAnalysis > 15000) return; // Increased validity window

    // Only trade if we don't have too many open positions on THIS pair
    const openTradesForPair = trades.filter(t => t.status === 'OPEN' && t.symbol === config.pair).length;
    
    // Pro users get more concurrent trades
    const maxTrades = config.isPro ? 10 : 3;
    if (openTradesForPair >= maxTrades) return;

    if (analysis.recommendation === TradeType.BUY && analysis.confidence > 75) {
      executeTrade(TradeType.BUY, currentPrice, analysis.stopLoss, analysis.takeProfit);
    } else if (analysis.recommendation === TradeType.SELL && analysis.confidence > 60) {
      executeTrade(TradeType.SELL, currentPrice, analysis.stopLoss, analysis.takeProfit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, config.isActive, config.pair, config.isPro]); 

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
      
      // Pro users get faster analysis
      const intervalMs = config.isPro ? 5000 : 10000;
      
      analysisIntervalRef.current = setInterval(() => {
        performAnalysis();
      }, intervalMs);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    };
  }, [config.isActive, isAuthenticated, config.pair, config.isPro]);

  const initiateManualTrade = (type: TradeType) => {
    const currentPrice = marketData[marketData.length - 1]?.price || 0;
    setPendingTrade({ type, price: currentPrice });
  };

  const confirmTrade = () => {
    if (pendingTrade) {
      // Execute at current market price, not the price when modal opened (slippage/realism)
      const executionPrice = getPrice(config.pair);
      executeTrade(pendingTrade.type, executionPrice);
      setPendingTrade(null);
    }
  };

  const executeTrade = (type: TradeType, price: number, sl?: number, tp?: number) => {
    // Dynamic Position Sizing
    let riskPct = 0.02; // Low
    if (config.riskLevel === 'MEDIUM') riskPct = 0.05;
    if (config.riskLevel === 'HIGH') riskPct = 0.10;

    const tradeValue = config.balance * riskPct;
    // Calculate amount, ensuring it's not too small for expensive assets like BTC
    const amount = parseFloat((tradeValue / price).toFixed(6));

    if (amount <= 0) return;

    // Safety check for balance - applied to BOTH Buy and Sell as Margin
    if (config.balance < tradeValue) {
        setNotification({ message: 'Insufficient balance for trade margin', type: 'error' });
        return;
    }

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

    // Deduct balance for BOTH Buy and Sell (Margin Lock)
    // We treat 'tradeValue' as the margin requirement for the position
    setConfig(prev => ({ ...prev, balance: prev.balance - tradeValue }));
    
    // Update holdings
    if (type === TradeType.BUY) {
        setCurrentHoldings(prev => prev + amount); // Positive exposure
    } else {
        setCurrentHoldings(prev => prev - amount); // Negative exposure (Short)
    }
  };

  const toggleBot = () => {
    setConfig(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const handleProUpgrade = (details: { ref: string; apiKey?: string; method: 'local' | 'foreign' }) => {
    setConfig(prev => ({
      ...prev,
      paymentStatus: 'PENDING'
    }));
    
    const hasKey = !!details.apiKey && details.apiKey.length > 5;
    setIsApiVerification(hasKey);
    setPaymentMethod(details.method);

    const bankName = details.method === 'local' ? 'Kuda Bank' : 'Grey';

    setNotification({
      message: hasKey 
        ? `Connecting to ${bankName} API with Key... Verifying...`
        : `Transaction submitted. Verifying with ${bankName}...`,
      type: 'pending'
    });
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
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in border ${
          notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-white' : 
          notification.type === 'pending' ? 'bg-blue-900/90 border-blue-500 text-white' : 
          'bg-red-900/90 border-red-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'pending' && <Loader2 className="w-5 h-5 animate-spin" />}
          {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

      <BrokerModal 
        isOpen={isBrokerModalOpen} 
        onClose={() => setIsBrokerModalOpen(false)}
        onConnect={(broker) => setConfig(prev => ({ ...prev, broker }))}
      />
      
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onUpgrade={handleProUpgrade}
      />

      {/* AI Chat now receives full config to enforce Access Control */}
      <AIChat 
        marketContext={`Pair: ${config.pair}, Price: ${currentPrice}, Trend: ${priceChange > 0 ? 'Up' : 'Down'}, Active Trades: ${trades.filter(t => t.status === 'OPEN').length}`} 
        config={config}
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
              {config.isPro && <span className="px-2 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold ml-1">PRO</span>}
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6">
              
              {!config.isPro && config.paymentStatus !== 'PENDING' && (
                  <button 
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-yellow-900/20 animate-pulse"
                  >
                    <Crown className="w-3 h-3" /> UPGRADE
                  </button>
              )}
              
              {config.paymentStatus === 'PENDING' && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
                    <Loader2 className="w-3 h-3 animate-spin" /> {isApiVerification ? 'API CHECK' : 'VERIFYING'}
                  </div>
              )}

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
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button 
                    onClick={() => initiateManualTrade(TradeType.BUY)}
                    className="py-3 bg-success hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    BUY MARKET
                  </button>
                  <button 
                    onClick={() => initiateManualTrade(TradeType.SELL)}
                    className="py-3 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    SELL MARKET
                  </button>
                </div>

                <div className="h-px bg-gray-700/50 mb-6"></div>

                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                   <Settings className="w-5 h-5 text-warning" /> Risk Management
                </h3>
                
                <div className="grid grid-cols-3 gap-2 bg-gray-900/50 p-1 rounded-lg border border-gray-700">
                  {['LOW', 'MEDIUM', 'HIGH'].map((level) => {
                    const isHigh = level === 'HIGH';
                    const isLocked = isHigh && !config.isPro;
                    
                    return (
                      <button
                        key={level}
                        onClick={() => {
                          if (isLocked) {
                            if (config.paymentStatus === 'PENDING') {
                                setNotification({ message: 'Pro Verification in progress...', type: 'pending'});
                            } else {
                                setIsUpgradeModalOpen(true);
                            }
                            return;
                          }
                          setConfig(c => ({ ...c, riskLevel: level as any }));
                        }}
                        className={`py-2 text-xs font-bold rounded relative overflow-hidden transition-all ${
                          config.riskLevel === level 
                            ? 'bg-gray-700 text-white shadow' 
                            : 'text-gray-500 hover:text-gray-300'
                        } ${isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {level}
                        {isLocked && (
                          <div className="absolute top-1 right-1">
                            <Lock className="w-3 h-3 text-yellow-500" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {!config.isPro && (
                  <p className="text-[10px] text-gray-500 mt-2 text-center">
                    {config.paymentStatus === 'PENDING' ? (
                       <span className="text-blue-400">Verifying payment for Pro Access...</span>
                    ) : (
                       <span className="text-yellow-500">PRO TIP: Upgrade to unlock High Risk strategies.</span>
                    )}
                  </p>
                )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;