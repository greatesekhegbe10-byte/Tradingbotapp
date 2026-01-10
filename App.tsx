
import React, { useState, useEffect, useCallback } from 'react';
import { Bot, LayoutDashboard, Shield, Zap, ShieldCheck, History, Sliders, Target, Activity, Users, ShieldAlert, Newspaper, TrendingUp, TrendingDown, Info, Cpu, Lock, X, Key, CreditCard, Menu, Eye } from 'lucide-react';
import { StatsCard } from './components/StatsCard';
import { ChartPanel } from './components/ChartPanel';
import { BotStatusPanel } from './components/BotStatusPanel';
import { TradeHistory } from './components/TradeHistory';
import { AuthPage } from './components/AuthPage';
import { SettingsTab } from './components/SettingsTab';
import { AdminTab } from './components/AdminTab';
import { AIChat } from './components/AIChat';
import { BrokerModal } from './components/BrokerModal';
import { UpgradeModal } from './components/UpgradeModal';
import { UserProfile, Trade, AnalysisResult, BotConfig, NewsItem, UserTier, STRATEGIES } from './types';
import { getPrice, resolveBinaryTrade, RiskManager, SignalEngine } from './services/marketService';
import { analyzeMarket } from './services/geminiService';

type View = 'dashboard' | 'ledger' | 'settings' | 'admin';

export interface PaymentLog {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  tier: UserTier;
  bank: 'KUDA' | 'LEAD';
  timestamp: string;
  status: 'VERIFIED' | 'PENDING';
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('nexus_auth') === 'true');
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Admin & Simulation State
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [simulatedTier, setSimulatedTier] = useState<UserTier | null>(null);

  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([
    { id: 'NX-9921', name: 'John Alpha', email: 'john@trading.com', tier: 'PRO', role: 'NONE', balance: 5400, mode: 'LIVE', status: 'ACTIVE', paymentMethods: ['VISA **** 4412'], isLiveAccount: true, staking: { plan: 'FIXED', multiplier: 2, currentStep: 0 }, stats: { totalProfit: 1200, winRate: 68, drawdown: 2, lossStreak: 0, sessionTrades: 12 } },
    { id: 'NX-4412', name: 'Sarah Beta', email: 'sarah@skynet.ai', tier: 'VIP', role: 'NONE', balance: 12500, mode: 'PAPER', status: 'ACTIVE', paymentMethods: ['MASTERCARD **** 9011'], isLiveAccount: false, staking: { plan: 'COMPOUND', multiplier: 3, currentStep: 0 }, stats: { totalProfit: 4500, winRate: 82, drawdown: 1, lossStreak: 0, sessionTrades: 45 } },
  ]);

  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([
    { id: 'TRX-101', userId: 'NX-4412', userName: 'Sarah Beta', amount: 300, tier: 'VIP', bank: 'LEAD', timestamp: '2025-05-15 14:20', status: 'PENDING' },
    { id: 'TRX-102', userId: 'NX-9921', userName: 'John Alpha', amount: 60, tier: 'PRO', bank: 'KUDA', timestamp: '2025-05-16 09:12', status: 'VERIFIED' },
  ]);

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [marketData, setMarketData] = useState<any[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string>('--:--:--');
  
  // TIER LOGIC: Admin (Alex) has no restrictions (VIP equivalent), others use their tier or simulation
  const isAdmin = user?.name === 'Alex' || user?.role === 'ROOT';
  const effectiveTier = isAdmin ? (simulatedTier || 'VIP') : (user?.tier || 'BASIC');

  const [config, setConfig] = useState<BotConfig>(() => ({
    isActive: false, 
    isAutoTrade: false, 
    killSwitch: false, 
    pair: 'EUR/USD', 
    tier: effectiveTier,
    strategyId: 'BASIC_RSI', 
    maxDrawdown: 10, 
    riskPerTrade: 10,
    useTrailingStop: false, 
    stakingPlan: 'FIXED', 
    binaryExpiry: 1,
    signalMode: 'BALANCED', 
    maxTradesPerSession: 50, 
    coolDownMinutes: 2,
    useAiSignals: true, 
    useNewsAnalysis: true, 
    minConfidence: 80,
    defaultStopLoss: 2,
    defaultTakeProfit: 4
  }));

  // Automatically update config tier when simulation or user tier changes
  useEffect(() => {
    setConfig(prev => ({ ...prev, tier: effectiveTier }));
  }, [effectiveTier]);

  const [pairNews, setPairNews] = useState<NewsItem[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isBrokerModalOpen, setIsBrokerModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const ticker = setInterval(() => {
      const price = getPrice(config.pair);
      setCurrentPrice(price);
      setMarketData(prev => {
        const newData = [...prev, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), price }];
        return newData.slice(-40);
      });
      setTrades(prev => prev.map(t => resolveBinaryTrade(t, price)));
    }, 1000);
    return () => clearInterval(ticker);
  }, [config.pair]);

  const performAnalysis = useCallback(async () => {
    if (!config.isActive || isAnalyzing || marketData.length < 5) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMarket(marketData, config.pair, config.tier, ["Policy Shift", "Liquidity Surge"]);
      setAnalysis(result);
      setLastSyncTime(new Date().toLocaleTimeString());
      
      // AI Strategy Selection
      if (config.useAiSignals && result.recommendedStrategyId && result.recommendedStrategyId !== config.strategyId) {
        const recommendedStrat = STRATEGIES.find(s => s.id === result.recommendedStrategyId);
        const tierWeight = { 'BASIC': 0, 'PRO': 1, 'VIP': 2 };
        
        // Admins bypass tier weight check unless simulating
        const hasAccess = isAdmin || (recommendedStrat && tierWeight[config.tier] >= tierWeight[recommendedStrat.tier as UserTier]);
        
        if (recommendedStrat && hasAccess) {
          setConfig(prev => ({ ...prev, strategyId: result.recommendedStrategyId! }));
        }
      }

      if (config.isAutoTrade && config.useAiSignals && result.recommendation !== 'HOLD') {
        const signalBreakdown = SignalEngine.evaluate(result, config);
        const riskResult = RiskManager.canTrade(user!, config, signalBreakdown);
        
        if (riskResult.allowed) {
          const newTrade: Trade = {
            id: Math.random().toString(36).substr(2, 9),
            symbol: config.pair,
            type: result.recommendation === 'BUY' ? 'CALL' : 'PUT' as any,
            price: currentPrice,
            amount: config.riskPerTrade,
            lotSize: result.suggestedLotSize,
            timestamp: new Date(),
            status: 'OPEN',
            mode: user!.mode,
            stopLoss: result.stopLoss,
            takeProfit: result.takeProfit,
            executionLogs: [`Logic Exec: ${result.recommendedStrategyId}`]
          };
          setTrades(prev => [newTrade, ...prev]);
        }
      }
    } catch (e) { 
      console.error("Analysis Link Failed:", e); 
    } finally { 
      setIsAnalyzing(false); 
    }
  }, [config, isAnalyzing, marketData, user, currentPrice, isAdmin]);

  useEffect(() => {
    const aiInterval = setInterval(performAnalysis, 5000);
    return () => clearInterval(aiInterval);
  }, [performAnalysis]);

  const handleLogin = (isRoot: boolean = false) => {
    const profile: UserProfile = {
      id: isRoot ? 'MASTER-ROOT' : 'NX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: isRoot ? 'Alex' : 'Trader',
      email: isRoot ? 'alex.root@nexus.ai' : 'trader@nexus.ai',
      tier: isRoot ? 'VIP' : 'BASIC',
      role: isRoot ? 'ROOT' : 'NONE',
      balance: 10000, mode: 'PAPER', status: 'ACTIVE',
      paymentMethods: isRoot ? ['SECURE_BRIDGE_PROTOCOL'] : ['VISA **** 1190'], 
      staking: { plan: 'FIXED', multiplier: 2.5, currentStep: 0 },
      stats: { totalProfit: 0, winRate: 0, drawdown: 0, lossStreak: 0, sessionTrades: 0 },
      isLiveAccount: false,
      connectedBroker: 'MT5 Institutional'
    };
    setUser(profile);
    setIsAuthenticated(true);
    localStorage.setItem('nexus_auth', 'true');
    localStorage.setItem('nexus_user', JSON.stringify(profile));
    if(isRoot) setConfig(c => ({...c, tier: 'VIP'}));
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasscodeInput === '09162502987') {
      setIsAdminVerified(true);
      setShowAdminPasscode(false);
      setActiveView('admin');
      setAdminPasscodeInput('');
    } else {
      alert("UNAUTHORIZED ACCESS ATTEMPT.");
      setAdminPasscodeInput('');
    }
  };

  const handleUpgrade = (tier: UserTier) => {
    if (!user) return;
    const updatedUser = { ...user, tier };
    setUser(updatedUser);
    setConfig(c => ({ ...c, tier }));
    localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
  };

  if (!isAuthenticated) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className={`min-h-screen bg-[#070b14] text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans ${isAdmin ? 'border-4 border-accent/20' : ''}`}>
      
      {/* ADMIN PASSCODE MODAL */}
      {showAdminPasscode && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
           <div className="bg-[#0a101f] border border-accent/30 w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowAdminPasscode(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X /></button>
              <div className="flex flex-col items-center mb-8">
                 <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center mb-4">
                    <Lock className="w-8 h-8 text-accent" />
                 </div>
                 <h2 className="text-xl font-black text-white uppercase tracking-tighter">Admin Vault</h2>
                 <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Authorization Code Required</p>
              </div>
              <form onSubmit={handleAdminAuth} className="space-y-6">
                 <div className="relative group">
                    <Key className="absolute left-4 top-4 w-4 h-4 text-accent" />
                    <input 
                      type="password" 
                      value={adminPasscodeInput}
                      onChange={(e) => setAdminPasscodeInput(e.target.value)}
                      placeholder="Passcode"
                      autoFocus
                      className="w-full bg-black border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 text-white text-center font-mono tracking-[0.4em] focus:border-accent outline-none"
                    />
                 </div>
                 <button type="submit" className="w-full py-4 bg-accent text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-accent/80 transition-all">Unlock Hub</button>
              </form>
           </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`w-full md:w-20 lg:w-72 bg-[#0a101f] border-r md:flex flex-col p-6 gap-8 z-50 hidden ${isAdmin ? 'border-accent/40 bg-accent/5' : 'border-gray-800'}`}>
        <div className="flex items-center gap-4 px-2">
            <div className={`p-3 rounded-2xl shadow-xl ${isAdmin ? 'bg-accent/20' : 'bg-primary/20'}`}>
               <Bot className={`w-8 h-8 ${isAdmin ? 'text-accent' : 'text-primary'}`} />
            </div>
            <div className="hidden lg:block">
               <h1 className="text-xl font-black text-white uppercase tracking-tighter">Nexus AI</h1>
               <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${isAdmin ? 'text-accent' : 'text-gray-500'}`}>
                 {isAdmin ? 'Alex Protocol' : 'Trader Hub'}
               </span>
            </div>
        </div>
        <nav className="flex-1 space-y-2">
            <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'dashboard' ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'text-gray-500 hover:text-white'}`}>
               <LayoutDashboard className="w-5 h-5" />
               <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Dashboard</span>
            </button>
            <button onClick={() => setActiveView('ledger')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'ledger' ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'text-gray-500 hover:text-white'}`}>
               <History className="w-5 h-5" />
               <span className="hidden lg:block text-xs font-black uppercase tracking-widest">History</span>
            </button>
            <button onClick={() => setActiveView('settings')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'settings' ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'text-gray-500 hover:text-white'}`}>
               <Sliders className="w-5 h-5" />
               <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Settings</span>
            </button>
            
            {isAdmin && (
               <button 
                onClick={() => isAdminVerified ? setActiveView('admin') : setShowAdminPasscode(true)} 
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'admin' ? 'bg-accent text-white shadow-2xl shadow-accent/20' : 'text-accent/50 hover:text-accent'}`}
               >
                  <Lock className="w-5 h-5" />
                  <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Admin Hub</span>
               </button>
            )}
        </nav>
      </aside>

      {/* Main UI */}
      <main className="flex-1 relative flex flex-col overflow-hidden pb-20 md:pb-0">
         <header className="h-20 md:h-24 border-b border-gray-800 flex items-center justify-between px-6 md:px-10 bg-[#0a101f]/50 backdrop-blur-3xl z-40">
            <div>
               <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-1">Execution Node</h2>
               <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-success animate-pulse' : 'bg-gray-600'}`}></div>
                  <span className="text-base md:text-lg font-black text-white tracking-tighter uppercase">{config.pair} <span className="text-gray-600 font-medium hidden sm:inline">/ USD</span></span>
               </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
               {/* Simulation Toggle for Admin */}
               {isAdmin && (
                 <div className="hidden lg:flex bg-gray-900 border border-gray-800 p-1 rounded-xl items-center gap-1">
                    <span className="px-2 text-[8px] font-black text-accent uppercase flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> Simulation</span>
                    {(['BASIC', 'PRO', 'VIP'] as UserTier[]).map(t => (
                      <button 
                        key={t}
                        onClick={() => setSimulatedTier(simulatedTier === t ? null : t)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${simulatedTier === t ? 'bg-accent text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        {t}
                      </button>
                    ))}
                 </div>
               )}

               <div className="text-right hidden sm:block">
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Sync Time</p>
                  <p className="text-sm font-mono font-black text-primary">{lastSyncTime}</p>
               </div>
               {!isAdmin && <button onClick={() => setIsUpgradeModalOpen(true)} className="px-5 py-3 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5">Upgrade</button>}
               <button onClick={() => setIsBrokerModalOpen(true)} className={`p-3 border rounded-xl transition-all ${isAdmin ? 'bg-accent/10 border-accent/20 text-accent hover:bg-accent hover:text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                 <Zap className="w-5 h-5" />
               </button>
            </div>
         </header>

         <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
            {activeView === 'dashboard' && (
              <div className="grid grid-cols-12 gap-8">
                 <div className="col-span-12 xl:col-span-8 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                       <StatsCard label="Net Profit" value={`$${user?.stats.totalProfit.toFixed(2)}`} trend="14.2%" trendUp icon={Activity} />
                       <StatsCard label="Win Rate" value={`${user?.stats.winRate}%`} trend="3.5%" trendUp icon={Target} color="text-success" />
                       <StatsCard label="Session Drawdown" value={`${user?.stats.drawdown}%`} trend="0.8%" icon={Shield} color="text-danger" />
                    </div>
                    
                    <div className="bg-surface p-6 rounded-[2rem] border border-gray-800 shadow-xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-accent/20 rounded-2xl"><Cpu className="w-6 h-6 text-accent" /></div>
                          <div>
                             <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Active Intelligence Logic</p>
                             <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-white uppercase tracking-tighter">
                                   {STRATEGIES.find(s => s.id === config.strategyId)?.name || "Neural RSI Momentum"}
                                </h3>
                                {config.useAiSignals && (
                                    <span className="flex items-center gap-1 bg-primary/10 text-primary text-[8px] font-black uppercase px-2 py-0.5 rounded border border-primary/20">
                                       <Zap className="w-2 h-2" /> AI Optimized
                                    </span>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="text-[9px] font-black text-accent uppercase tracking-widest bg-accent/10 px-4 py-2 rounded-full border border-accent/20">
                          {effectiveTier} Tier Active
                       </div>
                    </div>

                    <ChartPanel data={marketData} pair={config.pair} trades={trades} analysis={analysis} />
                    <TradeHistory trades={trades} onExecuteSignal={() => {}} />
                 </div>
                 <div className="col-span-12 xl:col-span-4 h-full">
                    <BotStatusPanel 
                      analysis={analysis} 
                      config={config} 
                      userTier={effectiveTier} 
                      onToggleActive={() => setConfig(c => ({...c, isActive: !c.isActive}))}
                      onToggleAuto={() => setConfig(c => ({...c, isAutoTrade: !c.isAutoTrade}))}
                      isAnalyzing={isAnalyzing}
                      livePrice={currentPrice}
                    />
                 </div>
              </div>
            )}
            
            {activeView === 'ledger' && <TradeHistory trades={trades} onExecuteSignal={() => {}} />}
            {activeView === 'settings' && <SettingsTab config={config} user={user!} isAdmin={isAdmin} onUpdateConfig={setConfig} onOpenUpgrade={() => setIsUpgradeModalOpen(true)} />}
            {activeView === 'admin' && isAdmin && (
              <AdminTab 
                users={managedUsers} 
                payments={paymentLogs} 
                onUpdateUser={(id, up) => setManagedUsers(prev => prev.map(u => u.id === id ? {...u, ...up} : u))} 
                onVerifyPayment={(id) => setPaymentLogs(prev => prev.map(p => p.id === id ? {...p, status: 'VERIFIED'} : p))}
              />
            )}
         </div>
      </main>

      <AIChat marketContext={JSON.stringify(marketData.slice(-5))} config={config} />
      
      <BrokerModal 
        isOpen={isBrokerModalOpen} 
        onClose={() => setIsBrokerModalOpen(false)} 
        onConnect={(broker, isLive, type) => {
          if(!user) return;
          const updatedUser = { ...user, connectedBroker: broker, isLiveAccount: isLive, mode: (isLive ? 'LIVE' : 'PAPER') as any };
          setUser(updatedUser);
          localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
        }} 
      />

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        onUpgrade={handleUpgrade} 
      />
    </div>
  );
};

export default App;
