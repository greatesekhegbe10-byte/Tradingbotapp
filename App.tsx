
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Radio, BookOpen, Calculator, Sliders, ShieldCheck, Power, UserCircle, BellRing, X, Activity } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { AuthPage } from './components/AuthPage';
import { SettingsTab } from './components/SettingsTab';
import { SignalDashboard } from './components/SignalDashboard';
import { TradingJournal } from './components/TradingJournal';
import { RiskCalculator } from './components/RiskCalculator';
import { UserProfile, Trade, AnalysisResult, BotConfig, MarketDataPoint, StakingPlan } from './types';
import { getPrice, RiskMonitor } from './services/marketService';
import { analyzeMarket } from './services/geminiService';
import { NEXUS_LOGO } from './assets';
import { BOT_DEFAULTS } from './appConfig';

type View = 'dashboard' | 'signals' | 'journal' | 'calculator' | 'settings';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('nexus_auth') === 'true');
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [alertQueue, setAlertQueue] = useState<{id: string, msg: string}[]>([]);
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    try { 
      const saved = localStorage.getItem('nexus_user'); 
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [config, setConfig] = useState<BotConfig>(() => ({
    isActive: false, 
    isAutoTrade: false, 
    killSwitch: false, 
    pair: BOT_DEFAULTS.DEFAULT_PAIR, 
    tier: 'BASIC',
    strategyId: BOT_DEFAULTS.DEFAULT_STRATEGY, 
    riskPerTrade: 1,
    minConfidence: 85,
    isExecutionEnabled: false,
    vpsStatus: 'OFFLINE',
    signalMode: 'BALANCED',
    maxDrawdown: 10,
    stakingPlan: 'FIXED' as StakingPlan,
    // FIX: Initialized missing trailing stop fields for RiskMonitor
    useTrailingStop: false,
    trailingDistancePips: 20
  }));

  const pushAlert = (msg: string) => {
    const id = Date.now().toString();
    setAlertQueue(prev => [...prev, { id, msg }]);
    setTimeout(() => setAlertQueue(prev => prev.filter(a => a.id !== id)), 5000);
  };

  // MAIN TICKER
  useEffect(() => {
    const ticker = setInterval(() => {
      const price = getPrice(config.pair);
      setCurrentPrice(price);
      setMarketData(prev => [...prev.slice(-39), { time: new Date().toLocaleTimeString(), price, volume: Math.random() * 5000 }]);
      setTrades(prev => prev.map(t => RiskMonitor.evaluateTrade(t, price, config)));
    }, 1000);
    return () => clearInterval(ticker);
  }, [config.pair]);

  // SECURE ANALYSIS ENGINE
  useEffect(() => {
    if (!config.isActive || !config.isAutoTrade || isAnalyzing) return;

    const runAnalysis = async () => {
      setIsAnalyzing(true);
      try {
        const res = await analyzeMarket(marketData, config.pair, config.tier);
        setAnalysis(res);
        
        // SECURITY LOCK: Only execute if explicitly unlocked by Admin + Broker active
        const canExecute = config.isExecutionEnabled && user?.brokerConfig.isAdminUnlocked && user?.brokerConfig.isActive;
        
        if (canExecute && res.recommendation !== 'HOLD' && res.confidence >= config.minConfidence) {
            const newTrade: Trade = {
                id: `TRD-${Date.now()}`,
                symbol: config.pair,
                type: res.recommendation,
                price: currentPrice,
                amount: config.riskPerTrade,
                timestamp: new Date().toISOString(),
                status: 'OPEN',
                sl: res.stopLoss,
                tp: res.takeProfit
            };
            setTrades(prev => [newTrade, ...prev].slice(0, 50));
            pushAlert(`AI EXECUTION: ${res.recommendation} @ ${currentPrice}`);
        } else if (!canExecute && res.recommendation !== 'HOLD') {
            console.warn(`[SECURITY] Execution blocked: Node Locked or Broker Offline.`);
        }
      } catch (e) {
        console.error("Neural Node Failure", e);
      } finally {
        setIsAnalyzing(false);
      }
    };

    const interval = setInterval(runAnalysis, 15000);
    return () => clearInterval(interval);
  }, [config.isActive, config.isAutoTrade, config.pair, currentPrice, isAnalyzing, marketData, config.isExecutionEnabled, user]);

  if (!isAuthenticated) return <AuthPage onLogin={(isRoot, profile) => {
    const p: UserProfile = { 
      id: 'USER-01', name: profile?.name || "Trader", email: profile?.email || "", 
      tier: 'BASIC', role: isRoot ? 'ROOT' : 'NONE', balance: 1000, mode: 'PAPER', status: 'ACTIVE',
      stats: { winRate: 0, drawdown: 0, profitFactor: 0, totalTrades: 0, equityHistory: [] },
      brokerConfig: { isActive: false, isAdminUnlocked: false, connectionStatus: 'DISCONNECTED' }
    };
    setUser(p);
    setIsAuthenticated(true);
    localStorage.setItem('nexus_auth', 'true');
    localStorage.setItem('nexus_user', JSON.stringify(p));
  }} />;

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col lg:flex-row overflow-hidden font-sans">
      <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
        {alertQueue.map(alert => (
          <div key={alert.id} className="bg-surface/90 backdrop-blur-3xl border border-primary/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in pointer-events-auto">
             <BellRing className="w-4 h-4 text-primary" />
             <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed flex-1">{alert.msg}</p>
             <button onClick={() => setAlertQueue(prev => prev.filter(a => a.id !== alert.id))}><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        ))}
      </div>

      <aside className="w-72 bg-[#0a101f] border-r border-gray-800 flex-col p-8 gap-8 hidden lg:flex">
        <div className="flex items-center gap-4 mb-8">
            <img src={NEXUS_LOGO} alt="Nexus" className="w-10 h-10 shadow-2xl rounded-xl" />
            <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">NexusTrade</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'signals', label: 'Alpha Feed', icon: Radio },
            { id: 'journal', label: 'Journal', icon: BookOpen },
            { id: 'calculator', label: 'Risk Tool', icon: Calculator },
            { id: 'settings', label: 'Terminal Hub', icon: Sliders }
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveView(item.id as View)} 
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === item.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        <button onClick={() => setIsAuthenticated(false)} className="flex items-center gap-4 p-4 rounded-2xl text-danger hover:bg-danger/10 mt-auto">
          <Power className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Terminate Session</span>
        </button>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
         <header className="h-24 border-b border-gray-800 flex items-center justify-between px-10 bg-[#0a101f]/50 backdrop-blur-3xl z-40">
            <div className="flex items-center gap-3 bg-gray-900/50 p-2.5 rounded-3xl border border-gray-800 pr-6">
                <UserCircle className="w-8 h-8 text-primary ml-2" />
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight">{user?.name}</p>
                  <p className="text-[8px] text-primary font-black uppercase tracking-widest">{user?.tier} CLUSTER</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${config.vpsStatus === 'ONLINE' ? 'bg-success animate-pulse' : 'bg-danger'}`}></div>
                   <span className="text-[10px] text-gray-400 font-black uppercase">VPS: {config.vpsStatus}</span>
                </div>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-10 space-y-12 bg-[#070b14]">
            {activeView === 'dashboard' && user && (
              <div className="flex flex-col xl:flex-row gap-10">
                 <div className="flex-1 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <StatsCard label="Balance" value={`$${user.balance.toFixed(2)}`} icon={Activity} />
                       <StatsCard label="Win Rate" value={`${user.stats.winRate}%`} icon={ShieldCheck} color="text-success" />
                       <StatsCard label="Broker Link" value={user.brokerConfig.isActive ? 'ACTIVE' : 'LOCKED'} icon={Sliders} color={user.brokerConfig.isActive ? 'text-success' : 'text-danger'} />
                    </div>
                    <ChartPanel data={marketData} pair={config.pair} trades={trades} analysis={analysis} />
                    <TradeHistory trades={trades} onExecuteSignal={() => {}} />
                 </div>
                 <div className="xl:w-96 shrink-0">
                    <BotStatusPanel 
                      analysis={analysis} 
                      config={config} 
                      user={user} 
                      onToggleActive={() => setConfig(c => ({...c, isActive: !c.isActive}))} 
                      onToggleAuto={() => setConfig(c => ({...c, isAutoTrade: !c.isAutoTrade}))} 
                      isAnalyzing={isAnalyzing} 
                      livePrice={currentPrice} 
                    />
                 </div>
              </div>
            )}
            {activeView === 'signals' && <SignalDashboard />}
            {activeView === 'journal' && user && <TradingJournal user={user} />}
            {activeView === 'calculator' && <RiskCalculator balance={user?.balance || 1000} />}
            {activeView === 'settings' && user && <SettingsTab config={config} user={user} onUpdateConfig={setConfig} />}
         </div>
      </main>
    </div>
  );
};

// FIX: Added default export for index.tsx
export default App;
