import React from 'react';
import { Trade, TradeType } from '../types';
import { History, ArrowUpRight, ArrowDownRight, Target, Shield } from 'lucide-react';
import { getPairDetails } from '../services/marketService';

interface TradeHistoryProps {
  trades: Trade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <div className="bg-surface rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden shadow-lg">
      <div className="p-4 border-b border-gray-700 flex items-center gap-2 bg-gray-800/30">
        <History className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-white">Order Book & History</h2>
      </div>
      
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-gray-400 uppercase bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Entry</th>
              <th className="px-4 py-3">Targets (SL/TP)</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">P/L</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No trades executed yet.
                    </td>
                </tr>
            ) : (
                trades.slice(0, 50).map((trade) => {
                  const asset = trade.symbol.split('/')[0];
                  const details = getPairDetails(trade.symbol);
                  const formatPrice = (p: number) => p.toFixed(details.decimals);
                  
                  return (
                    <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 font-bold ${trade.type === TradeType.BUY ? 'text-success' : 'text-danger'}`}>
                            {trade.type === TradeType.BUY ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {trade.type}
                        </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-300">{trade.symbol}</td>
                        <td className="px-4 py-3 font-mono text-gray-300">${formatPrice(trade.price)}</td>
                        <td className="px-4 py-3 text-xs font-mono text-gray-400">
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-danger" /> {trade.stopLoss ? formatPrice(trade.stopLoss) : '-'}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Target className="w-3 h-3 text-success" /> {trade.takeProfit ? formatPrice(trade.takeProfit) : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{trade.amount} {asset}</td>
                        <td className="px-4 py-3 font-mono">
                          {trade.profit !== undefined ? (
                            <span className={trade.profit >= 0 ? 'text-success' : 'text-danger'}>
                              {trade.profit >= 0 ? '+' : ''}{trade.profit.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-gray-700 text-gray-400'}`}>
                            {trade.status}
                        </span>
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