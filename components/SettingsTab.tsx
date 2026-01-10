
import React, { useState, useMemo } from 'react';
import { 
  Cpu, ShieldCheck, Globe, Key, Zap, 
  Lock, Check, BarChart, Landmark, ShieldAlert,
  History, Eye, EyeOff, ToggleLeft, ToggleRight, 
  Settings2, Sliders, Server, Search, Layers, Star,
  Crown, CreditCard, ChevronRight
} from 'lucide-react';
import { BotConfig, UserProfile, STRATEGIES, StakingPlan, UserTier, PAIR_CONFIGS, BROKER_ASSET_MAP } from '../types';

interface SettingsTabProps {
  config: BotConfig;
  user: UserProfile;
  isAdmin: boolean;
  onUpdateConfig: (config: BotConfig) => void;
  onOpenUpgrade?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ config, user, isAdmin, onUpdateConfig, onOpenUpgrade }) => {
  const tierWeight = { 'BASIC': 0, 'PRO': 1, 'VIP': 2 };
  const currentTierWeight = isAdmin ? 2 : (tierWeight[user.tier] || 0);

  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const [assetSearch, setAssetSearch] = useState('');
  const [activeTierFilter, setActiveTierFilter] = useState<'ALL' | 'BASIC' | 'PRO' | 'VIP'>('ALL');

  const triggerSave = (newConfig: BotConfig) => {
    setSaveStatus('SAVING');
    onUpdateConfig(newConfig);
    setTimeout(() => {
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 1500);
    }, 400);
  };

  const availablePairsForBroker = BROKER_ASSET_MAP[user.connectedBroker || 'MT5 Institutional'] || [];
  
  const filteredAssets = useMemo(() => {
    return Object.keys(PAIR_CONFIGS).filter(pair => {
      const details = PAIR_CONFIGS[pair];
      const matchesSearch = pair.toLowerCase().includes(assetSearch.toLowerCase()) || details.name.toLowerCase().includes(assetSearch.toLowerCase());
      const matchesTier = activeTierFilter === 'ALL' || details.requiredTier === activeTierFilter;
      return matchesSearch && matchesTier;
    });
  }, [assetSearch, activeTierFilter]);

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Settings2 className="w-8 h-8 text-primary" />
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter">Terminal Hub</h1>
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
          
          {/* TIER DISPLAY & UPGRADE */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-12 opacity-5">
               <Crown className="w-32 h-32 text-primary" />
            </div>
            <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${user.tier === 'VIP' ? 'bg-purple-500/20' : user.tier === 'PRO' ? 'bg-yellow-500/20' : 'bg-gray-800'}`}>
                   <Crown className={`w-6 h-6 ${user.tier === 'VIP' ? 'text-purple-400' : user.tier === 'PRO' ? 'text-yellow-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Identity & Tier</h2>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Active License Protocol</p>
                </div>
              </div>
              {!isAdmin && (
                <button 
                  onClick={onOpenUpgrade}
                  className="px-6 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                  Upgrade License <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
               <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] block mb-2">Current Tier</span>
                  <div className="flex items-center gap-3">
                     <span className={`text-2xl font-black uppercase tracking-tighter ${user.tier === 'VIP' ? 'text-purple-400' : user.tier === 'PRO' ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {user.tier} Grade
                     </span>
                     {user.tier !== 'BASIC' && <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>}
                  </div>
               </div>
               <div className="bg-gray-900/60 p-6 rounded-2xl border border-gray-800">
                  <span className="text-[8px] text-gray-500 font-black uppercase tracking-[0.3em] block mb-2">Account Identity</span>
                  <div className="flex items-center gap-3">
                     <span className="text-lg font-black text-white uppercase">{user.name}</span>
                     <span className="text-[9px] text-gray-600 font-black truncate">ID: {user.id}</span>
                  </div>
               </div>
            </div>
          </section>

          {/* STRATEGIES */}
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
                <span className="text-[9px] text-gray-500 font-black uppercase">Auto-Pilot</span>
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

          {/* ASSET SELECTOR */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-warning/20 rounded-2xl"><Layers className="w-6 h-6 text-warning" /></div>
                <div>
                   <h2 className="text-xl font-black text-white uppercase tracking-tighter">Market Matrix</h2>
                   <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{filteredAssets.length} Assets Identified</p>
                </div>
              </div>
              
              <div className="w-full md:w-64">
                 <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
                    <input 
                       type="text" 
                       value={assetSearch}
                       onChange={(e) => setAssetSearch(e.target.value)}
                       placeholder="Search Pairs..."
                       className="w-full bg-gray-900 border border-gray-800 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-black outline-none focus:border-primary transition-all"
                    />
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
              {filteredAssets.map(pair => {
                const details = PAIR_CONFIGS[pair];
                const isLocked = !isAdmin && currentTierWeight < tierWeight[details.requiredTier as UserTier];
                const isSupported = availablePairsForBroker.includes(pair);
                const isSelected = config.pair === pair;
                
                return (
                  <div 
                    key={pair}
                    onClick={() => !isLocked && isSupported && triggerSave({...config, pair})}
                    className={`p-4 rounded-xl border flex flex-col justify-between h-28 transition-all group ${
                      isSelected ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10' : 'border-gray-800 bg-gray-900/40'
                    } ${isLocked || !isSupported ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-gray-700'}`}
                  >
                     <div className="flex justify-between items-start">
                        <span className={`text-xs font-black uppercase tracking-tighter ${isSelected ? 'text-white' : 'text-gray-300'}`}>{pair}</span>
                        {isLocked && <Lock className="w-3 h-3 text-gray-600" />}
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-gray-600 font-bold uppercase truncate">{details.name}</span>
                        <span className={`text-[8px] font-black uppercase ${
                           details.requiredTier === 'VIP' ? 'text-purple-400' : 
                           details.requiredTier === 'PRO' ? 'text-yellow-400' : 'text-gray-500'
                        }`}>{details.requiredTier}</span>
                     </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* VAULT CHANNELS */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-accent/20 rounded-2xl"><CreditCard className="w-6 h-6 text-accent" /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Vault Channels</h2>
            </div>
            <div className="space-y-4">
               {user.paymentMethods.length > 0 ? (
                  user.paymentMethods.map((pm, idx) => (
                    <div key={idx} className="bg-gray-900/60 p-5 rounded-2xl border border-gray-800 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <CreditCard className="w-4 h-4 text-primary" />
                          <span className="text-xs font-mono text-gray-300 uppercase">{pm}</span>
                       </div>
                       <Check className="w-4 h-4 text-success" />
                    </div>
                  ))
               ) : (
                 <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest text-center py-4 opacity-50">No secure channels linked.</p>
               )}
               <button 
                onClick={onOpenUpgrade}
                className="w-full py-4 bg-gray-800 border border-gray-700 text-[10px] font-black uppercase text-gray-400 rounded-2xl hover:bg-gray-700 hover:text-white transition-all"
               >
                  Link New Protocol
               </button>
            </div>
          </section>

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
                 <label className="text-[10px] text-gray-500 font-black uppercase block mb-4">Capital Protocol</label>
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

          {/* BRIDGE NODE */}
          <section className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-accent/20 rounded-2xl"><Globe className="w-6 h-6 text-accent" /></div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Bridge Node</h2>
            </div>
            <div className="space-y-6">
               <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Landmark className="w-5 h-5 text-primary" />
                     <span className="text-xs font-black text-white uppercase truncate max-w-[100px]">{user.connectedBroker || 'Disconnected'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${user.isLiveAccount ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'}`}>
                     {user.isLiveAccount ? 'Live' : 'Paper'}
                  </span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 text-center">
                     <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Latency</p>
                     <p className="text-xs font-mono font-black text-success">8.4ms</p>
                  </div>
                  <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 text-center">
                     <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Cluster</p>
                     <p className="text-xs font-mono font-black text-white">AWS-VA-2</p>
                  </div>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
