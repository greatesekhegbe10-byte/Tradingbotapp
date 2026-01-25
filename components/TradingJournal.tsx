
import React, { useState } from 'react';
import { BookOpen, TrendingUp, TrendingDown, Target, Clock, BarChart3, Download, Search, LayoutList, Calendar, LineChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { JournalEntry, UserProfile, TradeType } from '../types';

export const TradingJournal: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [entries] = useState<JournalEntry[]>([
    { id: 'J-1', tradeId: 'T-8821', pair: 'EUR/USD', type: TradeType.BUY, profit: 450.20, rr: 3.2, setup: 'Liquidity Grab', timestamp: '2025-05-12', notes: 'Perfect SMC entry after sweep.' },
    { id: 'J-2', tradeId: 'T-8822', pair: 'XAU/USD', type: TradeType.SELL, profit: -120.00, rr: 2.5, setup: 'Trend Rejection', timestamp: '2025-05-11', notes: 'Premature entry before confirmation.' },
    { id: 'J-3', tradeId: 'T-8823', pair: 'BTC/USD', type: TradeType.BUY, profit: 890.50, rr: 4.0, setup: 'FVP Gap Fill', timestamp: '2025-05-10', notes: 'High confidence gap fill trade.' },
  ]);

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col xl:flex-row gap-10">
        <div className="flex-1 space-y-10">
          <div className="bg-[#0a101f] p-10 rounded-[3rem] border border-gray-800 shadow-2xl h-[400px]">
            <div className="flex items-center gap-4 mb-8">
               <LineChart className="w-6 h-6 text-primary" />
               <h3 className="text-sm font-black text-white uppercase tracking-widest">Equity Trajectory</h3>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={user.stats.equityHistory}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis hide domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0a101f', borderColor: '#1e293b', borderRadius: '12px', fontSize: '10px' }} />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Institutional Ledger</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl text-[9px] font-black text-primary uppercase">
                <Download className="w-3 h-3" /> Export PDF
              </button>
            </div>
            <table className="w-full text-left">
              <thead className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] bg-gray-900/30">
                <tr>
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Instrument</th>
                  <th className="px-8 py-5">Setup Type</th>
                  <th className="px-8 py-5 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {entries.map(entry => (
                  <tr key={entry.id} className="text-[11px] font-black uppercase hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-gray-500">{entry.timestamp}</td>
                    <td className="px-8 py-6 text-white">{entry.pair}</td>
                    <td className="px-8 py-6 text-gray-400">{entry.setup}</td>
                    <td className={`px-8 py-6 text-right ${entry.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {entry.profit >= 0 ? '+' : ''}${entry.profit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="xl:w-96 space-y-6">
           <div className="bg-[#0a101f] p-8 rounded-[3rem] border border-gray-800 shadow-2xl space-y-8">
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Analytics Matrix</h3>
              <div className="space-y-6">
                 <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <span className="text-[9px] text-gray-500 font-black uppercase">Win Rate</span>
                    <span className="text-xs font-mono font-black text-success">{user.stats.winRate}%</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <span className="text-[9px] text-gray-500 font-black uppercase">Profit Factor</span>
                    <span className="text-xs font-mono font-black text-primary">{user.stats.profitFactor}</span>
                 </div>
                 <div className="flex justify-between items-center border-b border-gray-800 pb-4">
                    <span className="text-[9px] text-gray-500 font-black uppercase">Total Ledger</span>
                    <span className="text-xs font-mono font-black text-white">{user.stats.totalTrades}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] text-gray-500 font-black uppercase">Recovery Index</span>
                    <span className="text-[10px] font-black text-white uppercase italic">Optimal</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
