
import React, { useState, useMemo } from 'react';
import { 
  Cpu, ShieldCheck, Globe, Key, Zap, 
  Lock, Check, BarChart, Landmark, ShieldAlert,
  History, Eye, EyeOff, ToggleLeft, ToggleRight, 
  Settings2, Sliders, Server, Search, Layers, Star,
  Crown, CreditCard, ChevronRight, LogOut, Radio, Terminal, Webhook, Upload, CloudLightning, Activity
} from 'lucide-react';
import { BotConfig, UserProfile, STRATEGIES, StakingPlan, UserTier, PAIR_CONFIGS, BROKER_ASSET_MAP, BINARY_BROKERS, INSTITUTIONAL_BROKERS, CRYPTO_BROKERS, ConnectionMethod, BrokerCredentials } from '../types';

interface SettingsTabProps {
  config: BotConfig;
  user: UserProfile;
  isAdmin: boolean;
  onUpdateConfig: (config: BotConfig) => void;
  onOpenUpgrade?: () => void;
  onLogout?: () => void;
  onUpdateUser?: (user: UserProfile) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ config, user, isAdmin, onUpdateConfig, onOpenUpgrade, onLogout, onUpdateUser }) => {
  const tierWeight = { 'BASIC': 0, 'PRO': 1, 'VIP': 2 };
  const currentTierWeight = isAdmin ? 2 : (tierWeight[user.tier] || 0);

  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const [activeBrokerType, setActiveBrokerType] = useState<'BINARY' | 'MT5' | 'CRYPTO'>(user.brokerType?.includes('BINARY') ? 'BINARY' : 'MT5');
  const [brokerSearch, setBrokerSearch] = useState('');

  const [brokerConfig, setBrokerConfig] = useState<BrokerCredentials>(user.brokerConfig || {
    metaApi: { apiKey: '', apiSecret: '', accountId: '', webhookUrl: 'https://api.nexus.ai/webhook/signals', isActive: false },
    mtPlatform: { login: '', server: '', eaName: 'Nexus_HFT_Pro.ex5', eaStatus: 'IDLE', isActive: false }
  });

  const triggerSave = (newConfig: BotConfig) => {
    setSaveStatus('SAVING');
    onUpdateConfig(newConfig);
    setTimeout(() => {
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 1500);
    }, 400);
  };

  const saveDualConfig = () => {
    setSaveStatus('SAVING');
    if (onUpdateUser) {
        onUpdateUser({ ...user, brokerConfig });
    }
    setTimeout(() => {
        setSaveStatus('SAVED');
        setTimeout(() => setSaveStatus('IDLE'), 1500);
    }, 800);
  };

  const currentBrokerList = useMemo(() => {
    const list = activeBrokerType === 'BINARY' ? BINARY_BROKERS : activeBrokerType === 'MT5' ? INSTITUTIONAL_BROKERS : CRYPTO_BROKERS;
    return list.filter(b => b.toLowerCase().includes(brokerSearch.toLowerCase()));
  }, [activeBrokerType, brokerSearch]);

  const updateBrokerConnection = (broker: string, type: ConnectionMethod) => {
    if (onUpdateUser) {
        onUpdateUser({ ...user, connectedBroker: broker, brokerType: type, brokerConfig });
        setSaveStatus('SAVED');
        setTimeout(() => setSaveStatus('IDLE'), 1500);
    }
  };

  const handleBrokerModeToggle = () => {
    if (!onUpdateUser) return;
    const newMode = user.mode === 'PAPER' ? 'LIVE' : 'PAPER';
    
    // Enforcement check
    if (newMode === 'LIVE' && user.tier === 'BASIC') {
      alert("UPGRADE REQUIRED: Live execution is restricted to PRO Grade nodes.");
      return;
    }

    onUpdateUser({ ...user, mode: newMode });
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-32 px-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Settings2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter">Terminal Hub</h1>
          </div>
          <p className="text-gray-500 font-black uppercase tracking-[0.4em] text-[10px] flex items-center gap-2 leading-relaxed">
            Institutional Configuration Interface
          </p>
        </div>

        <div className="flex items-center gap-4 bg-gray-900/50 p-2 rounded-2xl border border-gray-800">
           <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${
             saveStatus === 'SAVED' ? 'bg-success/10 border-success/30 text-success' : 'bg-gray-800/50 border-gray-700 text-gray-400'
           }`}>
              <div className={`w-2 h-2 rounded-full ${saveStatus === 'SAVING' ? 'bg-amber-500 animate-pulse' : saveStatus === 'SAVED' ? 'bg-success' : 'bg-gray-600'}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest">{saveStatus === 'SAVING' ? 'Syncing...' : saveStatus === 'SAVED' ? 'Protocol Saved' : 'Cloud Link Active'}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* BROKER NODE SELECTOR & MODE */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent/20 rounded-2xl"><Globe className="w-6 h-6 text-accent" /></div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Cluster Registry</h2>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Select Active Connection Node</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-gray-900/40 p-2 rounded-2xl border border-gray-800">
                   <div className="flex items-center gap-3 px-4 py-2">
                      <Activity className={`w-4 h-4 ${user.mode === 'LIVE' ? 'text-danger' : 'text-success'}`} />
                      <div>
                        <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Broker Mode</p>
                        <p className={`text-[10px] font-black uppercase ${user.mode === 'LIVE' ? 'text-danger' : 'text-success'}`}>
                          {user.mode === 'LIVE' ? 'Live Execution' : 'Paper/Demo'}
                        </p>
                      </div>
                   </div>
                   <button onClick={handleBrokerModeToggle} className="p-1">
                      {user.mode === 'LIVE' ? <ToggleRight className="w-8 h-8 text-danger" /> : <ToggleLeft className="w-8 h-8 text-success" />}
                   </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex bg-gray-900 p-1.5 rounded-2xl border border-gray-800 flex-1">
                      {['BINARY', 'MT5', 'CRYPTO'].map(type => (
                          <button 
                              key={type}
                              onClick={() => setActiveBrokerType(type as any)}
                              className={`flex-1 py-3 text-[9px] font-black rounded-xl uppercase transition-all tracking-widest ${activeBrokerType === type ? 'bg-primary text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                          >
                              {type}
                          </button>
                      ))}
                  </div>
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                      <input 
                          type="text" 
                          placeholder="Filter Brokers..." 
                          value={brokerSearch}
                          onChange={e => setBrokerSearch(e.target.value)}
                          className="bg-gray-900 border border-gray-800 rounded-xl py-2 pl-8 pr-4 text-[9px] font-black uppercase text-white outline-none focus:border-accent transition-all w-48"
                      />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                    {currentBrokerList.map(broker => {
                        const isSelected = user.connectedBroker === broker;
                        return (
                            <button 
                                key={broker}
                                onClick={() => updateBrokerConnection(broker, activeBrokerType === 'MT5' ? 'MT5_EA' : 'BINARY_API')}
                                className={`text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between group/item ${isSelected ? 'bg-primary/10 border-primary text-white' : 'bg-gray-900/40 border-gray-800 text-gray-600 hover:border-gray-700'}`}
                            >
                                <span className="text-[9px] font-black uppercase tracking-tight truncate">{broker}</span>
                                {isSelected ? (
                                    <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
                                ) : (
                                    <Radio className="w-3 h-3 text-gray-800 group-hover/item:text-gray-600" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
          </section>

          {/* DUAL INTEGRATION CONFIGURATION */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/20 rounded-2xl"><CloudLightning className="w-6 h-6 text-primary" /></div>
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Dual Engine Bridge</h2>
                   <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Simultaneous Meta API & MT4/MT5 EA Node</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Meta API / Binary Options */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <Webhook className="w-4 h-4 text-primary" /> Binary (Meta API)
                        </h3>
                        <button onClick={() => setBrokerConfig(c => ({...c, metaApi: {...c.metaApi, isActive: !c.metaApi.isActive}}))}>
                            {brokerConfig.metaApi.isActive ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8 text-gray-700" />}
                        </button>
                    </div>
                    
                    <div className="space-y-4 opacity-90">
                        <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input 
                                type="text" placeholder="Meta API Key" 
                                value={brokerConfig.metaApi.apiKey}
                                onChange={e => setBrokerConfig(c => ({...c, metaApi: {...c.metaApi, apiKey: e.target.value}}))}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-white outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input 
                                type="password" placeholder="API Secret" 
                                value={brokerConfig.metaApi.apiSecret}
                                onChange={e => setBrokerConfig(c => ({...c, metaApi: {...c.metaApi, apiSecret: e.target.value}}))}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-white outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input 
                                type="text" placeholder="Meta Account ID" 
                                value={brokerConfig.metaApi.accountId}
                                onChange={e => setBrokerConfig(c => ({...c, metaApi: {...c.metaApi, accountId: e.target.value}}))}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-white outline-none focus:border-primary transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* MT4/MT5 Platform */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                           <Landmark className="w-4 h-4 text-accent" /> MT4/MT5 EA Node
                        </h3>
                        <button onClick={() => setBrokerConfig(c => ({...c, mtPlatform: {...c.mtPlatform, isActive: !c.mtPlatform.isActive}}))}>
                            {brokerConfig.mtPlatform.isActive ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8 text-gray-700" />}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Radio className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input 
                                type="text" placeholder="Account Login" 
                                value={brokerConfig.mtPlatform.login}
                                onChange={e => setBrokerConfig(c => ({...c, mtPlatform: {...c.mtPlatform, login: e.target.value}}))}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-white outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="relative">
                            <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input 
                                type="text" placeholder="Trading Server" 
                                value={brokerConfig.mtPlatform.server}
                                onChange={e => setBrokerConfig(c => ({...c, mtPlatform: {...c.mtPlatform, server: e.target.value}}))}
                                className="w-full bg-black/40 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-[10px] font-mono text-white outline-none focus:border-primary transition-all"
                            />
                        </div>
                        <div className="p-6 bg-gray-900/60 rounded-2xl border border-gray-800 border-dashed group-hover:border-primary/40 transition-all cursor-pointer">
                            <div className="flex flex-col items-center justify-center gap-3 text-center">
                                <Upload className="w-6 h-6 text-gray-600 group-hover:text-primary animate-bounce" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Load EA Profile</span>
                                <span className="text-[8px] text-primary/40 uppercase font-black">{brokerConfig.mtPlatform.eaName}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-[9px] text-gray-600 font-bold uppercase leading-relaxed max-w-md italic text-center md:text-left">
                    Node synchronization uses an encrypted bridge. Ensure your API keys have "Trade" permissions enabled for seamless HFT operations.
                </p>
                <button onClick={saveDualConfig} className="w-full md:w-auto px-10 py-4 bg-primary text-white text-[10px] font-black uppercase rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                   Hard-Sync Hub
                </button>
            </div>
          </section>

          {/* NEURAL STRATEGY ENGINE */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-2xl"><Cpu className="w-6 h-6 text-primary" /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Neural Logic Engine</h2>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Select Strategy Protocol</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Auto-Pilot</span>
                <button onClick={() => triggerSave({...config, isAutoTrade: !config.isAutoTrade})}>
                  {config.isAutoTrade ? <ToggleRight className="w-8 h-8 text-success" /> : <ToggleLeft className="w-8 h-8 text-gray-600" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {STRATEGIES.map(strat => {
                const isLocked = !isAdmin && currentTierWeight < tierWeight[strat.tier as UserTier];
                const isActive = config.strategyId === strat.id;
                
                return (
                  <div 
                    key={strat.id}
                    onClick={() => !isLocked && triggerSave({...config, strategyId: strat.id})}
                    className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between ${
                      isActive ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                    } ${isLocked ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {isLocked && <div className="absolute top-4 right-4"><Lock className="w-4 h-4 text-gray-600" /></div>}
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">{strat.name}</h3>
                        <span className="text-[9px] font-black text-success uppercase">WR {strat.winRate}%</span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed mb-4">{strat.description}</p>
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded ${
                         strat.tier === 'VIP' ? 'bg-purple-500/20 text-purple-400' : 
                         strat.tier === 'PRO' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'
                       }`}>{strat.tier} GRADE</span>
                       {isActive && <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg"><Check className="w-4 h-4 text-white" /></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* RISK & CAPITAL NODE */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-success/20 rounded-2xl"><ShieldCheck className="w-6 h-6 text-success" /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Risk Guard</h2>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Global Drawdown Cap</label>
                    <span className="text-lg font-mono font-black text-primary">{config.maxDrawdown}%</span>
                 </div>
                 <input 
                    type="range" min="1" max="50" step="1"
                    value={config.maxDrawdown}
                    onChange={(e) => triggerSave({...config, maxDrawdown: parseInt(e.target.value)})}
                    className="w-full accent-primary h-2 bg-gray-800 rounded-full cursor-pointer"
                 />
              </div>

              <div className="pt-6 border-t border-gray-800">
                 <label className="text-[10px] text-gray-500 font-black uppercase block mb-4 tracking-widest">Capital Protocol</label>
                 <div className="grid grid-cols-2 gap-3">
                    {(['FIXED', 'MARTINGALE', 'FIBONACCI', 'COMPOUND'] as StakingPlan[]).map(plan => (
                      <button 
                        key={plan}
                        onClick={() => triggerSave({...config, stakingPlan: plan})}
                        className={`py-4 rounded-xl text-[9px] font-black uppercase border transition-all ${
                          config.stakingPlan === plan ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-900 border-gray-700 text-gray-500'
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
          </section>

          {/* SESSION CONTROL */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-danger/20 rounded-2xl"><ShieldAlert className="w-6 h-6 text-danger" /></div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Neural Session</h2>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed mb-6">
                Terminating the session will immediately disconnect all cloud bridges and clear your local identity node.
            </p>
            <button 
              onClick={onLogout}
              className="w-full py-5 bg-danger/10 border border-danger/30 text-danger text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-danger hover:text-white transition-all flex items-center justify-center gap-4 shadow-xl shadow-danger/10"
            >
                <LogOut className="w-4 h-4" /> Terminate Node
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};
