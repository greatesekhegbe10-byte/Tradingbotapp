import React, { useState } from 'react';
import { Trade, TradeType } from '../types';
import { History, ArrowUpRight, ArrowDownRight, Target, Shield, Copy, Check, ClipboardPaste, Play, X } from 'lucide-react';
import { getPairDetails } from '../services/marketService';

interface TradeHistoryProps {
  trades: Trade[];
  onExecuteSignal: (pair: string, type: TradeType, sl?: number, tp?: number) => void;
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades, onExecuteSignal }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const handleCopyTrade = (trade: Trade) => {
    const signalText = `
🚀 NEXUS SIGNAL
Pair: ${trade.symbol}
Action: ${trade.type}
Entry: ${trade.price.toFixed(getPairDetails(trade.symbol).decimals)}
SL: ${trade.stopLoss ? trade.stopLoss.toFixed(getPairDetails(trade.symbol).decimals) : 'N/A'}
TP: ${trade.takeProfit ? trade.takeProfit.toFixed(getPairDetails(trade.symbol).decimals) : 'N/A'}
    `.trim();

    navigator.clipboard.writeText(signalText);
    setCopiedId(trade.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImport = () => {
    setImportError(null);
    if (!importText.trim()) return;

    // Basic Parsing Logic for the Signal Format
    try {
        const text = importText.toUpperCase();
        
        // Extract Pair
        const pairMatch = text.match(/PAIR:\s*([A-Z0-9\/]+)/);
        const symbol = pairMatch ? pairMatch[1] : null;

        // Extract Action
        const actionMatch = text.match(/ACTION:\s*(BUY|SELL)/);
        const type = actionMatch ? (actionMatch[1] as TradeType) : null;

        // Extract SL/TP (Optional)
        const slMatch = text.match(/SL:\s*([\d.]+)/);
        const sl = slMatch ? parseFloat(slMatch[1]) : undefined;

        const tpMatch = text.match(/TP:\s*([\d.]+)/);
        const tp = tpMatch ? parseFloat(tpMatch[1]) : undefined;

        if (symbol && type) {
            onExecuteSignal(symbol, type, sl, tp);
            setImportText('');
            setShowImport(false);
        } else {
            setImportError("Could not identify Pair or Action. Ensure format is 'Pair: BTC/USD' and 'Action: BUY'.");
        }
    } catch (err) {
        setImportError("Failed to parse signal.");
    }
  };

  return (
    <div className="bg-surface rounded-xl border border-gray-700 flex flex-col h-full overflow-hidden shadow-lg relative">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/30">
        <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Order Book</h2>
        </div>
        <button 
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition-colors border border-gray-600"
        >
            <ClipboardPaste className="w-3 h-3" /> Paste Signal
        </button>
      </div>

      {/* Import Overlay */}
      {showImport && (
          <div className="bg-gray-900 border-b border-gray-700 p-4 animate-fade-in">
              <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-primary uppercase">Import Signal Strategy</span>
                  <button onClick={() => setShowImport(false)}><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <textarea 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste signal here... &#10;Ex: &#10;Pair: EUR/USD &#10;Action: BUY"
                className="w-full h-24 bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs text-white font-mono focus:border-primary outline-none mb-2"
              />
              {importError && <p className="text-xs text-danger mb-2">{importError}</p>}
              <button 
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full py-2 bg-primary hover:bg-blue-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2"
              >
                  <Play className="w-3 h-3 fill-current" /> Execute Signal
              </button>
          </div>
      )}
      
      <div className="overflow-x-auto max-h-[400px]">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="text-xs text-gray-400 uppercase bg-gray-900/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">P/L</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 ? (
                <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No trades executed yet.
                    </td>
                </tr>
            ) : (
                trades.slice(0, 50).map((trade) => {
                  const details = getPairDetails(trade.symbol);
                  const formatPrice = (p: number) => p.toFixed(details.decimals);
                  
                  let displayProfit = trade.profit;
                  if (displayProfit === undefined && trade.status === 'CLOSED' && trade.closePrice) {
                     const diff = trade.type === TradeType.BUY 
                        ? trade.closePrice - trade.price 
                        : trade.price - trade.closePrice;
                     displayProfit = diff * trade.amount;
                  }

                  return (
                    <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 font-bold ${trade.type === TradeType.BUY ? 'text-success' : 'text-danger'}`}>
                            {trade.type === TradeType.BUY ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {trade.type}
                        </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-300">{trade.symbol}</td>
                        <td className="px-4 py-3 font-mono text-gray-400">
                           <div className="flex flex-col text-xs">
                               <span>@{formatPrice(trade.price)}</span>
                               {(trade.stopLoss || trade.takeProfit) && (
                                   <span className="text-[10px] text-gray-500">
                                       TP: {trade.takeProfit ? formatPrice(trade.takeProfit) : '-'}
                                   </span>
                               )}
                           </div>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {displayProfit !== undefined ? (
                            <span className={displayProfit >= 0 ? 'text-success' : 'text-danger'}>
                              {displayProfit >= 0 ? '+' : ''}{displayProfit.toFixed(2)}
                            </span>
                          ) : (
                             <span className="text-gray-500 text-xs italic">Running</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                            <button 
                                onClick={() => handleCopyTrade(trade)}
                                className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                                title="Copy as Signal"
                            >
                                {copiedId === trade.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            </button>
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