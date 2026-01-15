
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { MarketDataPoint, Trade, AnalysisResult } from '../types';
import { Activity, Map, Zap, TrendingUp, Shield, Layers, Box, Info } from 'lucide-react';

interface ChartPanelProps {
  data: MarketDataPoint[];
  pair: string;
  trades: Trade[];
  analysis: AnalysisResult | null;
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ data = [], pair, trades = [], analysis }) => {
  const lastPoint = data && data.length > 0 ? data[data.length - 1] : null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Primary Chart Housing */}
      <div className="bg-[#0a101f] p-8 rounded-[3rem] border border-gray-800 h-[480px] flex flex-col shadow-2xl relative group overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-5">
             <div className="p-4 bg-primary/10 rounded-[1.5rem] border border-primary/20 shadow-lg">
                <Activity className="w-6 h-6 text-primary" />
             </div>
             <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">{pair}</h2>
                  <span className="px-3 py-1 bg-primary text-white text-[8px] font-black rounded-lg uppercase tracking-widest animate-pulse">LIVE NODE</span>
                </div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                  <Map className="w-3 h-3" /> SMC Institutional Logic Active
                </p>
             </div>
          </div>
          <div className="hidden md:flex gap-3">
            <div className="px-5 py-2.5 bg-success/10 border border-success/30 text-[9px] font-black rounded-2xl text-success flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div> SERVER SYNCED
            </div>
          </div>
        </div>
        
        <div className="flex-1 w-full min-h-0 relative">
          <div className="absolute top-0 right-0 z-20">
             <div className="bg-[#070b14]/90 backdrop-blur-3xl p-6 rounded-[2rem] border border-gray-800 shadow-2xl flex flex-col items-end border-r-4 border-r-primary">
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.4em] mb-1 italic">SPOT PRICE</span>
                <span className="text-3xl font-mono font-black text-white tracking-tighter italic">
                  {lastPoint ? lastPoint.price.toFixed(5) : '0.00000'}
                </span>
             </div>
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} strokeOpacity={0.2} />
              <XAxis dataKey="time" hide />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 900 }} 
                stroke="transparent"
                width={70}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorPrice)" 
                isAnimationActive={false}
              />

              {analysis && (
                <>
                  <ReferenceLine y={analysis.stopLoss} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: 'S/L', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
                  <ReferenceLine y={analysis.takeProfit} stroke="#10b981" strokeDasharray="5 5" label={{ position: 'right', value: 'T/P', fill: '#10b981', fontSize: 10, fontWeight: 900 }} />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Advanced Candlestick & Market Situation Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group hover:border-primary/40 transition-all">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-accent/20 rounded-2xl"><Layers className="w-5 h-5 text-accent" /></div>
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Market Context</h3>
              </div>
              <p className="text-sm font-black text-white uppercase leading-relaxed tracking-tight">
                  {analysis?.marketDefinition || "Establishing neural handshake..."}
              </p>
          </div>
          <div className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group hover:border-success/40 transition-all">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-success/20 rounded-2xl"><TrendingUp className="w-5 h-5 text-success" /></div>
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Neural Pattern</h3>
              </div>
              <p className="text-sm font-black text-success uppercase leading-relaxed tracking-tight italic">
                  {analysis?.candlestickPattern || "Scanning price action patterns..."}
              </p>
          </div>
          <div className="bg-surface rounded-[2.5rem] border border-gray-800 p-8 shadow-2xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-2xl"><Box className="w-5 h-5 text-amber-500" /></div>
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Signal Source</h3>
              </div>
              <p className="text-sm font-black text-amber-500 uppercase leading-relaxed tracking-tight">
                  {analysis?.primarySignal || "Awaiting institutional confluence..." }
              </p>
          </div>
      </div>
    </div>
  );
};
