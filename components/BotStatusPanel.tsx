
import React, { useState, useEffect } from 'react';
import { AnalysisResult, BotConfig, UserProfile } from '../types';
import { Brain, Play, Square, Crown, Zap, Shield, Target, Search, Clock, ShieldAlert, AlertCircle, Terminal, Cpu } from 'lucide-react';
import { PERMANENT_KEYS } from '../appConfig';

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
  const isBrokerLinked = user.brokerConfig?.metaApi?.isActive || user.brokerConfig?.mtPlatform?.isActive;

  return (
    <div className={`bg-[#0a101f] rounded-[3rem] border flex flex-col h-full overflow-hidden shadow-2xl transition-all duration-700 ${
      config.isActive ? 'border-primary' : 'border-gray-800'
    }`}>
      <div className={`p-8 border-b border-gray-800 flex justify-between items-center ${isBrokerLinked ? 'bg-success/5' : 'bg-danger/5'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xl ${isBrokerLinked ? 'border-success/30' : 'border-danger/30'}`}>
            <Cpu className={`w-6 h-6 ${isBrokerLinked ? 'text-success' : 'text-danger'}`} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tighter italic">HFT Signal Node</h2>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">
              {isBrokerLinked ? 'Bridge Live' : 'Bridge Locked'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={onToggleAuto}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${config.isAutoTrade ? 'bg-primary text-white' : 'bg-gray-800 text-gray-500'}`}
            >
                AUTO
            </button>
            <button onClick={onToggleActive} className={`p-3 rounded-xl transition-all ${config.isActive ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                {config.isActive ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
        </div>
      </div>

      {!isBrokerLinked && (
        <div className="p-8 bg-danger/10 border-b border-danger/20">
          <div className="flex items-start gap-4">
            <ShieldAlert className="w-5 h-5 text-danger shrink-0 mt-1" />
            <p className="text-[10px] text-danger font-black uppercase leading-relaxed tracking-wider">
              Broker not configured. Trading execution disabled. Connect via Hub Settings to unlock institutional execution.
            </p>
          </div>
        </div>
      )}

      <div className="p-8 flex-1 flex flex-col gap-6 overflow-y-auto scrollbar-hide">
        <div className={`p-10 rounded-[3rem] border-2 transition-all text-center ${
            analysis?.recommendation === 'BUY' ? 'border-success/30 bg-success/5' : 
            analysis?.recommendation === 'SELL' ? 'border-danger/30 bg-danger/5' : 'border-gray-800 bg-gray-900/40'
        }`}>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-gray-600">Market Recommendation</p>
            <h1 className={`text-6xl font-black tracking-tighter uppercase mb-4 ${
                analysis?.recommendation === 'BUY' ? 'text-success' : 
                analysis?.recommendation === 'SELL' ? 'text-danger' : 'text-white'
            }`}>
                {analysis?.recommendation || 'WAIT'}
            </h1>
            <div className="flex items-center justify-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-black text-white uppercase tracking-widest">{analysis?.confidence || 0}% CONFIDENCE</span>
            </div>
        </div>

        <div className="bg-black/40 p-5 rounded-[2rem] border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
                <Terminal className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">System Logs</span>
            </div>
            <div className="space-y-2 font-mono text-[8px] tracking-tight overflow-hidden h-16">
                <p className="text-gray-500">[SYSTEM] Node Authentication: OK</p>
                {!isBrokerLinked && <p className="text-danger animate-pulse">[SECURITY] EXECUTION_LOCK_ACTIVE</p>}
                {analysis && <p className="text-white animate-fade-in">[SIGNAL] {analysis.recommendation} identified at {livePrice}</p>}
            </div>
        </div>
      </div>
    </div>
  );
};
