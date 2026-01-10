
import React from 'react';
import { AnalysisResult, BotConfig, STRATEGIES, UserTier } from '../types';
import { Brain, Play, Square, Crown, Zap, Shield, ShieldCheck, Cpu, Check, Copy, Info, Target, TrendingUp, Search, Clock, Activity } from 'lucide-react';

interface BotStatusPanelProps {
  analysis: AnalysisResult | null;
  config: BotConfig;
  userTier: UserTier;
  onToggleActive: () => void;
  onToggleAuto: () => void;
  isAnalyzing: boolean;
  livePrice: number;
}

export const BotStatusPanel: React.FC<BotStatusPanelProps> = ({ 
  analysis, config, userTier, onToggleActive, onToggleAuto, isAnalyzing, livePrice 
}) => {
  const [copied, setCopied] = React.useState(false);

  const tierMeta = {
    'BASIC': { color: 'text-gray-400', border: 'border-gray-800', bg: 'bg-gray-900', icon: Shield },
    'PRO': { color: 'text-yellow-400', border: 'border-yellow-900/40', bg: 'bg-yellow-950/20', icon: Crown },
    'VIP': { color: 'text-purple-400', border: 'border-purple-900/40', bg: 'bg-purple-950/20', icon: Zap }
  };

  const currentTier = tierMeta[userTier] || tierMeta['BASIC'];
  const TierIcon = currentTier.icon;
  const activeStrategy = STRATEGIES.find(s => s.id === config.strategyId) || STRATEGIES[0];

  const handleCopy = () => {
    if (!analysis) return;
    const text = `${config.pair} | ${analysis.recommendation} | PRICE: ${livePrice.toFixed(5)} | SL: ${analysis.stopLoss.toFixed(5)} | TP: ${analysis.takeProfit.toFixed(5)} | LOT: ${analysis.suggestedLotSize}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-surface rounded-[2rem] md:rounded-[2.5rem] border flex flex-col h-full overflow-hidden shadow-2xl transition-all duration-700 ${
      config.isAutoTrade ? 'border-success/40 shadow-success/10' : 'border-gray-800'
    }`}>
      <div className={`p-5 md:p-6 border-b flex justify-between items-center backdrop-blur-3xl ${currentTier.bg} border-gray-800`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center border shadow-xl ${currentTier.border}`}>
            <TierIcon className={`w-5 h-5 md:w-6 md:h-6 ${currentTier.color} ${userTier === 'VIP' ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs md:text-sm font-black text-white uppercase tracking-tighter">Neural Hub</h2>
              <span className={`px-2 py-0.5 rounded-full text-[7px] md:text-[8px] font-black border uppercase tracking-widest ${currentTier.color} ${currentTier.border}`}>
                {userTier}
              </span>
            </div>
            <p className="text-[8px] md:text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">
              {isAnalyzing ? 'Scanning...' : config.isActive ? 'Engine Online' : 'Terminal Idle'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onToggleAuto}
                className={`px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${config.isAutoTrade ? 'bg-success text-white shadow-lg shadow-success/20' : 'bg-gray-800 text-gray-400'}`}
            >
                {config.isAutoTrade ? 'Auto' : 'Semi'}
            </button>
            <button onClick={onToggleActive} className={`px-4 md:px-5 py-2.5 md:py-3 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black tracking-widest transition-all ${config.isActive ? 'bg-danger text-white' : 'bg-primary text-white'}`}>
                {config.isActive ? <Square className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" /> : <Play className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />}
            </button>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        {/* EDUCATIONAL BREAKDOWN */}
        <div className="space-y-4">
           <div className="bg-gray-900/60 p-4 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-gray-800 relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-20 transition-opacity">
                  <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="flex justify-between items-center mb-2 relative z-10">
                 <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Market Context</span>
                 <Info className="w-3 h-3 text-primary" />
              </div>
              <h3 className="text-xs md:text-sm font-black text-white uppercase tracking-tight mb-1">{analysis?.marketDefinition || "Initializing Node..."}</h3>
              <p className="text-[9px] md:text-[10px] text-gray-400 leading-relaxed font-medium italic opacity-60">
                Logic: {analysis?.activeStrategyName || activeStrategy.name}
              </p>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-primary/20">
                 <p className="text-[7px] md:text-[8px] text-gray-500 font-black uppercase mb-1">Candlestick</p>
                 <p className="text-[10px] md:text-xs font-black text-white uppercase truncate">{analysis?.candlestickPattern || "Scanning..."}</p>
              </div>
              <div className="bg-accent/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-accent/20">
                 <p className="text-[7px] md:text-[8px] text-gray-500 font-black uppercase mb-1">Timing</p>
                 <p className={`text-[9px] font-black uppercase truncate ${analysis?.entryTiming?.includes('WAIT') ? 'text-amber-500' : 'text-accent'}`}>
                    {analysis?.entryTiming || "Awaiting Node"}
                 </p>
              </div>
           </div>
        </div>

        {analysis ? (
          <>
            <div className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-2 transition-all text-center relative overflow-hidden ${
              analysis.recommendation === 'BUY' ? 'border-success/30 bg-success/5' : 
              analysis.recommendation === 'SELL' ? 'border-danger/30 bg-danger/5' : 'border-gray-800 bg-gray-900/40'
            }`}>
              <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Execution Order</p>
              <h1 className={`text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2 ${
                analysis.recommendation === 'BUY' ? 'text-success' : 
                analysis.recommendation === 'SELL' ? 'text-danger' : 'text-white'
              }`}>
                {analysis.recommendation === 'BUY' ? 'CALL' : 
                 analysis.recommendation === 'SELL' ? 'PUT' : 'HOLD'}
              </h1>
              
              <div className="flex flex-col items-center mb-6">
                 <div className="flex items-center gap-2 mb-1">
                    <Target className="w-3 h-3 text-gray-500" />
                    <span className="text-[11px] font-mono font-black text-white tracking-widest">${livePrice.toFixed(5)}</span>
                 </div>
              </div>

              <button onClick={handleCopy} className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase transition-all">
                {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />} Copy Signal
              </button>
              
              <div className="absolute top-0 right-0 p-3">
                 <div className="flex items-center gap-1 px-2 py-1 bg-gray-900 border border-gray-800 rounded-lg shadow-xl">
                    <Brain className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-black text-white">{analysis.confidence}%</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                    <span className="text-[7px] md:text-[8px] font-black text-gray-500 uppercase block mb-1">Lot Size</span>
                    <span className="text-xs md:text-sm font-mono font-black text-white">{analysis.suggestedLotSize}</span>
                </div>
                <div className="bg-gray-900/40 p-4 rounded-xl border border-gray-800">
                    <span className="text-[7px] md:text-[8px] font-black text-gray-500 uppercase block mb-1">Position</span>
                    <span className={`text-[8px] md:text-[9px] font-black uppercase ${
                       analysis.recommendation === 'BUY' ? 'text-success' : 
                       analysis.recommendation === 'SELL' ? 'text-danger' : 'text-gray-500'
                    }`}>{analysis.recommendation}</span>
                </div>
                <div className="bg-danger/5 p-4 rounded-xl border border-danger/20">
                    <span className="text-[7px] md:text-[8px] font-black text-danger uppercase block mb-1">Stop Loss</span>
                    <span className="text-xs md:text-sm font-mono font-black text-white">{analysis.stopLoss?.toFixed(5) || 'AUTO'}</span>
                </div>
                <div className="bg-success/5 p-4 rounded-xl border border-success/20">
                    <span className="text-[7px] md:text-[8px] font-black text-success uppercase block mb-1">Take Profit</span>
                    <span className="text-xs md:text-sm font-mono font-black text-white">{analysis.takeProfit?.toFixed(5) || 'AUTO'}</span>
                </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 py-20 text-center">
            <div className="relative mb-6">
                <div className="w-12 h-12 md:w-16 md:h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <Brain className="w-6 h-6 md:w-8 md:h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
            </div>
            <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest">Awaiting Confluence...</p>
          </div>
        )}
      </div>
    </div>
  );
};
