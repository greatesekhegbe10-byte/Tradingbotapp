
import React from 'react';
import { AnalysisResult, BotConfig, STRATEGIES, UserTier, UserProfile } from '../types';
import { Brain, Play, Square, Crown, Zap, Shield, Target, Info, Search, Clock, Activity, Cpu, Webhook, Landmark, Terminal, BarChart4, TrendingUp, TrendingDown, ArrowRightCircle } from 'lucide-react';

interface BotStatusPanelProps {
  analysis: AnalysisResult | null;
  config: BotConfig;
  user: UserProfile; 
  onToggleActive: () => void;
  onToggleAuto: () => void;
  isAnalyzing: boolean;
  livePrice: number;
}

export const BotStatusPanel: React.FC<BotStatusPanelProps> = ({ 
  analysis, config, user, onToggleActive, onToggleAuto, isAnalyzing, livePrice 
}) => {
  const userTier = user.tier;
  const tierMeta = {
    'BASIC': { color: 'text-gray-400', border: 'border-gray-800', bg: 'bg-gray-900', icon: Shield },
    'PRO': { color: 'text-amber-500', border: 'border-amber-900/40', bg: 'bg-amber-950/10', icon: Crown },
    'VIP': { color: 'text-purple-400', border: 'border-purple-900/40', bg: 'bg-purple-950/10', icon: Zap }
  };

  const currentTier = tierMeta[userTier] || tierMeta['BASIC'];
  const TierIcon = currentTier.icon;
  const activeStrategy = STRATEGIES.find(s => s.id === config.strategyId) || STRATEGIES[0];

  const brokerConfig = user.brokerConfig;

  return (
    <div className={`bg-[#0a101f] rounded-[3rem] border flex flex-col h-full overflow-hidden shadow-2xl transition-all duration-700 ${
      config.isActive ? 'border-primary shadow-primary/10' : 'border-gray-800'
    }`}>
      {/* HUD Header */}
      <div className={`p-8 border-b flex justify-between items-center backdrop-blur-3xl ${currentTier.bg} border-gray-800`}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-xl ${currentTier.border}`}>
            <TierIcon className={`w-7 h-7 ${currentTier.color} ${userTier === 'VIP' ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white uppercase tracking-tighter italic">HFT Signal Node</h2>
              <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black border uppercase tracking-widest ${currentTier.color} ${currentTier.border}`}>
                {userTier}
              </span>
            </div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              {isAnalyzing ? <Search className="w-2.5 h-2.5 animate-spin text-primary" /> : config.isActive ? <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> : <Clock className="w-2.5 h-2.5" />}
              {isAnalyzing ? 'Scanning Order Blocks...' : config.isActive ? 'Bridge Live (5s Pulse)' : 'Node Idle'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onToggleAuto}
                className={`px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${config.isAutoTrade ? 'bg-primary text-white shadow-xl shadow-primary/30' : 'bg-gray-800 text-gray-500 hover:text-white'}`}
            >
                AUTO
            </button>
            <button onClick={onToggleActive} className={`px-5 py-4 rounded-2xl text-[11px] font-black tracking-widest transition-all ${config.isActive ? 'bg-danger text-white shadow-danger/30' : 'bg-success text-white shadow-success/30'}`}>
                {config.isActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
        </div>
      </div>

      {/* NEXT-GEN TRADING PANEL: LOT / SL / TP */}
      <div className="px-8 pt-8 grid grid-cols-3 gap-3">
          <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800 flex flex-col items-center text-center">
             <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Lot Size</span>
             <span className="text-xs font-mono font-black text-white italic">{analysis?.suggestedLotSize || 'AUTO'}</span>
          </div>
          <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800 flex flex-col items-center text-center">
             <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Top Loss</span>
             <span className="text-xs font-mono font-black text-danger italic">-{analysis?.stopLoss.toFixed(2) || '0.00'}</span>
          </div>
          <div className="bg-gray-900/40 p-5 rounded-3xl border border-gray-800 flex flex-col items-center text-center">
             <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Take Profit</span>
             <span className="text-xs font-mono font-black text-success italic">+{analysis?.takeProfit.toFixed(2) || '0.00'}</span>
          </div>
      </div>

      {/* Dual Bridge Health */}
      <div className="px-8 pt-6 grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${brokerConfig?.metaApi?.isActive ? 'bg-primary/5 border-primary/20' : 'bg-gray-900 border-gray-800 opacity-50'}`}>
             <Webhook className={`w-4 h-4 ${brokerConfig?.metaApi?.isActive ? 'text-primary' : 'text-gray-600'}`} />
             <div>
                <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest">Binary (M-API)</p>
                <p className={`text-[9px] font-black uppercase ${brokerConfig?.metaApi?.isActive ? 'text-white' : 'text-gray-600'}`}>
                    {brokerConfig?.metaApi?.isActive ? 'Linked' : 'Offline'}
                </p>
             </div>
          </div>
          <div className={`p-4 rounded-2xl border flex items-center gap-3 transition-all ${brokerConfig?.mtPlatform?.isActive ? 'bg-accent/5 border-accent/20' : 'bg-gray-900 border-gray-800 opacity-50'}`}>
             <Landmark className={`w-4 h-4 ${brokerConfig?.mtPlatform?.isActive ? 'text-accent' : 'text-gray-600'}`} />
             <div>
                <p className="text-[7px] text-gray-500 font-black uppercase tracking-widest">MT-EA Node</p>
                <p className={`text-[9px] font-black uppercase ${brokerConfig?.mtPlatform?.isActive ? 'text-white' : 'text-gray-600'}`}>
                    {brokerConfig?.mtPlatform?.isActive ? 'Running' : 'Offline'}
                </p>
             </div>
          </div>
      </div>

      {/* Neural Logic Feed & Active Stream */}
      <div className="p-8 flex-1 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        
        {/* Active Market Direction HUD */}
        <div className={`p-10 rounded-[3rem] border-2 transition-all text-center relative overflow-hidden ${
            analysis?.recommendation === 'BUY' ? 'border-success/30 bg-success/5' : 
            analysis?.recommendation === 'SELL' ? 'border-danger/30 bg-danger/5' : 'border-gray-800 bg-gray-900/40'
        }`}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-gray-600 italic">Neural Recommendation</p>
            <h1 className={`text-6xl font-black tracking-tighter uppercase mb-4 ${
                analysis?.recommendation === 'BUY' ? 'text-success drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 
                analysis?.recommendation === 'SELL' ? 'text-danger drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'text-white'
            }`}>
                {analysis?.recommendation === 'BUY' ? 'CALL' : 
                analysis?.recommendation === 'SELL' ? 'PUT' : 'WAIT'}
            </h1>
            <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/60 rounded-2xl border border-gray-800 shadow-xl">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-black text-white tracking-widest">{analysis?.confidence || 0}% CONFIDENCE</span>
                </div>
            </div>
        </div>

        {/* OPEN POSITIONS MINI-LEDGER */}
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Active Stream</h3>
                <span className="text-[8px] px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded uppercase font-black">Cluster Alpha</span>
            </div>
            
            <div className="bg-gray-900/40 rounded-[2rem] border border-gray-800 p-6 space-y-4 min-h-[120px] flex flex-col justify-center">
                {isAnalyzing ? (
                   <div className="flex flex-col items-center gap-3 opacity-30">
                       <BarChart4 className="w-6 h-6 animate-pulse" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Refreshing Clusters...</span>
                   </div>
                ) : (
                    <div className="space-y-3 font-mono text-[9px] tracking-tight">
                        <div className="flex justify-between items-center text-success border-b border-gray-800/50 pb-2">
                            <span className="flex items-center gap-2"><TrendingUp className="w-3 h-3" /> [META_API] Signal Relayed</span>
                            <span className="font-black">OK</span>
                        </div>
                        <div className="flex justify-between items-center text-accent border-b border-gray-800/50 pb-2">
                            <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> [EA_NODE] Execution Sync</span>
                            <span className="font-black">1.2ms</span>
                        </div>
                        <div className="flex justify-between items-center text-white/40">
                            <span className="flex items-center gap-2 italic"><ArrowRightCircle className="w-3 h-3" /> Drawdown Protection</span>
                            <span className="font-black text-success">SAFE</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Console Logs */}
        <div className="bg-black/40 p-5 rounded-[2rem] border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
                <Terminal className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Simultaneous Node Logs</span>
            </div>
            <div className="space-y-2 font-mono text-[8px] tracking-tight overflow-hidden h-16">
                <p className={`text-success transition-all duration-300 ${brokerConfig?.metaApi?.isActive ? 'opacity-100' : 'opacity-20'}`}>
                    [BRIDGE] Meta API Hook: {brokerConfig?.metaApi?.isActive ? 'BROADCASTING' : 'IDLE'}
                </p>
                <p className={`text-accent transition-all duration-300 ${brokerConfig?.mtPlatform?.isActive ? 'opacity-100' : 'opacity-20'}`}>
                    [EA_NODE] Nexus_HFT_Pro.ex5: {brokerConfig?.mtPlatform?.isActive ? 'EXECUTING LOGIC' : 'IDLE'}
                </p>
                {analysis && <p className="text-white animate-fade-in">[SIGNAL] {analysis.recommendation} Identified @ {analysis.confidence}%</p>}
            </div>
        </div>
      </div>
    </div>
  );
};
