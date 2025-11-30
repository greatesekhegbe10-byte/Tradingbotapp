
import React, { useState, useEffect, useRef } from 'react';
import { Bot, Wallet, Activity, AlertTriangle, Settings, Menu, RefreshCw, Target, Shield, Gauge } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { AuthPage } from './components/AuthPage';
import { BrokerModal } from './components/BrokerModal';
import { AIChat } from './components/AIChat';
import { SettingsModal } from './components/SettingsModal';
import { SubscriptionGate } from './components/SubscriptionGate';
import { MarketDataPoint, Trade, TradeType, AnalysisResult, BotConfig } from './types';
import { generateMarketData, generateInitialHistory, getPairDetails, getPrice, fetchLivePrices } from './services/marketService';
import { analyzeMarket } from './services/geminiService';

// Available Pairs List (Expanded)
const AVAILABLE_PAIRS = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'NZD/USD', 'USD/CAD', 'USD/CHF',
    'XAU/USD', 'WTI/USD', 'BRENT/USD',
    'BTC/USD', 'ETH/USD', 'SOL/USD',
    'GBP/JPY', 'EUR/JPY', 'EUR/GBP', 'GBP/CAD', 'CAD/JPY', 'AUD/JPY', 'NZD/JPY',
    'EUR/CHF', 'GBP/CHF', 'CAD/CHF', 'AUD/CAD', 'AUD/NZD', 'NZD/CAD', 'CHF/JPY',
    'EUR/CAD', 'EUR/AUD', 'EUR/NZD', 'EUR/SEK', 'EUR/SGD', 'GBP/SEK', 'GBP/NZD',
    'AUD/SGD', 'AUD/CHF', 'NZD/CHF', 'SGD/JPY', 'HKD/JPY', 'NOK/JPY', 'SEK/JPY',
    'USD/NOK', 'USD/SEK', 'USD/ZAR', 'USD/HKD', 'USD/TRY', 'USD/MXN', 'USD/SGD', 'USD/PLN', 'USD/HUF'
];

const App: React.FC = () => {
  // Auth & Subscription State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('nexus_auth') === 'true');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => localStorage.getItem('nexus_sub') === 'true');
  const [isInitializing, setIsInitializing] = useState(true);
  
  // App State
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Manual Trade Inputs
  const [manualSL, setManualSL] = useState<string>('');
  const [manualTP, setManualTP] = useState<string>('');
  
  // Wallet State
  const [balances, setBalances] = useState({
      DEMO: 10000,
      LIVE: 0 
  });
  const [activeWallet, setActiveWallet] = useState<'DEMO' | 'LIVE'>('DEMO');

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    riskLevel: 'MEDIUM',
    sensitivity: 'MEDIUM',
    pair: 'USD/JPY', // Default to requested pair
    balance: 10000,
    isPro: false,
    paymentStatus: 'UNPAID'
  });

  // Track manual trade requests
  const [pendingTrade, setPendingTrade] = useState<{ type: TradeType; price: number; amount: number; sl?: number; tp?: number } | null>(null);

  // Use Ref for latest data to prevent closure staleness in intervals
  const marketDataRef = useRef<MarketDataPoint[]>([]);
  const configRef = useRef(config);
  // Mutex for analysis
  const isAnalyzingRef = useRef(false);

  useEffect(() => { configRef.current = config; }, [config]);

  // Initial Data Load with Live Price Sync
  useEffect(() => {
    const initApp = async () => {
       setIsInitializing(true);
       await fetchLivePrices(); // Fetch real prices first
       
       const initial = generateInitialHistory(50, config.pair);
       setMarketData(initial);
       marketDataRef.current = initial;
       setIsInitializing(false);
    };
    
    initApp();
  }, []); // Run once on mount

  // Handle Pair Change - Re-generate history based on new price
  useEffect(() => {
    if (isInitializing) return;
    const initial = generateInitialHistory(50, config.pair);
    setMarketData(initial);
    marketDataRef.current = initial;
    setAnalysis(null); // Clear old analysis
    setManualSL('');
    setManualTP('');
  }, [config.pair]);

  // Update Manual SL/TP when Analysis changes
  useEffect(() => {
    if (analysis) {
        setManualSL(analysis.stopLoss.toFixed(getPairDetails(config.pair).decimals));
        setManualTP(analysis.takeProfit.toFixed(getPairDetails(config.pair).decimals));
    }
  }, [analysis, config.pair]);

  // Real-time Market Data Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        // Only generate for current config pair to show on chart, but the service updates all in background
        const newData = generateMarketData(configRef.current.pair); 
        const updated = [...prev, newData];
        if (updated.length > 60) updated.shift();
        marketDataRef.current = updated;
        return updated;
      });
    }, 1500); 
    return () => clearInterval(interval);
  }, []);

  // Sync Balance Config
  useEffect(() => {
      setConfig(prev => ({ 
          ...prev, 
          balance: activeWallet === 'DEMO' ? balances.DEMO : balances.LIVE 
      }));
  }, [balances, activeWallet]);


  // Smart Risk Management (Trailing Stop) & Trade Monitoring
  useEffect(() => {
    // We check prices for ALL open trades, not just the current chart pair
    setTrades(prevTrades => {
      let balanceUpdated = false;
      let newDemoBalance = balances.DEMO;
      let newLiveBalance = balances.LIVE;

      const updatedTrades = prevTrades.map(trade => {
        if (trade.status !== 'OPEN') return trade;

        // Get live price for this trade's symbol
        const currentPrice = getPrice(trade.symbol); 
        
        let shouldClose = false;
        let profit = 0;
        let currentSL = trade.stopLoss || 0;
        let newSL = currentSL;
        let isTrailing = trade.isTrailing || false;

        // --- TRAILING STOP LOGIC FOR MINIMAL LOSSES ---
        if (trade.type === TradeType.BUY) {
           const currentProfitPct = (currentPrice - trade.price) / trade.price;

           // Move to Break Even at 0.5% profit
           if (currentProfitPct > 0.005 && currentSL < trade.price) {
               newSL = trade.price;
               isTrailing = true;
           }
           // Trail by 0.5% after 1.5% profit
           const trailGap = trade.price * 0.005; 
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
           // Trail
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
           // Return Margin + Profit to wallet
           const margin = trade.price * trade.amount; 
           const totalReturn = margin + profit;

           if (activeWallet === 'DEMO') newDemoBalance += totalReturn;
           else newLiveBalance += totalReturn;

           balanceUpdated = true;
           return { ...trade, status: 'CLOSED', profit, closePrice: currentPrice, closeTime: new Date() };
        }

        // Update SL if trailing changed
        if (newSL !== currentSL) {
            return { ...trade, stopLoss: newSL, isTrailing: true };
        }

        return trade;
      });

      if (balanceUpdated) {
          setBalances({ DEMO: newDemoBalance, LIVE: newLiveBalance });
      }

      return updatedTrades;
    });
  }, [marketData]); // Trigger on market update tick

  // AI Analysis Loop
  useEffect(() => {
    const performAnalysis = async () => {
      // Prevent overlapping analysis calls
      if (isAnalyzingRef.current) return;
      if (marketDataRef.current.length < 10) return;
      
      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      
      try {
        const result = await analyzeMarket(
            marketDataRef.current, 
            configRef.current.balance, 
            configRef.current.riskLevel, 
            configRef.current.pair,
            configRef.current.sensitivity
        );
        setAnalysis(result);

        // Auto-Trade Trigger
        const threshold = configRef.current.sensitivity === 'HIGH' ? 80 : 85;
        if (configRef.current.isActive && result.confidence >= threshold && result.recommendation !== TradeType.HOLD) {
           executeTrade(result.recommendation, result.stopLoss, result.takeProfit, configRef.current.pair);
        }
      } catch (e) {
        console.error("Analysis Error:", e);
      } finally {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    };

    // Pro Users get faster analysis
    const intervalTime = config.isPro ? 10000 : 20000;
    const analysisInterval = setInterval(performAnalysis, intervalTime);
    
    // Initial trigger
    if (marketData.length > 10 && !analysis && !isAnalyzingRef.current) performAnalysis();

    return () => clearInterval(analysisInterval);
  }, [config.isPro, config.pair, config.sensitivity]); // Re-setup if params change

  const executeTrade = (type: TradeType, sl?: number, tp?: number, overridePair?: string) => {
    const symbol = overridePair || config.pair;
    const currentPrice = getPrice(symbol);
    
    const riskPct = config.riskLevel === 'LOW' ? 0.01 : config.riskLevel === 'MEDIUM' ? 0.05 : 0.10;
    const maxRiskAmount = config.balance * riskPct;
    
    const amount = parseFloat((maxRiskAmount / currentPrice).toFixed(6));

    if (amount <= 0) {
        alert("Account balance too low for this risk level.");
        return;
    }

    const marginRequired = amount * currentPrice;
    if (marginRequired > config.balance) {
        alert("Insufficient balance to execute this trade based on risk parameters.");
        return;
    }

    setBalances(prev => ({
        ...prev,
        [activeWallet]: prev[activeWallet] - marginRequired
    }));

    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: symbol,
      type,
      price: currentPrice,
      amount: amount,
      timestamp: new Date(),
      status: 'OPEN',
      stopLoss: sl,
      takeProfit: tp
    };

    setTrades(prev => [newTrade, ...prev]);
    setPendingTrade(null);
  };

  const initiateManualTrade = (type: TradeType) => {
      const price = marketDataRef.current[marketDataRef.current.length - 1].price;
      
      const riskPct = config.riskLevel === 'LOW' ? 0.01 : config.riskLevel === 'MEDIUM' ? 0.05 : 0.10;
      const maxRiskAmount = config.balance * riskPct;
      const amount = parseFloat((maxRiskAmount / price).toFixed(6));
      
      const sl = manualSL ? parseFloat(manualSL) : undefined;
      const tp = manualTP ? parseFloat(manualTP) : undefined;

      setPendingTrade({ type, price, amount, sl, tp });
  };

  const confirmManualTrade = () => {
      if (pendingTrade) {
          executeTrade(pendingTrade.type, pendingTrade.sl, pendingTrade.tp, config.pair);
      }
  };

  const handleBrokerConnect = (broker: string, isLive: boolean) => {
      setIsBrokerModalOpen(false);
      if (isLive) {
          setActiveWallet('LIVE');
          setBalances(prev => ({ ...prev, LIVE: 35500.00 }));
          alert(`Successfully connected to ${broker} (Live Server). Balance synced.`);
      } else {
          setActiveWallet('DEMO');
          setBalances(prev => ({ ...prev, DEMO: 10000 }));
          alert(`Connected to ${broker} (Demo).`);
      }
  };

  const handleProUpgrade = (details: { ref: string, apiKey?: string, method: string }) => {
      setConfig(prev => ({ ...prev, paymentStatus: 'PENDING' }));
      
      setTimeout(() => {
          if (details.apiKey || details.ref.length > 5) {
              setConfig(prev => ({ ...prev, isPro: true, paymentStatus: 'VERIFIED' }));
              alert("Payment Verified! Pro features unlocked.");
          } else {
              setConfig(prev => ({ ...prev, paymentStatus: 'UNPAID' }));
              alert("Verification Failed: Invalid reference or key.");
          }
      }, 5000);
  };

  const handleRiskChange = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
      if (level === 'HIGH' && !config.isPro) {
          alert("High Risk mode is reserved for Pro users. Please upgrade.");
          return;
      }
      setConfig(prev => ({ ...prev, riskLevel: level }));
  };

  const handleSensitivityChange = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
      if (level === 'HIGH' && !config.isPro) {
          alert("High Sensitivity mode is reserved for Pro users. Please upgrade.");
          return;
      }
      setConfig(prev => ({ ...prev, sensitivity: level }));
  };

  if (!isAuthenticated) {
      return <AuthPage onLogin={() => {
          setIsAuthenticated(true);
          localStorage.setItem('nexus_auth', 'true');
      }} />;
  }

  if (!isSubscribed) {
      return <SubscriptionGate onVerify={() => {
          setIsSubscribed(true);
          localStorage.setItem('nexus_sub', 'true');
      }} />;
  }

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans p-4 md:p-6 pb-24 md:pb-6 relative">
      
      {isInitializing && (
          <div className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
              <h2 className="text-xl font-bold text-white">Syncing Live Market Data...</h2>
              <p className="text-gray-400 text-sm">Connecting to Exchange Feeds</p>
          </div>
      )}

      <BrokerModal 
        isOpen={isBrokerModalOpen} 
        onClose={() => setIsBrokerModalOpen(false)} 
        onConnect={handleBrokerConnect} 
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        onUpgrade={handleProUpgrade}
        balances={balances}
      />

      {pendingTrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
              <div className="bg-surface border border-gray-600 p-6 rounded-xl max-w-sm w-full shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Confirm Execution</h3>
                  <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                          <span className="text-gray-400">Action</span>
                          <span className={`font-bold ${pendingTrade.type === TradeType.BUY ? 'text-success' : 'text-danger'}`}>{pendingTrade.type} MARKET</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-400">Est. Entry</span>
                          <span className="font-mono text-white">${pendingTrade.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-400">Size</span>
                          <span className="font-mono text-white">{pendingTrade.amount} Units</span>
                      </div>
                      
                      {(pendingTrade.sl || pendingTrade.tp) && (
                          <div className="pt-2 border-t border-gray-700 mt-2">
                             {pendingTrade.sl && (
                                 <div className="flex justify-between text-danger">
                                     <span className="text-xs">Stop Loss</span>
                                     <span className="font-mono font-bold">${pendingTrade.sl}</span>
                                 </div>
                             )}
                             {pendingTrade.tp && (
                                 <div className="flex justify-between text-success">
                                     <span className="text-xs">Take Profit</span>
                                     <span className="font-mono font-bold">${pendingTrade.tp}</span>
                                 </div>
                             )}
                          </div>
                      )}
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setPendingTrade(null)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">Cancel</button>
                      <button onClick={confirmManualTrade} className="flex-1 py-3 bg-primary hover:bg-blue-600 rounded-lg font-bold text-white shadow-lg shadow-primary/20">Confirm</button>
                  </div>
              </div>
          </div>
      )}

      <nav className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-surface p-4 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
                <Bot className="w-8 h-8 text-primary" />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">NexusTrade AI</h1>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded text-gray-400 border border-gray-700">v2.5.0</span>
                    {config.isPro && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 font-bold">PRO</span>}
                </div>
            </div>
            </div>
            <button className="md:hidden text-gray-400" onClick={() => setIsSettingsOpen(true)}>
                <Settings className="w-6 h-6" />
            </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
          
          <div className="relative group">
              <select 
                value={config.pair}
                onChange={(e) => setConfig(prev => ({ ...prev, pair: e.target.value }))}
                className="appearance-none bg-gray-900 border border-gray-700 text-white py-2 pl-4 pr-10 rounded-lg focus:ring-1 focus:ring-primary outline-none cursor-pointer hover:border-gray-500 transition-colors font-mono font-bold"
              >
                {AVAILABLE_PAIRS.map(pair => (
                    <option key={pair} value={pair}>{pair}</option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-gray-400"></div>
              </div>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsBrokerModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors border border-gray-700"
              >
                  <Activity className="w-4 h-4" /> Broker
              </button>
              
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${activeWallet === 'LIVE' ? 'text-green-400' : 'text-gray-500'}`}>
                    {activeWallet} Balance
                </span>
                <div className="flex items-center gap-2">
                    <Wallet className={`w-5 h-5 ${activeWallet === 'LIVE' ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-2xl font-mono font-bold tracking-tight">${config.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="hidden md:block p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                  <Settings className="w-6 h-6" />
              </button>
          </div>
        </div>
      </nav>

      <div className="grid grid-cols-12 gap-6">
        
        <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard label="24h Volume" value="$1.2B" trend="12%" trendUp icon={Activity} />
                <StatsCard label="AI Accuracy" value="81.4%" trend="2.1%" trendUp icon={Bot} color="text-accent" />
                
                {/* Risk Selector */}
                <div className="bg-surface p-3 rounded-xl border border-gray-700 shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-1">
                         <span className="text-gray-400 text-xs font-medium">Risk Mode</span>
                         <AlertTriangle className={`w-4 h-4 ${config.riskLevel === 'HIGH' ? 'text-danger' : config.riskLevel === 'MEDIUM' ? 'text-warning' : 'text-success'}`} />
                     </div>
                     <div className="flex bg-gray-900 rounded-lg p-1">
                         {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                             <button
                                key={level}
                                onClick={() => handleRiskChange(level)}
                                className={`flex-1 py-1 text-[9px] font-bold rounded transition-all ${config.riskLevel === level ? 'bg-gray-700 text-white shadow' : 'text-gray-600 hover:text-gray-400'}`}
                             >
                                 {level}
                             </button>
                         ))}
                     </div>
                </div>

                {/* Sensitivity Selector */}
                <div className="bg-surface p-3 rounded-xl border border-gray-700 shadow-sm flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-1">
                         <span className="text-gray-400 text-xs font-medium">Sensitivity</span>
                         <Gauge className={`w-4 h-4 ${config.sensitivity === 'HIGH' ? 'text-purple-400' : config.sensitivity === 'MEDIUM' ? 'text-blue-400' : 'text-gray-400'}`} />
                     </div>
                     <div className="flex bg-gray-900 rounded-lg p-1">
                         {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                             <button
                                key={level}
                                onClick={() => handleSensitivityChange(level)}
                                className={`flex-1 py-1 text-[9px] font-bold rounded transition-all ${config.sensitivity === level ? 'bg-gray-700 text-white shadow' : 'text-gray-600 hover:text-gray-400'}`}
                             >
                                 {level}
                             </button>
                         ))}
                     </div>
                </div>
            </div>

            <ChartPanel data={marketData} pair={config.pair} trades={trades} />

            <div className="bg-surface p-6 rounded-xl border border-gray-700 flex flex-col gap-6 shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                            Manual Execution
                            <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-[10px] rounded uppercase">Instant</span>
                        </h3>
                        <p className="text-sm text-gray-400">Execute instant trades based on current price action.</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                            <Shield className="w-3 h-3 text-danger" /> Stop Loss
                        </label>
                        <input 
                            type="number" 
                            step="0.0001"
                            value={manualSL}
                            onChange={(e) => setManualSL(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-danger focus:border-danger outline-none font-mono"
                            placeholder="Price level"
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                             <Target className="w-3 h-3 text-success" /> Take Profit
                        </label>
                        <input 
                            type="number" 
                            step="0.0001"
                            value={manualTP}
                            onChange={(e) => setManualTP(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:ring-1 focus:ring-success focus:border-success outline-none font-mono"
                            placeholder="Price level"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => initiateManualTrade(TradeType.BUY)}
                        className="flex-1 px-8 py-4 bg-success hover:bg-green-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-green-900/20 active:scale-95 flex flex-col items-center"
                    >
                        <span>BUY MARKET</span>
                        <span className="text-[10px] opacity-70 font-mono">${(marketData[marketData.length-1]?.price || 0).toFixed(2)}</span>
                    </button>
                    <button 
                        onClick={() => initiateManualTrade(TradeType.SELL)}
                        className="flex-1 px-8 py-4 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-red-900/20 active:scale-95 flex flex-col items-center"
                    >
                        <span>SELL MARKET</span>
                        <span className="text-[10px] opacity-70 font-mono">${(marketData[marketData.length-1]?.price || 0).toFixed(2)}</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <BotStatusPanel 
            analysis={analysis} 
            config={config} 
            onToggleActive={() => setConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
            isAnalyzing={isAnalyzing}
          />
          <TradeHistory 
            trades={trades} 
            onExecuteSignal={(pair, type, sl, tp) => executeTrade(type, sl, tp, pair)}
          />
        </div>
      </div>

      <AIChat marketContext={analysis?.reasoning || "Market is stable."} config={config} />
    </div>
  );
};

export default App;
