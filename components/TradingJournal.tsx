
import React, { useState } from 'react';
import { BookOpen, TrendingUp, TrendingDown, Target, Clock, BarChart3, Download, Search, LayoutList, Calendar } from 'lucide-react';
import { JournalEntry, UserProfile, TradeType } from '../types';

interface TradingJournalProps {
  user: UserProfile;
}

export const TradingJournal: React.FC<TradingJournalProps> = ({ user }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([
    { id: 'J-1', tradeId: 'TRD-1', pair: 'EUR/USD', type: TradeType.BUY, profit: 450, rr: 3.5, setup: 'Liquidity Sweep', timestamp: '2025-05-12' },
    { id: 'J-2', tradeId: 'TRD-2', pair: 'BTC/USD', type: TradeType.SELL, profit: -120, rr: 2.1, setup: 'RSI Divergence', timestamp: '2025-05-11' }
  ]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex justify-between items-center bg-[#0a101f] p-8 rounded-[3rem] border border-gray-800 shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Analytical Journal</h2>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Institutional Trade Ledger & Feedback Loop</p>
          </div>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105">
          <Download className="w-4 h-4" /> Export Analytics
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         <div className="xl:col-span-3 space-y-6">
            <div className="bg-surface rounded-[3rem] border border-gray-800 overflow-hidden shadow-2xl">
               <table className="w-full text-left">
                  <thead className="bg-gray-900/50 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                     <tr>
                        <th className="px-8 py-6">Timestamp</th>
                        <th className="px-8 py-6">Instrument</th>
                        <th className="px-8 py-6">Neural Setup</th>
                        <th className="px-8 py-6">RR Ratio</th>
                        <th className="px-8 py-6 text-right">Settlement</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/40">
                     {entries.map(entry => (
                        <tr key={entry.id} className="text-[11px] font-black uppercase group hover:bg-white/5 transition-all">
                           <td className="px-8 py-6 text-gray-500 italic">{entry.timestamp}</td>
                           <td className="px-8 py-6 text-white">{entry.pair}</td>
                           <td className="px-8 py-6 text-gray-300">{entry.setup}</td>
                           <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg">{entry.rr}:1 RR</span>
                           </td>
                           <td className={`px-8 py-6 text-right ${entry.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                              {entry.profit >= 0 ? '+' : ''}${entry.profit.toFixed(2)}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-[#0a101f] p-8 rounded-[3.5rem] border border-gray-800 shadow-2xl">
               <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3 mb-8">
                  <BarChart3 className="w-4 h-4 text-primary" /> Performance Matrix
               </h3>
               <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                     <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Profit Factor</span>
                     <span className="text-xs font-mono font-black text-success italic">{user.stats.profitFactor || '2.45'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                     <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Avg. RR</span>
                     <span className="text-xs font-mono font-black text-primary italic">3.2:1</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                     <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Drawdown Rate</span>
                     <span className="text-xs font-mono font-black text-danger italic">{user.stats.drawdown}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Recovery Index</span>
                     <span className="text-xs font-mono font-black text-white italic">HIGH</span>
                  </div>
               </div>
            </div>

            <div className="bg-gray-900/40 p-8 rounded-[3rem] border border-gray-800 border-dashed">
               <div className="flex flex-col items-center text-center gap-4 opacity-50">
                  <Clock className="w-8 h-8 text-gray-600" />
                  <p className="text-[9px] text-gray-500 font-black uppercase leading-relaxed italic">
                     Equity curve updates occur after local ledger reconciliation. Historical export is compliant with institutional audit standards.
                  </p>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
