
import React, { useState } from 'react';
import { AnalysisResult, TradeType, BotConfig } from '../types';
import { Brain, Play, Square, Activity, ShieldAlert, Zap, Copy, Check, BarChart2, AlertTriangle, WifiOff, Clock } from 'lucide-react';

interface BotStatusPanelProps {
  analysis: AnalysisResult | null;
  config: BotConfig;
  onToggleActive: () => void;
  isAnalyzing: boolean;
}

export const BotStatusPanel: React.FC<BotStatusPanelProps> = ({ analysis, config, onToggleActive, isAnalyzing }) => {
  const [copied, setCopied] = useState(false);

  const getRecommendationColor = (rec: TradeType) => {
    switch (rec) {
      case TradeType.BUY: return 'text-success bg-success/10 border-success/20';
      case TradeType.SELL: return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-gray-400 bg-gray-700/30 border-gray-600';
    }
  };

  const handleCopySignal = () => {
    if (!analysis) return;
    const signalText = `
🚀 NEXUS AI SIGNAL
Pair: ${config.pair}
Action: ${analysis.recommendation}
Entry: Market
SL: ${analysis.stopLoss.toFixed(2)}
TP: ${analysis.takeProfit.toFixed(2)}
Confidence: ${analysis.confidence}%
Reason: ${analysis.patterns?.join(', ') || 'Technical Setup'}
    `.trim();
    navigator.clipboard.writeText(signalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSystemError = analysis?.reasoning.includes("CRITICAL") || analysis?.marketStructure === "AUTH_ERR" || analysis?.marketStructure === "OFFLINE";
  const isRateLimit = analysis?.marketStructure === "RATE_LIMIT";

  return (
    <div className="bg-surface rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden relative shadow-lg">
      <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-semibold text-white">AI Command Center</h2>
        </div>
        <button
          onClick={onToggleActive}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-lg ${
            config.isActive 
              ? 'bg-danger text-white hover:bg-red-600 shadow-red-900/20' 
              : 'bg-success text-white hover:bg-green-600 shadow-green-900/20'
          }`}
        >
          {config.isActive ? (
            <>
              <Square className="w-3 h-3 fill-current" /> STOP BOT
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" /> AUTO TRADE
            </>
          )}
        </button>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6">
        
        {/* Status Indicator */}
        <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm font-medium">System Status</span>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${isAnalyzing ? 'text-warning animate-pulse' : 'text-gray-500'}`}>
                    {isAnalyzing ? 'ANALYZING PATTERNS...' : 'IDLE'}
                </span>
                <div className={`w-2.5 h-2.5 rounded-full ${config.isActive ? 'bg-success animate-ping' : 'bg-gray-600'}`}></div>
            </div>
        </div>

        {isRateLimit && analysis ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-yellow-900/10 border border-yellow-500/50 rounded-xl animate-fade-in text-center">
                 <div className="w-12 h-12 bg-yellow-900/30 rounded-full flex items-center justify-center mb-4 relative">
                    <Clock className="w-6 h-6 text-yellow-500 animate-spin-slow" />
                 </div>
                 <h3 className="text-lg font-bold text-yellow-500 mb-2">API Cooling Down</h3>
                 <p className="text-sm text-yellow-200 mb-4">{analysis.reasoning}</p>
                 <div className="text-xs text-gray-400 bg-black/20 p-2 rounded w-full">
                    <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 animate-progress w-full"></div>
                    </div>
                    <div className="mt-1 text-[10px] uppercase">Resuming automatically</div>
                 </div>
            </div>
        ) : isSystemError && analysis ? (
             <div className="flex-1 flex flex-col items-center justify-center p-6 bg-red-900/10 border border-red-500/50 rounded-xl animate-fade-in text-center">
                 <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <WifiOff className="w-6 h-6 text-red-500" />
                 </div>
                 <h3 className="text-lg font-bold text-red-500 mb-2">System Alert</h3>
                 <p className="text-sm text-red-200 mb-4">{analysis.reasoning}</p>
                 <div className="text-xs text-gray-400 bg-black/20 p-2 rounded">
                    Error Code: {analysis.marketStructure}
                 </div>
             </div>
        ) : analysis ? (
          <>
            {/* Recommendation Big Display */}
            <div className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${getRecommendationColor(analysis.recommendation)}`}>
              
              {/* Copy Button */}
              <button 
                onClick={handleCopySignal}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/20 hover:bg-black/40 transition-colors text-current flex items-center gap-2"
                title="Copy Signal Strategy"
              >
                <span className="text-xs font-bold uppercase hidden sm:block">Copy Signal</span>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>

              <h1 className="text-5xl font-black tracking-tighter">{analysis.recommendation}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Confidence: {analysis.confidence}%</span>
              </div>
            </div>

            {/* Pattern & Structure Info */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex flex-col">
                    <span className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1">
                        <BarChart2 className="w-3 h-3" /> Structure
                    </span>
                    <span className="text-sm font-mono text-white mt-1">{analysis.marketStructure || 'Neutral'}</span>
                </div>
                <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-700 flex flex-col">
                    <span className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Pattern
                    </span>
                    <span className="text-sm font-mono text-white mt-1 truncate">
                        {analysis.patterns && analysis.patterns.length > 0 ? analysis.patterns[0] : 'None'}
                    </span>
                </div>
            </div>

            {/* Reasoning */}
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-300 text-sm leading-relaxed italic">
                "{analysis.reasoning}"
              </p>
            </div>

            {/* Levels */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-danger"></div>
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-400 pl-2">
                  <ShieldAlert className="w-3 h-3" /> Stop Loss
                </div>
                <div className="text-lg font-mono text-danger font-bold pl-2">
                  ${analysis.stopLoss.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-success"></div>
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-400 pl-2">
                  <Activity className="w-3 h-3" /> Take Profit
                </div>
                <div className="text-lg font-mono text-success font-bold pl-2">
                  ${analysis.takeProfit.toFixed(2)}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2 min-h-[200px]">
            <Brain className="w-12 h-12 opacity-20 animate-pulse" />
            <p className="text-sm">Waiting for high-confidence setup...</p>
          </div>
        )}
      </div>
    </div>
  );
};
