
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Wallet, Activity, AlertTriangle, Settings, Power, Link2, Shield, ChevronDown, Menu, Crown, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { AuthPage } from './components/AuthPage';
import { BrokerModal } from './components/BrokerModal';
import { SettingsModal } from './components/SettingsModal';
import { AIChat } from './components/AIChat';
import { SubscriptionGate } from './components/SubscriptionGate';
import { MarketDataPoint, Trade, TradeType, AnalysisResult, BotConfig } from './types';
import { generateMarketData, generateInitialHistory, getPrice, getPairDetails } from './services/marketService';
import { analyzeMarket } from './services/geminiService';

const AVAILABLE_PAIRS = [
  'BTC/USD', 'ETH/USD', 'SOL/USD', 
  'XAU/USD', 'WTI/USD', 'BRENT/USD',
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF', 'NZD/USD',
  'GBP/JPY', 'EUR/JPY', 'EUR/GBP', 'GBP/CAD', 'CAD/JPY', 'AUD/JPY', 'NZD/JPY',
  'EUR/CHF', 'GBP/CHF', 'CAD/CHF', 'AUD/CAD', 'AUD/NZD', 'NZD/CAD', 'CHF/JPY',
  'EUR/CAD', 'EUR/AUD', 'EUR/NZD', 'EUR/SEK', 'EUR/SGD', 'GBP/SEK', 'GBP/NZD',
  'AUD/SGD', 'AUD/CHF', 'NZD/CHF', 'SGD/JPY',
  'USD/NOK', 'USD/SEK', 'USD/ZAR', 'USD/HKD', 'USD/TRY', 'USD/MXN', 'USD/SGD', 'USD/PLN', 'USD/HUF'
];

const App: React.FC = () => {
  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false); // Subscription Gate State
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // --- App State ---
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'pending' | 'error'} | null>(null);
  
  // Wallet State
  const [balances, setBalances] = useState({ DEMO: 10000, LIVE: 0 });
  const [accountType, setAccountType] = useState<'DEMO' | 'LIVE'>('DEMO');

  // Confirmation Modal State
  const [pendingTrade, setPendingTrade] = useState<{ type: TradeType; price: number } | null>(null);

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    riskLevel: 'MEDIUM',
    pair: 'BTC/USD',
    balance: 10000, 
    broker: undefined,
    isPro: false, // Default to free plan
    paymentStatus: 'UNPAID'
  });

  // Track if payment was verified via API Key (simulated)
  const [isApiVerification, setIsApiVerification] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'local' | 'foreign' | 'crypto' | null>(null);

  const [currentHoldings, setCurrentHoldings] = useState<number>(0);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- Effects ---

  // Handle Payment Verification Simulation
  useEffect(() => {
    // If status is PENDING, start verification timer
    if (config.paymentStatus === 'PENDING') {
      const delay = isApiVerification ? 3000 : 8000;
      const providerName = paymentMethod === 'local' ? 'Kuda Bank' : paymentMethod === 'foreign' ? 'Grey' : 'Blockchain';
      
      const timer = setTimeout(() => {
        // Unlock Pro Features
        setConfig(prev => ({
          ...prev,
          paymentStatus: 'VERIFIED',
          isPro: true
        }));
        
        setNotification({
          message: isApiVerification 
            ? `API Verification Successful! Connected to ${providerName}. Pro Features Active.` 
            : `Payment Verified by ${providerName}! Pro Features Active.`,
          type: 'success'
        });
      }, delay);
      
      return () => clearTimeout(timer);
    } 
    // If status is UNPAID, ensure Pro is locked
    else if (config.paymentStatus === 'UNPAID') {
        setConfig(prev => ({ ...prev, isPro: false }));
    }
  }, [config.paymentStatus, isApiVerification, paymentMethod]);

  // Sync balances state with config.balance when account type changes
  useEffect(() => {
    setConfig(prev => ({ ...prev, balance: balances[accountType] }));
  }, [accountType, balances]);

  // Notification Timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // 1. Initialize or Switch Market Data when Pair changes
  useEffect(() => {
    setMarketData(generateInitialHistory(50, config.pair));
    setAnalysis(null); 
  }, [config.pair]);

  // 2. Real-time Market Ticker
  useEffect(() => {
    if (!isAuthenticated || !isSubscribed) return; // Only tick if inside app
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = generateMarketData(config.pair);
        const updated = [...prev, newData];
        if (updated.length > 100) updated.shift();
        return updated;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [isAuthenticated, isSubscribed, config.pair]);

  // 3. Trade Monitoring (Trailing SL & TP)
  useEffect(() => {
    if (marketData.length === 0) return;

    setTrades(prevTrades => {
        let balanceAdjustment = 0;
        let holdingsAdjustment = 0;
        let hasUpdates = false;

        const updatedTrades = prevTrades.map(trade => {
            if (trade.status !== 'OPEN') return trade;
            
            const livePrice = getPrice(trade.symbol);
            let shouldClose = false;
            let profit = 0;
            let currentSL = trade.stopLoss || 0;
            let newSL = currentSL;
            let isTrailing = trade.isTrailing || false;
            let updatedHighest = trade.highestPrice || trade.price;
            let updatedLowest = trade.lowestPrice || trade.price;

            // --- TRAILING STOP LOGIC (Smart Profit Lock) ---
            if (trade.type === TradeType.BUY) {
                // Update Highest Point
                if (livePrice > updatedHighest) updatedHighest = livePrice;
                const currentProfitPct = (livePrice - trade.price) / trade.price;

                // Move to Break Even
                if (currentProfitPct > 0.005 && currentSL < trade.price) {
                    newSL = trade.price;
                    isTrailing = true;
                }
                // Trail Logic
                const trailGap = trade.price * 0.005; // 0.5% trailing gap
                const potentialSL = livePrice - trailGap;
                if (currentProfitPct > 0.015 && potentialSL > newSL) {
                    newSL = potentialSL;
                    isTrailing = true;
                }
                // Check Trigger
                if (trade.stopLoss && livePrice <= currentSL) shouldClose = true;
                if (trade.takeProfit && livePrice >= trade.takeProfit) shouldClose = true;
                if (shouldClose) profit = (livePrice - trade.price) * trade.amount;

            } else if (trade.type === TradeType.SELL) {
                // Update Lowest Point
                if (livePrice < updatedLowest) updatedLowest = livePrice;
                const currentProfitPct = (trade.price - livePrice) / trade.price;

                // Move to Break Even
                if (currentProfitPct > 0.005 && currentSL > trade.price) {
                    newSL = trade.price;
                    isTrailing = true;
                }
                // Trail Logic
                const trailGap = trade.price * 0.005; 
                const potentialSL = livePrice + trailGap;
                if (currentProfitPct > 0.015 && potentialSL < newSL) {
                    newSL = potentialSL;
                    isTrailing = true;
                }
                // Check Trigger
                if (trade.stopLoss && livePrice >= currentSL) shouldClose = true;
                if (trade.takeProfit && livePrice <= trade.takeProfit) shouldClose = true;
                if (shouldClose) profit = (trade.price - livePrice) * trade.amount;
            }

            // Close Trade Logic
            if (shouldClose) {
                hasUpdates = true;
                const initialMargin = trade.price * trade.amount;
                // Return Margin + Profit (Profit can be negative)
                balanceAdjustment += initialMargin + profit;
                
                if (trade.type === TradeType.BUY) holdingsAdjustment -= trade.amount;
                else holdingsAdjustment += trade.amount;
                
                return {
                    ...trade,
                    status: 'CLOSED',
                    profit,
                    closePrice: livePrice,
                    closeTime: new Date()
                } as Trade;
            }

            // Update SL if trailing happened
            if (newSL !== currentSL || updatedHighest !== trade.highestPrice || updatedLowest !== trade.lowestPrice) {
                hasUpdates = true;
                return {
                    ...trade,
                    stopLoss: newSL,
                    highestPrice: updatedHighest,
                    lowestPrice: updatedLowest,
                    isTrailing: isTrailing
                };
            }
            return trade;
        });

        if (hasUpdates) {
             // Update the specific wallet balance based on active account
             setTimeout(() => {
                setBalances(prev => ({
                    ...prev,
                    [accountType]: prev[accountType] + balanceAdjustment
                }));

                if (Math.abs(holdingsAdjustment) > 0) {
                     setCurrentHoldings(h => h + holdingsAdjustment);
                }
                if (balanceAdjustment > 0) {
                   setNotification({ message: `Smart Trail: Position Closed`, type: 'success' });
                }
             }, 0);
             return updatedTrades;
        }

        return prevTrades;
    });
  }, [marketData, accountType]);

  // --- Core Actions ---

  const executeTrade = useCallback((type: TradeType, price: number, sl?: number, tp?: number, recommendedAmount?: number) => {
    // 1. Determine Position Size (Amount)
    let amount = recommendedAmount;

    if (!amount) {
        // Fallback Calculation if AI didn't provide specific amount
        const riskPct = config.riskLevel === 'HIGH' ? 0.10 : config.riskLevel === 'MEDIUM' ? 0.05 : 0.01;
        const currentBalance = balances[accountType];
        const capitalToRisk = currentBalance * riskPct; 
        
        // Simple fallback: Amount = CapitalToRisk / Price
        amount = capitalToRisk / price; 
    }

    // 2. Strict Balance Check (Margin)
    const marginRequired = price * amount;
    const currentBalance = balances[accountType];
    
    if (marginRequired > currentBalance) {
        setNotification({ message: `Insufficient ${accountType} Balance ($${currentBalance.toFixed(2)}) for trade requiring $${marginRequired.toFixed(2)}`, type: 'error' });
        return;
    }

    // 3. Execute
    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: config.pair,
      type,
      price,
      amount: parseFloat(amount.toFixed(6)), // Avoid floating point precision issues
      timestamp: new Date(),
      status: 'OPEN',
      stopLoss: sl,
      takeProfit: tp,
      highestPrice: type === TradeType.BUY ? price : undefined,
      lowestPrice: type === TradeType.SELL ? price : undefined,
      isTrailing: false
    };

    setTrades(prev => [newTrade, ...prev]);
    
    // Deduct from specific wallet
    setBalances(prev => ({
        ...prev,
        [accountType]: prev[accountType] - marginRequired
    }));

    if (type === TradeType.BUY) setCurrentHoldings(prev => prev + amount!);
    else setCurrentHoldings(prev => prev + amount!); // Short exposure

    setNotification({ 
        message: `${type} Executed on ${config.pair}. Margin Deducted: $${marginRequired.toFixed(2)} (${accountType})`, 
        type: 'success' 
    });
  }, [config.riskLevel, config.pair, accountType, balances]);

  // 4. Automated Entry Logic
  useEffect(() => {
    if (!config.isActive || !analysis) return;
    const currentPrice = marketData[marketData.length - 1]?.price;
    if (!currentPrice) return;

    const timeSinceAnalysis = new Date().getTime() - analysis.timestamp.getTime();
    if (timeSinceAnalysis > 15000) return; 

    const openTradesForPair = trades.filter(t => t.status === 'OPEN' && t.symbol === config.pair).length;
    const maxTrades = config.isPro ? 10 : 3;
    if (openTradesForPair >= maxTrades) return;

    // HIGH SUCCESS RATE FILTER
    if (analysis.confidence >= 80) {
        if (analysis.recommendation === TradeType.BUY || analysis.recommendation === TradeType.SELL) {
             executeTrade(
                 analysis.recommendation, 
                 currentPrice, 
                 analysis.stopLoss, 
                 analysis.takeProfit,
                 analysis.recommendedAmount 
             );
        }
    }
  }, [analysis, config.isActive, config.pair, config.isPro, trades, executeTrade, marketData]); 

  // --- Handlers ---

  const performAnalysis = useCallback(async () => {
    if (isAnalyzing || marketData.length < 50) return;
    
    setIsAnalyzing(true);
    // Analyze using the active balance
    const result = await analyzeMarket(marketData, balances[accountType], config.riskLevel, config.pair);
    setAnalysis(result);
    setIsAnalyzing(false);
  }, [marketData, balances, accountType, config.riskLevel, config.pair, isAnalyzing]);

  useEffect(() => {
    if (config.isActive && isAuthenticated && isSubscribed) {
      performAnalysis();
      const intervalMs = config.isPro ? 5000 : 10000;
      analysisIntervalRef.current = setInterval(performAnalysis, intervalMs);
    } else {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
    return () => {
      if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current);
    }
  }, [config.isActive, isAuthenticated, isSubscribed, performAnalysis, config.isPro]);

  const initiateManualTrade = (type: TradeType) => {
    const price = marketData[marketData.length - 1]?.price || 0;
    setPendingTrade({ type, price });
  };

  const confirmTrade = () => {
    if (pendingTrade) {
      // Re-fetch latest price to simulate market order (avoid slippage in simulation)
      const latestPrice = marketData[marketData.length - 1]?.price || pendingTrade.price;
      
      // Calculate SL/TP based on Risk Level (Auto-fill for manual)
      const riskPct = 0.01; 
      const slDist = latestPrice * riskPct; 
      
      const sl = pendingTrade.type === TradeType.BUY ? latestPrice - slDist : latestPrice + slDist;
      const tp = pendingTrade.type === TradeType.BUY ? latestPrice + (slDist * 2) : latestPrice - (slDist * 2);

      // Manual trade uses 5% of balance as default amount if not specified
      const currentBalance = balances[accountType];
      const manualAmount = (currentBalance * 0.05) / latestPrice;

      executeTrade(pendingTrade.type, latestPrice, sl, tp, manualAmount);
      setPendingTrade(null);
    }
  };

  const handleBrokerConnect = (broker: string, isLive: boolean) => {
    const type = isLive ? 'LIVE' : 'DEMO';
    setAccountType(type);
    
    // Update balance simulation logic
    if (isLive) {
        // EXACT simulation of the user's broker balance as requested
        const fetchedLiveBalance = 35500.00; 
        setBalances(prev => ({ ...prev, LIVE: fetchedLiveBalance }));
        setConfig(prev => ({ ...prev, broker, balance: fetchedLiveBalance }));
    } else {
        // Reset Demo to 10k or keep existing
        setBalances(prev => ({ ...prev, DEMO: 10000 }));
        setConfig(prev => ({ ...prev, broker, balance: 10000 }));
    }

    setNotification({ 
        message: `Connected to ${broker} (${type}). Balance Synced.`, 
        type: 'success' 
    });
  };

  const handleProUpgrade = (details: { ref: string, apiKey?: string, method: 'local' | 'foreign' | 'crypto' }) => {
    setIsApiVerification(!!details.apiKey);
    setPaymentMethod(details.method);
    setConfig(prev => ({ ...prev, paymentStatus: 'PENDING' }));
    
    setNotification({ 
        message: details.apiKey 
          ? 'Connecting to Bank API for instant verification...' 
          : 'Submitting Payment Reference for verification...', 
        type: 'pending' 
    });
  };

  // 1. Auth Gate
  if (!isAuthenticated) {
    return <AuthPage onLogin={() => setIsAuthenticated(true)} />;
  }

  // 2. Subscription Gate
  if (!isSubscribed) {
    return <SubscriptionGate onVerify={() => {
        setIsSubscribed(true);
        setNotification({ message: "Subscription Verified. Welcome to NexusTrade.", type: 'success' });
    }} />;
  }

  // 3. Main App
  const pairDetails = getPairDetails(config.pair);

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans flex flex-col md:flex-row">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[70] px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in ${
            notification.type === 'success' ? 'bg-surface border-success/30 text-success' : 
            notification.type === 'error' ? 'bg-surface border-danger/30 text-danger' :
            'bg-surface border-yellow-500/30 text-yellow-500'
        }`}>
            {notification.type === 'pending' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
             <AlertTriangle className="w-5 h-5" />
            }
            <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Mobile Navbar */}
      <div className="md:hidden bg-surface border-b border-gray-700 p-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-2">
           <Bot className="w-6 h-6 text-primary" />
           <span className="font-bold text-white">NexusTrade</span>
        </div>
        <button onClick={() => setIsSettingsModalOpen(true)} className="text-gray-400"><Settings className="w-6 h-6" /></button>
      </div>

      {/* Sidebar (Desktop) / Navigation */}
      <nav className="hidden md:flex flex-col w-64 bg-surface border-r border-gray-700 p-4 space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">NexusTrade</h1>
        </div>

        <div className="space-y-1">
          <p className="px-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account</p>
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 mb-4 relative overflow-hidden">
             {accountType === 'LIVE' && <div className="absolute top-0 right-0 p-1 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-bl-lg">LIVE</div>}
             {accountType === 'DEMO' && <div className="absolute top-0 right-0 p-1 bg-gray-600/20 text-gray-400 text-[10px] font-bold rounded-bl-lg">DEMO</div>}
             
             <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs">Available Balance</span>
                {config.isPro && <Crown className="w-3 h-3 text-yellow-500" />}
             </div>
             <div className="text-2xl font-mono font-bold text-white">${config.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
             <div className="flex justify-between items-center mt-2">
                 <span className="text-xs text-gray-500">PnL (Today)</span>
                 <span className="text-xs text-success font-medium">+2.4%</span>
             </div>
          </div>
          
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                config.isPro 
                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' 
                : 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-black hover:shadow-lg hover:shadow-yellow-900/20'
            }`}
          >
             {config.isPro ? (
                 <><CheckCircle className="w-4 h-4" /> Pro Active</>
             ) : (
                 <><Crown className="w-4 h-4" /> Upgrade to Pro</>
             )}
          </button>
        </div>

        <div className="flex-1 space-y-2">
           <p className="px-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Market Watch</p>
           {/* Simple Watchlist */}
           {[config.pair, 'XAU/USD', 'BTC/USD'].map(p => (
               <div key={p} onClick={() => setConfig(prev => ({...prev, pair: p}))} className={`p-2 rounded-lg flex justify-between items-center cursor-pointer hover:bg-gray-800 ${config.pair === p ? 'bg-gray-800 border border-gray-600' : ''}`}>
                   <span className="text-sm font-medium">{p}</span>
                   <span className="text-xs text-gray-400">{getPrice(p).toFixed(2)}</span>
               </div>
           ))}
           <div className="mt-4 p-2">
                <label className="text-xs text-gray-500 block mb-1">Select Pair</label>
                <div className="relative">
                    <select 
                        value={config.pair}
                        onChange={(e) => setConfig(prev => ({ ...prev, pair: e.target.value }))}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-2 pr-8 text-sm appearance-none outline-none focus:border-primary"
                    >
                        {AVAILABLE_PAIRS.map(pair => (
                            <option key={pair} value={pair}>{pair}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
           </div>
        </div>

        <div className="mt-auto space-y-3">
             <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className="w-full p-3 rounded-xl border border-gray-700 bg-surface hover:bg-gray-800 text-gray-400 hover:text-white transition-all flex items-center justify-start gap-3"
             >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
             </button>

             <button 
                onClick={() => setIsBrokerModalOpen(true)}
                className={`w-full p-3 rounded-xl border flex items-center justify-between text-sm transition-colors ${
                    config.broker 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                }`}
             >
                <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    <span>{config.broker ? config.broker : 'Connect Broker'}</span>
                </div>
                {config.broker && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
             </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard label="24h Volume" value="$1.2M" trend="12%" trendUp icon={Activity} />
          <StatsCard label="Win Rate" value={analysis ? `${analysis.confidence}%` : '-'} icon={Shield} color="text-success" />
          <StatsCard label="Active Trades" value={trades.filter(t => t.status === 'OPEN').length.toString()} icon={Wallet} color="text-warning" />
          <StatsCard label="Risk Mode" value={config.riskLevel} icon={AlertTriangle} color={config.riskLevel === 'HIGH' ? 'text-danger' : 'text-primary'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chart & Manual Trade */}
          <div className="lg:col-span-2 space-y-6">
            <ChartPanel data={marketData} pair={config.pair} trades={trades} />
            
            {/* Manual Execution */}
            <div className="bg-surface p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={() => initiateManualTrade(TradeType.BUY)}
                        className="flex-1 md:flex-none px-8 py-3 bg-success hover:bg-green-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-green-900/20"
                    >
                        BUY MARKET
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 uppercase">Spread</span>
                        <span className="text-sm font-mono text-white">0.2</span>
                    </div>
                    <button 
                        onClick={() => initiateManualTrade(TradeType.SELL)}
                        className="flex-1 md:flex-none px-8 py-3 bg-danger hover:bg-red-600 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20"
                    >
                        SELL MARKET
                    </button>
                </div>
                
                {/* Risk Settings */}
                <div className="flex items-center gap-2 bg-gray-900/50 p-1.5 rounded-lg border border-gray-700">
                    <button 
                        onClick={() => setConfig(c => ({...c, riskLevel: 'LOW'}))}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${config.riskLevel === 'LOW' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        LOW
                    </button>
                    <button 
                        onClick={() => setConfig(c => ({...c, riskLevel: 'MEDIUM'}))}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${config.riskLevel === 'MEDIUM' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        MID
                    </button>
                    <button 
                        onClick={() => {
                            if (config.isPro) setConfig(c => ({...c, riskLevel: 'HIGH'}));
                            else setNotification({ message: "High Risk Mode is locked for Pro Users", type: 'error' });
                        }}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                            config.riskLevel === 'HIGH' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        HIGH {!config.isPro && <Lock className="w-3 h-3" />}
                    </button>
                </div>
            </div>
          </div>

          {/* Right Column: AI & History */}
          <div className="space-y-6">
            <BotStatusPanel 
              analysis={analysis} 
              config={config} 
              onToggleActive={() => setConfig(prev => ({ ...prev, isActive: !prev.isActive }))}
              isAnalyzing={isAnalyzing}
            />
            <TradeHistory trades={trades} />
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {pendingTrade && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-surface border border-gray-700 w-full max-w-sm rounded-xl shadow-2xl p-6 relative">
                <h3 className="text-xl font-bold text-white mb-4">Confirm Execution</h3>
                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Type</span>
                        <span className={`font-bold ${pendingTrade.type === TradeType.BUY ? 'text-success' : 'text-danger'}`}>{pendingTrade.type}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Pair</span>
                        <span className="text-white font-mono">{config.pair}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Est. Price</span>
                        <span className="text-white font-mono">{pendingTrade.price.toFixed(pairDetails.decimals)}</span>
                    </div>
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-xs text-yellow-500 text-center">
                            Risking approx. {config.riskLevel === 'LOW' ? '1%' : config.riskLevel === 'MEDIUM' ? '5%' : '10%'} of balance.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => setPendingTrade(null)}
                        className="py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={confirmTrade}
                        className="py-2.5 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-900/20"
                    >
                        Confirm Trade
                    </button>
                </div>
            </div>
        </div>
      )}

      <BrokerModal 
        isOpen={isBrokerModalOpen} 
        onClose={() => setIsBrokerModalOpen(false)}
        onConnect={handleBrokerConnect}
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onUpgrade={handleProUpgrade}
        balances={balances}
      />

      <AIChat marketContext={JSON.stringify(analysis)} config={config} />
    </div>
  );
};

export default App;
