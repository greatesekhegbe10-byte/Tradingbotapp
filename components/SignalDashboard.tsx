
import React, { useState, useEffect } from 'react';
import { Radio, ShieldCheck, Clock, TrendingUp, TrendingDown, Zap, Filter, Search, Target } from 'lucide-react';
import { Signal, TradeType } from '../types';

export const SignalDashboard: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    // Simulated Institutional Signal Feed
    const mockSignals: Signal[] = [
      { id: 'SIG-001', pair: 'EUR/USD', type: TradeType.BUY, entry: 1.0854, sl: 1.0820, tp: 1.0950, confidence: 89, timestamp: '10:45 AM', strategyName: 'Void Finder AI', winRate: 78 },
      { id: 'SIG-002', pair: 'XAU/USD', type: TradeType.SELL, entry: 2384.50, sl: 2395.00, tp: 2350.00, confidence: 92, timestamp: '11:12 AM', strategyName: 'SMC Liquidity', winRate: 84 },
      { id: 'SIG-003', pair: 'BTC/USD', type: TradeType.BUY, entry: 68420, sl: 67200, tp: 71000, confidence: 85, timestamp: '11:30 AM', strategyName: 'Delta Divergence', winRate: 72 },
    ];
    setSignals(mockSignals);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center bg-[#0a101f] p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <Radio className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Alpha Feed</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Live Institutional Analysis Node</p>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
              <input type="text" placeholder="Search Pairs..." className="bg-gray-900 border border-gray-800 rounded-xl py-2 pl-9 pr-4 text-[10px] text-white outline-none focus:border-primary w-40" />
           </div>
           <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-xl text-[9px] font-black uppercase text-white border border-gray-700">
             <Filter className="w-3 h-3" /> Filter
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {signals.map(signal => (
          <div key={signal.id} className="bg-surface rounded-[2rem] border border-gray-800 p-6 shadow-xl relative overflow-hidden group hover:border-primary/40 transition-all">
            <div className="absolute top-0 right-0 p-4">
               <span className="text-[8px] font-black text-gray-600 uppercase italic">ID: {signal.id}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
               <div className={`p-3 rounded-xl ${signal.type === TradeType.BUY ? 'bg-success/10' : 'bg-danger/10'}`}>
                  {signal.type === TradeType.BUY ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-danger" />}
               </div>
               <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{signal.pair}</h3>
                  <p className={`text-[10px] font-black uppercase ${signal.type === TradeType.BUY ? 'text-success' : 'text-danger'}`}>{signal.type}</p>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-6 text-center">
               <div className="bg-gray-900/50 p-2 rounded-xl border border-gray-800">
                  <p className="text-[8px] text-gray-500 font-black uppercase mb-1">Entry</p>
                  <p className="text-xs font-mono font-black text-white">{signal.entry}</p>
               </div>
               <div className="bg-gray-900/50 p-2 rounded-xl border border-gray-800">
                  <p className="text-[8px] text-gray-500 font-black uppercase mb-1">SL</p>
                  <p className="text-xs font-mono font-black text-danger">{signal.sl}</p>
               </div>
               <div className="bg-gray-900/50 p-2 rounded-xl border border-gray-800">
                  <p className="text-[8px] text-gray-500 font-black uppercase mb-1">TP</p>
                  <p className="text-xs font-mono font-black text-success">{signal.tp}</p>
               </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] text-gray-500 font-black uppercase">Strategy</span>
                  <span className="text-[10px] text-primary font-black uppercase">{signal.strategyName}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] text-gray-500 font-black uppercase">Confidence</span>
                  <div className="flex items-center gap-2">
                     <Zap className="w-3 h-3 text-amber-500" />
                     <span className="text-[10px] text-white font-black">{signal.confidence}%</span>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
