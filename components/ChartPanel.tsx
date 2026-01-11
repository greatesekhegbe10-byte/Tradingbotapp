
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { MarketDataPoint, Trade, AnalysisResult } from '../types';
import { Activity, Target, Crosshair, Map, Info, Zap, TrendingUp } from 'lucide-react';

interface ChartPanelProps {
  data: MarketDataPoint[];
  pair: string;
  trades: Trade[];
  analysis: AnalysisResult | null;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ data, pair, trades, analysis }) => {
  const activeTrades = trades.filter(t => t.symbol === pair && t.status === 'OPEN');
  const lastPoint = data[data.length - 1];

  return (
    <div className="space-y-6">
      <div className="bg-surface p-8 rounded-[2.5rem] border border-gray-800 h-[450px] flex flex-col shadow-2xl relative group overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                <Activity className="w-5 h-5 text-primary" />
             </div>
             <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">{pair}</h2>
                  <span className="px-2 py-0.5 bg-gray-900 border border-gray-800 text-[8px] font-black rounded text-gray-500 uppercase tracking-widest">Institutional Live</span>
                </div>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                  <Map className="w-2.5 h-2.5" /> Candlestick Confluence Active
                </p>
             </div>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-success/10 border border-success/30 text-[10px] font-black rounded-xl text-success flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div> REAL-TIME FEED
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full min-h-0 relative">
          <div className="absolute top-0 right-0 z-20">
             <div className="bg-[#0a101f]/90 backdrop-blur-xl p-4 rounded-2xl border border-gray-800 shadow-2xl flex flex-col items-end">
                <span className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1">Tick Reference</span>
                <span className="text-2xl font-mono font-black text-white tracking-tighter">
                  {lastPoint?.price.toFixed(5)}
                </span>
             </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.5} />
              <XAxis dataKey="time" hide />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 800, fontFamily: 'monospace' }} 
                stroke="transparent"
                width={70}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                isAnimationActive={false}
              />

              {analysis && (
                <>
                  <ReferenceLine y={analysis.stopLoss} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'SL', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine y={analysis.takeProfit} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'right', value: 'TP', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                </>
              )}

              {lastPoint && (
                  <ReferenceDot y={lastPoint.price} x={data.length - 1} r={6} fill="#3b82f6" stroke="#fff" strokeWidth={3} isFront />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Institutional Insights Panel */}
      <div className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
          <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/20 rounded-lg"><Zap className="w-4 h-4 text-accent" /></div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Market Situation</h3>
              </div>
              <p className="text-sm font-black text-white uppercase leading-relaxed tracking-tight">
                  {analysis?.marketDefinition || "Scanning liquidity voids and volume profile..."}
              </p>
          </div>
          <div className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/20 rounded-lg"><TrendingUp className="w-4 h-4 text-success" /></div>
                  <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Candlestick Pattern</h3>
              </div>
              <p className="text-sm font-black text-success uppercase leading-relaxed tracking-tight">
                  {analysis?.candlestickPattern || "Pattern recognition in progress..."}
              </p>
          </div>
      </div>
    </div>
  );
};
