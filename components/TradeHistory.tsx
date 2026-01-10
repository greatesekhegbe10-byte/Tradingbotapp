
import React from 'react';
import { Trade } from '../types';
import { ArrowUpRight, ArrowDownRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getPairDetails } from '../services/marketService';

interface TradeHistoryProps {
  trades: Trade[];
  onExecuteSignal: (pair: string, type: any) => void;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <div className="bg-surface rounded-[2rem] border border-gray-700 flex flex-col h-full overflow-hidden shadow-2xl">
      <div className="p-6 border-b border-gray-700 bg-gray-800/40 flex justify-between items-center">
        <h2 className="text-sm font-black text-white uppercase tracking-widest">Resolution Matrix</h2>
        <span className="text-[10px] font-black text-gray-500 uppercase">Live History</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-[9px] text-gray-500 uppercase bg-gray-900/50 font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Symbol</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {trades.length === 0 ? (
                <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                            <Clock className="w-8 h-8" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Queue Empty</span>
                        </div>
                    </td>
                </tr>
            ) : (
                trades.map((trade) => {
                  const details = getPairDetails(trade.symbol);
                  return (
                    <tr key={trade.id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4">
                            <div className={`flex items-center gap-2 text-[10px] font-black ${
                                trade.type === 'CALL' || trade.type === 'BUY' ? 'text-success' : 'text-danger'
                            }`}>
                                {trade.type === 'CALL' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {trade.type === 'BUY' ? 'CALL' : trade.type === 'SELL' ? 'PUT' : trade.type}
                            </div>
                        </td>
                        <td className="px-6 py-4 font-black text-xs text-gray-300">{trade.symbol}</td>
                        <td className="px-6 py-4">
                           {trade.status === 'OPEN' ? (
                               <div className="flex items-center gap-2 text-[10px] font-black text-primary animate-pulse">
                                   <Clock className="w-3 h-3" /> PENDING
                               </div>
                           ) : (
                               <div className={`flex items-center gap-2 text-[10px] font-black ${trade.status === 'WON' ? 'text-success' : 'text-danger'}`}>
                                   {trade.status === 'WON' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                   {trade.status}
                               </div>
                           )}
                        </td>
                        <td className={`px-6 py-4 text-right font-mono font-black text-xs ${
                            trade.status === 'WON' ? 'text-success' : trade.status === 'LOST' ? 'text-danger' : 'text-gray-500'
                        }`}>
                            {trade.status === 'WON' ? `+$${(trade.amount * (trade.payout || 0)).toFixed(2)}` : 
                             trade.status === 'LOST' ? `-$${trade.amount.toFixed(2)}` : '--'}
                        </td>
                    </tr>
                  );
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
