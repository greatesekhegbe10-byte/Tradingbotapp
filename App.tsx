
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LayoutDashboard, History, Sliders, Activity, Target, Shield, Globe, UserCircle, ShieldAlert, Newspaper, Zap, TrendingUp, Info, Menu, X, LogOut, ToggleLeft, ToggleRight, BellRing, CloudOff, Power, AlertCircle } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { AuthPage } from './components/AuthPage';
import { SettingsTab } from './components/SettingsTab';
import { AdminTab } from './components/AdminTab';
import { AIChat } from './components/AIChat';
import { UpgradeModal } from './components/UpgradeModal';
import { BrokerModal } from './components/BrokerModal';
import { NewsFeed } from './components/NewsFeed';
import { UserProfile, Trade, AnalysisResult, BotConfig, UserTier, PaymentGateway, MarketDataPoint, PAIR_CONFIGS, STRATEGIES, BrokerCredentials } from './types';
import { getPrice, resolveBinaryTrade, generateNewsFeed, SignalEngine } from './services/marketService';
import { analyzeMarket } from './services/geminiService';
import { NEXUS_LOGO } from './assets';
import { PERMANENT_KEYS, BOT_DEFAULTS, INITIAL_USER_REGISTRY } from './appConfig';

type View = 'dashboard' | 'ledger' | 'settings' | 'admin';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('nexus_auth') === 'true');
  const [appLogo] = useState<string>(NEXUS_LOGO);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [alertQueue, setAlertQueue] = useState<{id: string, msg: string}[]>([]);
  
  const [user, setUser] = useState<UserProfile | null>(() => {
    try { 
      const saved = localStorage.getItem('nexus_user'); 
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        paymentMethods: parsed.paymentMethods || [],
        history: parsed.history || [],
        stats: parsed.stats || { totalProfit: 0, winRate: 0, drawdown: 0, lossStreak: 0, sessionTrades: 0 }
      };
    } catch { return null; }
  });

  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const isAdmin = user?.role === 'ROOT' && user?.name === PERMANENT_KEYS.ADMIN.ROOT_NAME;
  const effectiveTier = isAdmin ? 'VIP' : (user?.tier || 'BASIC');

  const [config, setConfig] = useState<BotConfig>(() => ({
    isActive: false, isAutoTrade: false, killSwitch: false, pair: BOT_DEFAULTS.DEFAULT_PAIR, tier: effectiveTier,
    strategyId: BOT_DEFAULTS.DEFAULT_STRATEGY, maxDrawdown: BOT_DEFAULTS.MAX_DRAWDOWN, maxLossPercent: 2, riskPerTrade: 10,
    useTrailingStop: false, stakingPlan: BOT_DEFAULTS.STAKING_PLAN as any, binaryExpiry: 1, signalMode: 'BALANCED',
    maxTradesPerSession: 50, coolDownMinutes: 2, useAiSignals: true, useNewsAnalysis: true, minConfidence: 85,
    defaultStopLoss: 2, defaultTakeProfit: 6 
  }));

  const newsFeedItems = useMemo(() => generateNewsFeed(config.pair), [config.pair]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('nexus_auth');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_managed_users');
    setIsAuthenticated(false);
    setUser(null);
    setTrades([]);
    setAnalysis(null);
    window.location.reload(); 
  }, []);

  const toggleMode = () => {
    if (user) {
      const newMode = user.mode === 'PAPER' ? 'LIVE' : 'PAPER';
      if (newMode === 'LIVE' && user.tier === 'BASIC') {
        const id = Date.now().toString();
        setAlertQueue(prev => [...prev, { id, msg: 'LIVE MODE requires PRO Node Provisioning.' }]);
        setTimeout(() => setAlertQueue(prev => prev.filter(a => a.id !== id)), 5000);
        return;
      }
      const updatedUser = { ...user, mode: newMode };
      setUser(updatedUser);
      localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    const ticker = setInterval(() => {
      const price = getPrice(config.pair);
      setCurrentPrice(price);
      setMarketData(prev => {
        const next = [...prev, { time: new Date().toLocaleTimeString(), price, volume: Math.floor(Math.random() * 5000) }];
        return next.slice(-40);
      });
      setTrades(prev => prev.map(t => t.status === 'OPEN' ? resolveBinaryTrade(t, price) : t));
    }, 1000);
    return () => clearInterval(ticker);
  }, [config.pair]);

  useEffect(() => {
    if (!config.isActive || isAnalyzing) return;
    
    // Bot Activation Logic: No verified plan (PRO/VIP) -> No Bot on Live/Advanced
    if (user?.mode === 'LIVE' && user.tier === 'BASIC') {
       setConfig(prev => ({ ...prev, isActive: false }));
       return;
    }

    const analyze = async () => {
      setIsAnalyzing(true);
      try {
        const res = await analyzeMarket(marketData, config.pair, config.tier);
        setAnalysis(res);
        
        if (config.isAutoTrade && res.recommendation !== 'HOLD') {
          const evalResult = SignalEngine.evaluate(res, config, currentPrice);
          const meetsConfidence = res.confidence >= config.minConfidence;
          
          if (!evalResult.isBlocked && meetsConfidence) {
            const newTrade: Trade = {
              id: `TRD-${Date.now()}`, symbol: config.pair, type: res.recommendation,
              price: currentPrice, amount: config.riskPerTrade, timestamp: new Date(),
              status: 'OPEN', mode: user?.mode || 'PAPER', payout: 0.85,
              lotSize: res.suggestedLotSize
            };
            setTrades(p => [newTrade, ...p].slice(0, 50));
            const id = Date.now().toString();
            setAlertQueue(prev => [...prev, { id, msg: `HFT EXECUTION: ${res.recommendation} @ ${res.confidence}%` }]);
            setTimeout(() => setAlertQueue(prev => prev.filter(a => a.id !== id)), 5000);
          }
        }
      } catch (e) {} finally { setIsAnalyzing(false); }
    };

    const interval = setInterval(analyze, 5000); 
    return () => clearInterval(interval);
  }, [config.isActive, config.isAutoTrade, marketData, config.pair, currentPrice, config.tier, user?.mode, config.minConfidence, config.riskPerTrade, user?.tier]);

  if (!isAuthenticated) return <AuthPage onLogin={(isRoot, profile) => {
    const p = { 
      ...profile, 
      id: isRoot ? 'ROOT' : 'NX-'+Math.random().toString(36).substr(2,5).toUpperCase(), 
      tier: isRoot ? 'VIP' : 'BASIC', 
      role: isRoot ? 'ROOT' : 'NONE', 
      balance: 1000, 
      mode: 'PAPER', 
      status: 'ACTIVE', 
      history: [], 
      paymentMethods: [],
      brokerConfig: {
        metaApi: { apiKey: '', apiSecret: '', accountId: '', webhookUrl: 'https://api.nexus.ai/webhook/signals', isActive: false },
        mtPlatform: { login: '', server: '', password: '', eaName: 'Nexus_HFT_Pro.ex5', eaStatus: 'IDLE', isActive: false }
      }
    };
    setUser(p as any);
    setIsAuthenticated(true);
    localStorage.setItem('nexus_auth', 'true');
    localStorage.setItem('nexus_user', JSON.stringify(p));
  }} />;

  const NavItems = () => (
    <div className="flex flex-col h-full gap-2">
      <button onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'dashboard' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><LayoutDashboard className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live HUD</span></button>
      <button onClick={() => { setActiveView('ledger'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'ledger' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><History className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Resolution</span></button>
      <button onClick={() => { setActiveView('settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'settings' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}><Sliders className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cluster Config</span></button>
      {isAdmin && <button onClick={() => { setActiveView('admin'); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'admin' ? 'bg-amber-500 text-black shadow-xl' : 'text-amber-500/60 hover:text-white'}`}><ShieldAlert className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Root Console</span></button>}
      <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-danger hover:bg-danger/10 transition-all mt-auto"><Power className="w-5 h-5" /> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Terminate Node</span></button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Alert Overlay */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-md px-4 pointer-events-none">
        {alertQueue.map(alert => (
          <div key={alert.id} className="bg-surface/80 backdrop-blur-3xl border border-primary/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in pointer-events-auto">
             <div className="p-2 bg-primary/10 rounded-xl">
               <BellRing className="w-4 h-4 text-primary animate-ring" />
             </div>
             <p className="text-[10px] font-black text-white uppercase tracking-widest leading-relaxed">
               {alert.msg}
             </p>
             <button onClick={() => setAlertQueue(prev => prev.filter(a => a.id !== alert.id))} className="ml-auto text-gray-500 hover:text-white">
               <X className="w-4 h-4" />
             </button>
          </div>
        ))}
      </div>

      <aside className="w-72 bg-[#0a101f] border-r border-gray-800 flex-col p-8 gap-10 hidden lg:flex">
        <div className="flex items-center gap-4 px-2">
            <img src={appLogo} alt="Logo" className="w-10 h-10 shadow-2xl rounded-xl" />
            <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">NexusTrade</h1>
        </div>
        <nav className="flex-1">
            <NavItems />
        </nav>
        <div className="p-6 bg-primary/5 border border-primary/20 rounded-[2rem] shadow-inner text-center">
           <p className="text-[8px] text-primary font-black uppercase mb-2 tracking-[0.3em]">HFT Sync Pulse</p>
           <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-[10px] text-white font-black uppercase tracking-widest">Global Clusters Live</span>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
         <header className="h-24 border-b border-gray-800 flex items-center justify-between px-6 lg:px-10 bg-[#0a101f]/80 backdrop-blur-3xl z-40">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-900/50 p-2.5 rounded-3xl border border-gray-800 pr-6 shadow-xl">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
                        <UserCircle className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-tight">{user?.name || "TRADER"}</p>
                      <p className="text-[8px] text-primary font-black uppercase tracking-widest">{user?.tier || "BASIC"} NODE</p>
                    </div>
                </div>
                <button onClick={toggleMode} className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${user?.mode === 'LIVE' ? 'bg-danger/10 border-danger/30 text-danger' : 'bg-success/10 border-success/30 text-success'}`}>
                   <span className="text-[10px] font-black uppercase tracking-widest">{user?.mode === 'LIVE' ? 'LIVE' : 'PAPER'}</span>
                   {user?.mode === 'LIVE' ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                </button>
            </div>
            
            <div className="flex gap-4">
               <button onClick={() => setIsUpgradeModalOpen(true)} className="px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/30">Provision Node</button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-6 lg:p-12 scrollbar-hide space-y-12">
            {activeView === 'dashboard' && user && (
              <div className="flex flex-col xl:flex-row gap-10">
                 <div className="flex-1 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <StatsCard label="Vault Capital" value={`$${user?.balance?.toFixed(2) || '0.00'}`} trend="Synced" icon={Activity} />
                       <StatsCard label="HFT Win Rate" value={`${user?.stats?.winRate || 0}%`} trend="Institutional" icon={Target} color="text-success" />
                       <StatsCard label="Session DD" value={`${user?.stats?.drawdown || 0}%`} trend="Safe" icon={Shield} color="text-danger" />
                    </div>
                    
                    <div className="grid grid-cols-1 2xl:grid-cols-4 gap-10">
                      <div className="2xl:col-span-3">
                        <ChartPanel data={marketData} pair={config.pair} trades={trades} analysis={analysis} />
                      </div>
                      <div className="2xl:col-span-1 h-[480px]">
                        <NewsFeed news={newsFeedItems} />
                      </div>
                    </div>
                    
                    <TradeHistory trades={trades} onExecuteSignal={() => {}} />
                 </div>
                 
                 <div className="xl:w-[450px] shrink-0">
                    <BotStatusPanel analysis={analysis} config={config} user={user} onToggleActive={() => setConfig(c => ({...c, isActive: !c.isActive}))} onToggleAuto={() => setConfig(c => ({...c, isAutoTrade: !c.isAutoTrade}))} isAnalyzing={isAnalyzing} livePrice={currentPrice} />
                 </div>
              </div>
            )}
            {activeView === 'ledger' && <TradeHistory trades={trades} onExecuteSignal={() => {}} />}
            {activeView === 'settings' && user && <SettingsTab config={config} user={user} isAdmin={isAdmin} onUpdateConfig={setConfig} onOpenUpgrade={() => setIsUpgradeModalOpen(true)} onLogout={handleLogout} onUpdateUser={setUser} />}
            {activeView === 'admin' && isAdmin && (
              <AdminTab users={[]} payments={[]} gateways={[]} stats={{ activeNodes: 0, verifiedPayments: 0, totalRevenue: 0, pendingPayments: 0 }} onUpdateGateways={()=>{}} onUpdateUser={()=>{}} onDeleteUser={()=>{}} onVerifyPayment={()=>{}} onUpdateLogo={()=>{}} currentLogo={appLogo} />
            )}
         </div>

         {/* Compliance Footer Disclaimer */}
         <footer className="px-12 py-8 border-t border-gray-800 bg-[#0a101f] text-center">
            <div className="flex items-center justify-center gap-2 text-danger mb-2">
               <AlertCircle className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Global Risk Disclosure</span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold uppercase leading-relaxed max-w-4xl mx-auto italic">
              Trading financial instruments involves significant risk and can result in the loss of your invested capital. NexusTrade AI provides algorithmic analysis but does not guarantee profits. Past performance is not indicative of future results. By using this terminal, you acknowledge that all trading decisions are yours alone.
            </p>
         </footer>
      </main>

      <AIChat marketContext={JSON.stringify(marketData.slice(-5))} config={config} />
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onUpgrade={(tier, gateway) => {
          if (user) {
              const updatedUser = { ...user, tier };
              setUser(updatedUser);
              localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
          }
        }} 
        userEmail={user?.email} 
        userName={user?.name} 
        userId={user?.id} 
      />
      <BrokerModal isOpen={isBrokerModalOpen} onClose={() => setIsBrokerModalOpen(false)} onConnect={(broker) => setUser(u => u ? ({...u, connectedBroker: broker}) : null)} />
    </div>
  );
};

export default App;
