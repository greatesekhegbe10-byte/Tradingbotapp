import React from 'react';
import { AnalysisResult, TradeType, BotConfig } from '../types';
import { Brain, Play, Square, Activity, ShieldAlert, Zap, Crown } from 'lucide-react';

interface BotStatusPanelProps {
  analysis: AnalysisResult | null;
  config: BotConfig;
  onToggleActive: () => void;
  isAnalyzing: boolean;
}

export const BotStatusPanel: React.FC<BotStatusPanelProps> = ({ analysis, config, onToggleActive, isAnalyzing }) => {
  const getRecommendationColor = (rec: TradeType) => {
    switch (rec) {
      case TradeType.BUY: return 'text-success bg-success/10 border-success/20';
      case TradeType.SELL: return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-gray-400 bg-gray-700/30 border-gray-600';
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-700 flex flex-col overflow-hidden relative">
      {/* Pro Badge Watermark */}
      {config.isPro && (
        <div className="absolute top-2 right-14 opacity-10 pointer-events-none">
             <Crown className="w-24 h-24 text-yellow-500" />
        </div>
      )}

      {/* Header / Controls */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Brain className={`w-5 h-5 ${config.isPro ? 'text-yellow-400' : 'text-purple-400'}`} />
          <h2 className="text-lg font-semibold text-white">Gemini Core {config.isPro && <span className="text-xs text-yellow-400 ml-1 font-bold">PRO</span>}</h2>
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
              <Square className="w-3 h-3 fill-current" /> STOP
            </>
          ) : (
            <>
              <Play className="w-3 h-3 fill-current" /> AUTO-TRADE
            </>
          )}
        </button>
      </div>

      {/* Main Analysis Content */}
      <div className="p-6 flex-1 flex flex-col gap-6 z-10">
        
        {/* Status Indicator */}
        <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">System Status</span>
            <div className="flex items-center gap-2">
                {isAnalyzing ? (
                    <span className="text-warning text-xs flex items-center gap-1 animate-pulse">
                        <Activity className="w-3 h-3" /> ANALYZING...
                    </span>
                ) : (
                    <span className="text-gray-500 text-xs">IDLE</span>
                )}
                <div className={`w-2 h-2 rounded-full ${config.isActive ? 'bg-success animate-pulse' : 'bg-gray-600'}`}></div>
            </div>
        </div>

        {analysis ? (
          <>
            {/* Recommendation Big Display */}
            <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 ${getRecommendationColor(analysis.recommendation)}`}>
              <span className="text-xs font-bold tracking-widest uppercase mb-1 opacity-70">AI Signal</span>
              <h1 className="text-4xl font-black tracking-tighter">{analysis.recommendation}</h1>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                <Zap className="w-4 h-4" />
                <span>Confidence: {analysis.confidence}%</span>
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
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                  <ShieldAlert className="w-3 h-3" /> Stop Loss
                </div>
                <div className="text-lg font-mono text-danger font-bold">
                  ${analysis.stopLoss.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-1 text-xs text-gray-400">
                  <Activity className="w-3 h-3" /> Take Profit
                </div>
                <div className="text-lg font-mono text-success font-bold">
                  ${analysis.takeProfit.toLocaleString()}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-2 min-h-[200px]">
            <Brain className="w-12 h-12 opacity-20" />
            <p>Waiting for market data...</p>
          </div>
        )}
      </div>
    </div>
  );
};