
import React, { useState, useEffect } from 'react';
import { Radio, ShieldCheck, Clock, TrendingUp, TrendingDown, Target, Zap, Filter, Search } from 'lucide-react';
import { Signal, TradeType } from '../types';

interface SignalDashboardProps {
  pair: string;
}

export const SignalDashboard: React.FC<SignalDashboardProps> = ({ pair }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    // Simulated Signal Generator
    const generateSignals = () => {
      const types: TradeType[] = [TradeType.BUY, TradeType.SELL];
      const newSignals: Signal[] = Array.from({ length: 8 }).map((_, i) => ({
        id: `SIG-${i}`,
        pair: pair,
        type: types[Math.floor(Math.random() * 2)],
        entry: 1.0850 + (Math.random() * 0.01),
        sl: 1.0800,
        tp: 1.1000,
        confidence: 85 + Math.floor(Math.random() * 10),
        timestamp: new Date().toLocaleTimeString(),
        strategyId: 'VIP_LIQUIDITY',
        status: 'ACTIVE'
      }));
      setSignals(newSignals);
    };
    generateSignals();
    const interval = setInterval(generateSignals, 30000);
    return () => clearInterval(interval);
  }, [pair]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center bg-[#0a101f] p-8 rounded-[3rem] border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <Radio className="w-7 h-7 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Institutional Signals</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-success" /> View-Only Analysis Hub
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input type="text" placeholder="Search Pair..." className="bg-gray-900 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-primary w-48" />
          </div>
          <button className="flex items-center gap-3 px-6 py-3 bg-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white border border-gray-700">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {signals.map(signal => (
          <div key={signal.id} className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-xl hover:border-primary/40 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[8px] font-black text-gray-600 uppercase italic">Ref: {signal.id}</span>
            </div>
            
            <div className="flex items-center gap-4 mb-8">
              <div className={`p-3 rounded-2xl ${signal.type === TradeType.BUY ? 'bg-success/10' : 'bg-danger/10'}`}>
                {signal.type === TradeType.BUY ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-danger" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">{signal.pair}</h3>
                <span className={`text-[10px] font-black uppercase ${signal.type === TradeType.BUY ? 'text-success' : 'text-danger'}`}>
                  {signal.type === TradeType.BUY ? 'Institutional Buy' : 'Institutional Sell'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
               <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                  <span className="text-[9px] text-gray-500 font-black uppercase">Entry Zone</span>
                  <span className="text-xs font-mono font-black text-white italic">{signal.entry.toFixed(5)}</span>
               </div>
               <div className="flex justify-between items-center border-b border-gray-800/50 pb-2">
                  <span className="text-[9px] text-gray-500 font-black uppercase">Stop Loss</span>
                  <span className="text-xs font-mono font-black text-danger italic">{signal.sl.toFixed(5)}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] text-gray-500 font-black uppercase">Take Profit</span>
                  <span className="text-xs font-mono font-black text-success italic">{signal.tp.toFixed(5)}</span>
               </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
               <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black text-white uppercase">{signal.confidence}% Confidence</span>
               </div>
               <Clock className="w-3 h-3 text-gray-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
