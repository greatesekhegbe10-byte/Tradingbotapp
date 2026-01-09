
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bot, Wallet, Activity, AlertTriangle, Settings, RefreshCw, Target, Shield, Gauge } from 'lucide-react';
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
  // Auth & Persistence
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('nexus_auth') === 'true');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(() => localStorage.getItem('nexus_sub') === 'true');
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('nexus_admin') === 'true');
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Market & Core State
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // UI State
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [manualSL, setManualSL] = useState<string>('');
  const [manualTP, setManualTP] = useState<string>('');
  
  // Financial State
  const [balances, setBalances] = useState({ DEMO: 10000, LIVE: 0 });
  const [activeWallet, setActiveWallet] = useState<'DEMO' | 'LIVE'>('DEMO');

  const [config, setConfig] = useState<BotConfig>({
    isActive: false,
    riskLevel: 'MEDIUM',
    sensitivity: 'MEDIUM',
    pair: 'XAU/USD',
    balance: 10000,
    isPro: localStorage.getItem('nexus_admin') === 'true',
    paymentStatus: localStorage.getItem('nexus_admin') === 'true' ? 'VERIFIED' : 'UNPAID'
  });

  const [pendingTrade, setPendingTrade] = useState<{ type: TradeType; price: number; amount: number; sl?: number; tp?: number } | null>(null);

  // Persistence Refs
  const marketDataRef = useRef<MarketDataPoint[]>([]);
  const configRef = useRef(config);
  const isAnalyzingRef = useRef(false);
  const activeWalletRef = useRef(activeWallet);

  useEffect(() => { 
    configRef.current = config; 
  }, [config]);

  useEffect(() => {
    activeWalletRef.current = activeWallet;
  }, [activeWallet]);

  // Initial Sync
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      await fetchLivePrices();
      const initial = generateInitialHistory(50, config.pair);
      setMarketData(initial);
      marketDataRef.current = initial;
      setIsInitializing(false);
    };
    init();

    const syncInterval = setInterval(fetchLivePrices, 60000);
    return () => clearInterval(syncInterval);
  }, []);

  // Real-time Feed
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => {
        const newData = generateMarketData(configRef.current.pair); 
        const updated = [...prev, newData].slice(-60);
        marketDataRef.current = updated;
        return updated;
      });
    }, 1500); 
    return () => clearInterval(interval);
  }, []);

  // Derived Balance Config Sync
  useEffect(() => {
      const currentBal = activeWallet === 'DEMO' ? balances.DEMO : balances.LIVE;
      setConfig(prev => prev.balance === currentBal ? prev : { ...prev, balance: currentBal });
  }, [balances, activeWallet]);

  // Dynamic SL/TP Updates from AI
  useEffect(() => {
    if (analysis) {
        setManualSL(analysis.stopLoss.toFixed(getPairDetails(config.pair).decimals));
        setManualTP(analysis.takeProfit.toFixed(getPairDetails(config.pair).decimals));
    }
  }, [analysis, config.pair]);

  // Trade Execution Core
  const executeTrade = useCallback((type: TradeType, sl?: number, tp?: number, overridePair?: string) => {
    const symbol = overridePair || configRef.current.pair;
    const currentPrice = getPrice(symbol);
    
    if (!currentPrice || currentPrice <= 0) return;

    const riskPct = configRef.current.riskLevel === 'LOW' ? 0.01 : configRef.current.riskLevel === 'MEDIUM' ? 0.05 : 0.10;
    const currentBalance = activeWalletRef.current === 'DEMO' ? balances.DEMO : balances.LIVE;
    const maxRiskAmount = currentBalance * riskPct;
    const amount = parseFloat((maxRiskAmount / currentPrice).toFixed(6));

    if (amount <= 0 || (amount * currentPrice) > currentBalance) {
        if (!configRef.current.isActive) alert("Insufficient balance for requested risk level.");
        return;
    }

    const marginRequired = amount * currentPrice;

    setBalances(prev => ({
        ...prev,
        [activeWalletRef.current]: prev[activeWalletRef.current] - marginRequired
    }));

    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol,
      type,
      price: currentPrice,
      amount,
      timestamp: new Date(),
      status: 'OPEN',
      stopLoss: sl,
      takeProfit: tp
    };

    setTrades(prev => [newTrade, ...prev]);
    setPendingTrade(null);
  }, [balances.DEMO, balances.LIVE]);

  // Trade Monitoring & Exit Logic
  useEffect(() => {
    let balanceChanged = false;
    let newDemo = balances.DEMO;
    let newLive = balances.LIVE;

    const updatedTrades = trades.map(trade => {
      if (trade.status !== 'OPEN') return trade;

      const currentPrice = getPrice(trade.symbol);
      let shouldClose = false;
      let profit = 0;
      let newSL = trade.stopLoss || 0;

      // Trailing Stop Simulation
      if (trade.type === TradeType.BUY) {
        const profitPct = (currentPrice - trade.price) / trade.price;
        if (profitPct > 0.01 && (!trade.stopLoss || newSL < trade.price)) {
          newSL = trade.price; // Move to break even
        }
        if (trade.stopLoss && currentPrice <= trade.stopLoss) shouldClose = true;
        if (trade.takeProfit && currentPrice >= trade.takeProfit) shouldClose = true;
        if (shouldClose) profit = (currentPrice - trade.price) * trade.amount;
      } else if (trade.type === TradeType.SELL) {
        const profitPct = (trade.price - currentPrice) / trade.price;
        if (profitPct > 0.01 && (!trade.stopLoss || newSL > trade.price)) {
          newSL = trade.price;
        }
        if (trade.stopLoss && currentPrice >= trade.stopLoss) shouldClose = true;
        if (trade.takeProfit && currentPrice <= trade.takeProfit) shouldClose = true;
        if (shouldClose) profit = (trade.price - currentPrice) * trade.amount;
      }

      if (shouldClose) {
        balanceChanged = true;
        const totalReturn = (trade.price * trade.amount) + profit;
        if (activeWallet === 'DEMO') newDemo += totalReturn;
        else newLive += totalReturn;
        return { ...trade, status: 'CLOSED' as const, profit, closePrice: currentPrice, closeTime: new Date() };
      }

      if (newSL !== trade.stopLoss) {
        return { ...trade, stopLoss: newSL, isTrailing: true };
      }

      return trade;
    });

    if (balanceChanged) {
      setTrades(updatedTrades);
      setBalances({ DEMO: newDemo, LIVE: newLive });
    }
  }, [marketData]);

  // AI Analysis Effect
  useEffect(() => {
    const loop = async () => {
      if (isAnalyzingRef.current || marketDataRef.current.length < 10) return;
      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      
      try {
        const res = await analyzeMarket(
            marketDataRef.current, 
            configRef.current.balance, 
            configRef.current.riskLevel, 
            configRef.current.pair,
            configRef.current.sensitivity
        );
        setAnalysis(res);

        const threshold = configRef.current.sensitivity === 'HIGH' ? 80 : 85;
        if (configRef.current.isActive && res.confidence >= threshold && res.recommendation !== TradeType.HOLD) {
           executeTrade(res.recommendation, res.stopLoss, res.takeProfit);
        }
      } catch (e) {
        console.error("AI Error:", e);
      } finally {
        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
      }
    };

    const timer = setInterval(loop, config.isPro ? 12000 : 25000);
    loop();
    return () => clearInterval(timer);
  }, [config.isPro, config.pair, config.sensitivity, executeTrade]);

  const initiateManualTrade = useCallback((type: TradeType) => {
      const price = marketDataRef.current[marketDataRef.current.length - 1].price;
      const riskPct = config.riskLevel === 'LOW' ? 0.01 : config.riskLevel === 'MEDIUM' ? 0.05 : 0.10;
      const currentBal = activeWallet === 'DEMO' ? balances.DEMO : balances.LIVE;
      const amount = parseFloat(((currentBal * riskPct) / price).toFixed(6));
      const sl = manualSL ? parseFloat(manualSL) : undefined;
      const tp = manualTP ? parseFloat(manualTP) : undefined;
      setPendingTrade({ type, price, amount, sl, tp });
  }, [config.riskLevel, activeWallet, balances, manualSL, manualTP]);

  const logout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!isAuthenticated) return <AuthPage onLogin={(admin = false) => {
    setIsAuthenticated(true);
    localStorage.setItem('nexus_auth', 'true');
    if (admin) {
      setIsAdmin(true);
      localStorage.setItem('nexus_admin', 'true');
      setConfig(prev => ({ ...prev, isPro: true, paymentStatus: 'VERIFIED' }));
    }
  }} />;

  if (!isSubscribed && !isAdmin) return <SubscriptionGate onVerify={() => {
    setIsSubscribed(true);
    localStorage.setItem('nexus_sub', 'true');
  }} />;

  return (
    <div className="min-h-screen bg-background text-gray-100 font-sans p-4 md:p-6 pb-24 md:pb-6 relative overflow-x-hidden">
      {isInitializing && (
          <div className="fixed inset-0 z-[70] bg-background flex flex-col items-center justify-center backdrop-blur-md">
              <RefreshCw className="w-12 h-12 text-primary animate-spin mb-4" />
              <h2 className="text-xl font-bold text-white tracking-widest uppercase">Initializing Core Feeds</h2>
          </div>
      )}

      {isAdmin && (
        <div className="fixed top-0 left-0 w-full bg-amber-500 text-black px-4 py-1 text-[10px] font-bold text-center z-[100] uppercase tracking-widest flex items-center justify-center gap-4">
            <span>Maintenance Terminal • Build: NX-v2.5</span>
            <button onClick={logout} className="underline hover:no-underline">Log Out</button>
        </div>
      )}

      <BrokerModal 
        isOpen={isBrokerModalOpen} 
        onClose={() => setIsBrokerModalOpen(false)} 
        onConnect={(broker, isLive) => {
          setIsBrokerModalOpen(false);
          setActiveWallet(isLive ? 'LIVE' : 'DEMO');
          if (isLive) setBalances(p => ({ ...p, LIVE: 35000 }));
        }} 
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        balances={balances}
        onUpgrade={() => {
          setConfig(prev => ({ ...prev, isPro: true, paymentStatus: 'VERIFIED' }));
        }}
      />

      {pendingTrade && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
              <div className="bg-surface border border-gray-600 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Execute Order</h3>
                  <div className="space-y-3 mb-6 font-mono text-sm">
                      <div className="flex justify-between">
                          <span className="text-gray-400">Pair</span>
                          <span className="text-white">{config.pair}</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-400">Action</span>
                          <span className={pendingTrade.type === TradeType.BUY ? 'text-success' : 'text-danger'}>{pendingTrade.type} MARKET</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-700 pt-2">
                          <span className="text-gray-400">Size</span>
                          <span className="text-white">{pendingTrade.amount} Units</span>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setPendingTrade(null)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold">Abort</button>
                      <button onClick={() => executeTrade(pendingTrade.type, pendingTrade.sl, pendingTrade.tp)} className="flex-1 py-3 bg-primary hover:bg-blue-600 rounded-xl font-bold text-white">Execute</button>
                  </div>
              </div>
          </div>
      )}

      <nav className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-surface p-4 rounded-2xl border border-gray-700 shadow-xl mt-4 md:mt-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
              <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">NexusTrade AI</h1>
              {(config.isPro || isAdmin) && <span className="text-[9px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30 font-bold uppercase">Pro Terminal</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-end">
          <select 
            value={config.pair}
            onChange={(e) => setConfig(prev => ({ ...prev, pair: e.target.value }))}
            className="bg-gray-900 border border-gray-700 text-white py-2 px-4 rounded-xl focus:ring-1 focus:ring-primary outline-none font-mono font-bold"
          >
            {AVAILABLE_PAIRS.map(pair => (
                <option key={pair} value={pair}>{pair}</option>
            ))}
          </select>

          <div className="flex items-center gap-4">
              <div className="text-right">
                <span className={`text-[9px] font-bold uppercase tracking-widest ${activeWallet === 'LIVE' ? 'text-green-400' : 'text-gray-500'}`}>
                    {activeWallet} Account
                </span>
                <div className="flex items-center gap-2">
                    <Wallet className={`w-4 h-4 ${activeWallet === 'LIVE' ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className="text-xl font-mono font-bold">${config.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
              <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-xl transition-colors border border-gray-700">
                  <Settings className="w-6 h-6" />
              </button>
          </div>
        </div>
      </nav>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatsCard label="Market Cap" value="$2.8T" trend="14%" trendUp icon={Activity} />
                <StatsCard label="Win Rate" value="84.2%" trend="0.5%" trendUp icon={Bot} color="text-accent" />
                <div className="bg-surface p-3 rounded-2xl border border-gray-700 flex flex-col justify-between">
                     <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Risk</span>
                     <div className="flex bg-gray-900 rounded-lg p-0.5">
                         {(['LOW', 'MEDIUM', 'HIGH'] as const).map(l => (
                             <button key={l} onClick={() => setConfig(p => ({...p, riskLevel: l}))} className={`flex-1 py-1 text-[9px] font-bold rounded transition-all ${config.riskLevel === l ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-400'}`}>
                                 {l}
                             </button>
                         ))}
                     </div>
                </div>
                <div className="bg-surface p-3 rounded-2xl border border-gray-700 flex flex-col justify-between">
                     <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Sensitivity</span>
                     <div className="flex bg-gray-900 rounded-lg p-0.5">
                         {(['LOW', 'MEDIUM', 'HIGH'] as const).map(l => (
                             <button key={l} onClick={() => setConfig(p => ({...p, sensitivity: l}))} className={`flex-1 py-1 text-[9px] font-bold rounded transition-all ${config.sensitivity === l ? 'bg-gray-700 text-white shadow' : 'text-gray-500 hover:text-gray-400'}`}>
                                 {l}
                             </button>
                         ))}
                     </div>
                </div>
            </div>

            <ChartPanel data={marketData} pair={config.pair} trades={trades} />

            <div className="bg-surface p-6 rounded-2xl border border-gray-700 shadow-xl space-y-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Stop Loss (Price)</label>
                        <input type="number" step="0.0001" value={manualSL} onChange={(e) => setManualSL(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-danger outline-none font-mono" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Take Profit (Price)</label>
                        <input type="number" step="0.0001" value={manualTP} onChange={(e) => setManualTP(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 px-4 text-sm text-white focus:ring-1 focus:ring-success outline-none font-mono" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => initiateManualTrade(TradeType.BUY)} className="flex-1 py-5 bg-success hover:bg-green-600 text-white font-black rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all text-sm tracking-widest uppercase">Buy Market</button>
                    <button onClick={() => initiateManualTrade(TradeType.SELL)} className="flex-1 py-5 bg-danger hover:bg-red-600 text-white font-black rounded-xl shadow-lg shadow-red-900/20 active:scale-95 transition-all text-sm tracking-widest uppercase">Sell Market</button>
                </div>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <BotStatusPanel analysis={analysis} config={config} onToggleActive={() => setConfig(p => ({ ...p, isActive: !p.isActive }))} isAnalyzing={isAnalyzing} />
          <TradeHistory trades={trades} onExecuteSignal={(p, t, sl, tp) => executeTrade(t, sl, tp, p)} />
        </div>
      </div>

      <AIChat marketContext={analysis?.reasoning || "Market analysis standby."} config={config} />
    </div>
  );
};

export default App;
