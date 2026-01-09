
import React, { useState } from 'react';
import { AnalysisResult, TradeType, BotConfig } from '../types';
import { Brain, Play, Square, Activity, ShieldAlert, Zap, Copy, Check, BarChart2, Clock, WifiOff } from 'lucide-react';

interface BotStatusPanelProps {
  analysis: AnalysisResult | null;
  config: BotConfig;
  onToggleActive: () => void;
  isAnalyzing: boolean;
}

export const BotStatusPanel: React.FC<BotStatusPanelProps> = ({ analysis, config, onToggleActive, isAnalyzing }) => {
  const [copied, setCopied] = useState(false);

  const getRecColor = (rec: TradeType) => {
    switch (rec) {
      case TradeType.BUY: return 'text-success bg-success/10 border-success/30';
      case TradeType.SELL: return 'text-danger bg-danger/10 border-danger/30';
      default: return 'text-gray-400 bg-gray-800/50 border-gray-700';
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    const text = `NEXUS AI | Pair: ${config.pair} | Action: ${analysis.recommendation} | Entry: Market | SL: ${analysis.stopLoss.toFixed(4)} | TP: ${analysis.takeProfit.toFixed(4)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isError = analysis?.marketStructure === "AUTH_ERR" || analysis?.marketStructure === "ERR";
  const isCooldown = analysis?.marketStructure === "RATE_LIMIT";

  return (
    <div className="bg-surface rounded-2xl border border-gray-700 flex flex-col h-full overflow-hidden shadow-xl">
      <div className="p-4 border-b border-gray-700 bg-gray-800/40 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-black text-white uppercase tracking-tighter">AI Command</h2>
        </div>
        <button
          onClick={onToggleActive}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black tracking-widest transition-all ${
            config.isActive ? 'bg-danger text-white' : 'bg-success text-white'
          }`}
        >
          {config.isActive ? <><Square className="w-3 h-3 fill-current" /> STOP</> : <><Play className="w-3 h-3 fill-current" /> START</>}
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Engine Status</span>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold ${isAnalyzing ? 'text-primary animate-pulse' : 'text-gray-600'}`}>
                    {isAnalyzing ? 'SYNCING DATA...' : 'IDLE'}
                </span>
                <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-success shadow-[0_0_8px_#10b981]' : 'bg-gray-700'}`}></div>
            </div>
        </div>

        {isCooldown ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl text-center animate-fade-in">
                 <Clock className="w-10 h-10 text-yellow-500 mb-4 animate-spin-slow" />
                 <h3 className="text-sm font-black text-yellow-500 uppercase mb-2">Cooling Down</h3>
                 <p className="text-xs text-yellow-500/70 leading-relaxed">{analysis?.reasoning}</p>
            </div>
        ) : isError ? (
             <div className="flex-1 flex flex-col items-center justify-center p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-center animate-fade-in">
                 <WifiOff className="w-10 h-10 text-red-500 mb-4" />
                 <h3 className="text-sm font-black text-red-500 uppercase mb-2">Engine Fault</h3>
                 <p className="text-xs text-red-500/70 leading-relaxed">{analysis?.reasoning}</p>
             </div>
        ) : analysis ? (
          <>
            <div className={`relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 transition-all group ${getRecColor(analysis.recommendation)}`}>
              <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-black/20 rounded-lg hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <h1 className="text-5xl font-black tracking-tighter uppercase">{analysis.recommendation}</h1>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase opacity-80">
                <Zap className="w-3 h-3 fill-current" />
                Confidence: {analysis.confidence}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <span className="text-[9px] text-gray-500 uppercase font-black block mb-1">Structure</span>
                    <span className="text-xs font-bold text-white uppercase">{analysis.marketStructure}</span>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                    <span className="text-[9px] text-gray-500 uppercase font-black block mb-1">Pattern</span>
                    <span className="text-xs font-bold text-white uppercase truncate">
                        {analysis.patterns?.[0] || 'Analyzing...'}
                    </span>
                </div>
            </div>

            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 relative overflow-hidden">
              <div className="absolute left-0 top-0 w-1 h-full bg-primary/40"></div>
              <p className="text-gray-400 text-xs leading-relaxed italic line-clamp-3">
                "{analysis.reasoning}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 flex flex-col gap-1">
                <span className="text-[9px] font-black text-danger uppercase tracking-widest flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Stop Loss
                </span>
                <span className="text-lg font-mono font-bold text-danger">${analysis.stopLoss.toFixed(2)}</span>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700 flex flex-col gap-1">
                <span className="text-[9px] font-black text-success uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Take Profit
                </span>
                <span className="text-lg font-mono font-bold text-success">${analysis.takeProfit.toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3 min-h-[300px]">
            <Brain className="w-12 h-12 opacity-10 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Awaiting high-confidence setup</p>
          </div>
        )}
      </div>
    </div>
  );
};
