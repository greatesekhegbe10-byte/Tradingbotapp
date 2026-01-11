
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutDashboard, Shield, Zap, ShieldCheck, History, Sliders, Target, Activity, Users, ShieldAlert, Newspaper, TrendingUp, TrendingDown, Info, Cpu, Lock, X, Key, CreditCard, Menu, Eye, Bell, UserCircle, Globe } from 'lucide-react';
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
import { UserProfile, Trade, AnalysisResult, BotConfig, NewsItem, UserTier, STRATEGIES, PaymentGateway, GatewayConfig, MarketDataPoint } from './types';
import { getPrice, resolveBinaryTrade, RiskManager, SignalEngine } from './services/marketService';
import { analyzeMarket } from './services/geminiService';
import { NEXUS_LOGO } from './assets';

type View = 'dashboard' | 'ledger' | 'settings' | 'admin';

export interface PaymentLog {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  tier: UserTier;
  gateway: PaymentGateway;
  timestamp: string;
  status: 'VERIFIED' | 'PENDING' | 'FAILED';
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('nexus_auth') === 'true');
  const [appLogo, setAppLogo] = useState<string>(() => localStorage.getItem('nexus_custom_logo') || NEXUS_LOGO);
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([
    { id: 'NX-9921', name: 'John Alpha', email: 'john@trading.com', tier: 'PRO', role: 'NONE', balance: 5400, mode: 'LIVE', status: 'ACTIVE', paymentMethods: ['VISA **** 4412'], isLiveAccount: true, staking: { plan: 'FIXED', multiplier: 2, currentStep: 0 }, stats: { totalProfit: 1200, winRate: 68, drawdown: 2, lossStreak: 0, sessionTrades: 12 } },
    { id: 'NX-4412', name: 'Sarah Beta', email: 'sarah@skynet.ai', tier: 'VIP', role: 'NONE', balance: 12500, mode: 'PAPER', status: 'ACTIVE', paymentMethods: ['MASTERCARD **** 9011'], isLiveAccount: false, staking: { plan: 'COMPOUND', multiplier: 3, currentStep: 0 }, stats: { totalProfit: 4500, winRate: 82, drawdown: 1, lossStreak: 0, sessionTrades: 45 } },
    { id: 'NX-1102', name: 'James Kuda', email: 'james@kuda.ng', tier: 'BASIC', role: 'NONE', balance: 1000, mode: 'PAPER', status: 'ACTIVE', paymentMethods: [], isLiveAccount: false, staking: { plan: 'FIXED', multiplier: 1, currentStep: 0 }, stats: { totalProfit: 0, winRate: 0, drawdown: 0, lossStreak: 0, sessionTrades: 0 } },
  ]);

  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([
    { id: 'TRX-PAY-101', userId: 'NX-4412', userName: 'Sarah Beta', amount: 300, tier: 'VIP', gateway: 'PAYSTACK', timestamp: '2025-05-15 14:20', status: 'VERIFIED' },
    { id: 'TRX-FLW-102', userId: 'NX-9921', userName: 'John Alpha', amount: 60, tier: 'PRO', gateway: 'FLUTTERWAVE', timestamp: '2025-05-16 09:12', status: 'VERIFIED' },
  ]);

  const [gatewayConfigs, setGatewayConfigs] = useState<GatewayConfig[]>([
    { name: 'PAYSTACK', publicKey: 'pk_live_0000000000000', secretKey: 'sk_live_1111111111111', webhookUrl: 'https://api.nexus.ai/webhooks/paystack', isActive: true },
    { name: 'FLUTTERWAVE', publicKey: 'FLWPUBK-0000000000000', secretKey: 'FLWSECK-1111111111111', webhookUrl: 'https://api.nexus.ai/webhooks/flutterwave', isActive: true },
  ]);

  const [activeView, setActiveView] = useState<View>('dashboard');
  const [marketData, setMarketData] = useState<MarketDataPoint[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Only "Alex" with ROOT role gets Admin Access
  const isAdmin = user?.role === 'ROOT' && user?.name === 'Alex';
  const effectiveTier = isAdmin ? 'VIP' : (user?.tier || 'BASIC');

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

  const stats = {
    activeNodes: managedUsers.filter(u => u.status === 'ACTIVE').length,
    verifiedPayments: paymentLogs.filter(p => p.status === 'VERIFIED').length,
    totalRevenue: paymentLogs.filter(p => p.status === 'VERIFIED').reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: paymentLogs.filter(p => p.status === 'PENDING').length
  };

  const updateGateways = (configs: GatewayConfig[]) => {
    setGatewayConfigs(configs);
  };

  useEffect(() => {
    setConfig(prev => ({ ...prev, tier: effectiveTier }));
  }, [effectiveTier]);

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
        const newData: MarketDataPoint[] = [...prev, { 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 
          price,
          volume: Math.floor(Math.random() * 10000 + 5000)
        }];
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
      const result = await analyzeMarket(marketData, config.pair, config.tier);
      setAnalysis(result);
      
      if (config.isAutoTrade && result.recommendation !== 'HOLD') {
        const signalBreakdown = SignalEngine.evaluate(result, config);
        const riskResult = RiskManager.canTrade(user!, config, signalBreakdown);
        
        if (riskResult.allowed) {
          const newTrade: Trade = {
            id: Math.random().toString(36).substr(2, 9),
            symbol: config.pair,
            type: result.recommendation === 'BUY' ? 'CALL' : 'PUT' as any,
            price: currentPrice,
            amount: config.riskPerTrade,
            timestamp: new Date(),
            status: 'OPEN',
            mode: user!.mode,
            executionLogs: [`Node: ${config.strategyId}`]
          };
          setTrades(prev => [newTrade, ...prev]);
        }
      }
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  }, [config, isAnalyzing, marketData, user, currentPrice]);

  useEffect(() => {
    const aiInterval = setInterval(performAnalysis, 5000);
    return () => clearInterval(aiInterval);
  }, [performAnalysis]);

  const handleLogin = (isRoot: boolean = false, customProfile?: any) => {
    const profile: UserProfile = {
      id: isRoot ? 'MASTER-ROOT' : 'NX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: customProfile?.displayName || (isRoot ? 'Alex' : 'Trader'),
      email: customProfile?.email || (isRoot ? 'alex.root@nexus.ai' : 'trader@nexus.ai'),
      photoURL: customProfile?.photoURL,
      tier: isRoot ? 'VIP' : 'BASIC',
      role: isRoot ? 'ROOT' : 'NONE',
      balance: isRoot ? 1000000 : 10000, 
      mode: 'PAPER', 
      status: 'ACTIVE',
      paymentMethods: isRoot ? ['SECURE_BRIDGE_PROTOCOL'] : ['VISA **** 1190'], 
      staking: { plan: 'FIXED', multiplier: 2.5, currentStep: 0 },
      stats: { totalProfit: 0, winRate: 0, drawdown: 0, lossStreak: 0, sessionTrades: 0 },
      isLiveAccount: false,
    };
    setUser(profile);
    setIsAuthenticated(true);
    localStorage.setItem('nexus_auth', 'true');
    localStorage.setItem('nexus_user', JSON.stringify(profile));
    if(isRoot) setConfig(c => ({...c, tier: 'VIP'}));
  };

  const handleUpdateLogo = (newLogo: string) => {
    setAppLogo(newLogo);
    localStorage.setItem('nexus_custom_logo', newLogo);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('nexus_auth');
    localStorage.removeItem('nexus_user');
  };

  if (!isAuthenticated) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className={`min-h-screen bg-[#070b14] text-gray-100 flex flex-col md:flex-row overflow-hidden font-sans ${isAdmin ? 'border-4 border-amber-500/20' : ''}`}>
      
      {/* Sidebar */}
      <aside className={`w-full md:w-20 lg:w-72 bg-[#0a101f] border-r md:flex flex-col p-6 gap-8 z-50 hidden ${isAdmin ? 'border-amber-500/30 bg-amber-500/5' : 'border-gray-800'}`}>
        <div className="flex items-center gap-4 px-2">
            <div className={`p-2 rounded-2xl shadow-xl transition-all hover:scale-105`}>
               <img src={appLogo} alt="Nexus" className="w-10 h-10" />
            </div>
            <div className="hidden lg:block">
               <h1 className="text-xl font-black text-white uppercase tracking-tighter">NexusTrade</h1>
               <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 ${isAdmin ? 'text-amber-500' : 'text-gray-500'}`}>
                 HFT Protocol v3.6
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
               <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Ledger</span>
            </button>
            <button onClick={() => setActiveView('settings')} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'settings' ? 'bg-primary text-white shadow-2xl shadow-primary/20' : 'text-gray-500 hover:text-white'}`}>
               <Sliders className="w-5 h-5" />
               <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Settings</span>
            </button>
            
            {isAdmin && (
               <button 
                onClick={() => setActiveView('admin')} 
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeView === 'admin' ? 'bg-amber-500 text-black shadow-2xl shadow-amber-500/20' : 'text-amber-500/60 hover:text-amber-500'}`}
               >
                  <ShieldAlert className="w-5 h-5" />
                  <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Admin Hub</span>
               </button>
            )}
        </nav>

        {/* Live Status */}
        <div className="hidden lg:flex flex-col gap-3 mt-auto border-t border-gray-800 pt-6">
            <div className="flex items-center justify-between mb-1 px-2">
                <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Live Nodes</span>
                </div>
                <span className="text-[10px] font-mono font-black text-success animate-pulse">{stats.activeNodes}</span>
            </div>
            <button onClick={handleLogout} className="mt-4 p-4 w-full bg-red-500/10 border border-red-500/20 rounded-2xl text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all">
                Disconnect Node
            </button>
        </div>
      </aside>

      {/* Main UI */}
      <main className="flex-1 relative flex flex-col overflow-hidden pb-20 md:pb-0">
         <header className="h-20 md:h-24 border-b border-gray-800 flex items-center justify-between px-6 md:px-10 bg-[#0a101f]/50 backdrop-blur-3xl z-40">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-gray-900/50 p-2 rounded-2xl border border-gray-800 pr-5">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="P" className="w-8 h-8 rounded-full border border-primary/40 object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary"><UserCircle /></div>
                    )}
                    <div>
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Node Holder</p>
                        <p className="text-[11px] font-black text-white uppercase">{user?.name}</p>
                    </div>
                </div>
                <div className="hidden lg:flex flex-col border-l border-gray-800 pl-4">
                    <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Asset Stream</span>
                    <span className="text-[13px] font-black text-white uppercase tracking-tighter">{config.pair}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
               <button onClick={() => setIsUpgradeModalOpen(true)} className="px-5 py-3 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-xl shadow-primary/5">Upgrade</button>
               <button onClick={() => setIsBrokerModalOpen(true)} className={`p-3 border rounded-xl transition-all ${isAdmin ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-black' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                 <Globe className="w-5 h-5" />
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
                       <StatsCard label="Drawdown" value={`${user?.stats.drawdown}%`} trend="0.8%" icon={Shield} color="text-danger" />
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
                gateways={gatewayConfigs}
                stats={stats}
                onUpdateGateways={updateGateways}
                onUpdateUser={(id, up) => setManagedUsers(prev => prev.map(u => u.id === id ? {...u, ...up} : u))} 
                onDeleteUser={(id) => setManagedUsers(prev => prev.filter(u => u.id !== id))}
                onVerifyPayment={(id) => setPaymentLogs(prev => prev.map(p => p.id === id ? {...p, status: 'VERIFIED'} : p))}
                onUpdateLogo={handleUpdateLogo}
                currentLogo={appLogo}
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
        onUpgrade={(tier, gateway) => {
          if (!user) return;
          const updatedUser = { ...user, tier };
          setUser(updatedUser);
          setConfig(c => ({ ...c, tier }));
          localStorage.setItem('nexus_user', JSON.stringify(updatedUser));
        }}
        userEmail={user?.email}
        userId={user?.id}
      />
    </div>
  );
};

export default App;
