
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MarketDataPoint, Trade, TradeType } from '../types';

interface ChartPanelProps {
  data: MarketDataPoint[];
  pair: string;
  trades: Trade[];
}

export const ChartPanel: React.FC<ChartPanelProps> = ({ data, pair, trades }) => {
  // Filter for open trades on this pair to show levels
  const activeTrades = trades.filter(t => t.symbol === pair && t.status === 'OPEN');

  return (
    <div className="bg-surface p-6 rounded-xl border border-gray-700 h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-white">{pair} Live Market</h2>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-gray-700 text-xs rounded text-gray-300">1H</span>
          <span className="px-2 py-1 bg-primary text-xs rounded text-white font-bold animate-pulse">LIVE DATA</span>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              stroke="#475569"
              minTickGap={30}
            />
            <YAxis 
              domain={['auto', 'auto']} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              stroke="#475569"
              width={60}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }}
              itemStyle={{ color: '#3b82f6' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              isAnimationActive={false}
            />

            {/* Render Trade Lines */}
            {activeTrades.map((trade) => (
              <React.Fragment key={trade.id}>
                {/* Entry Price */}
                <ReferenceLine 
                    y={trade.price} 
                    stroke="#94a3b8" 
                    strokeDasharray="3 3"
                    label={{ position: 'right', value: 'ENTRY', fill: '#94a3b8', fontSize: 10 }} 
                />
                
                {/* Stop Loss */}
                {trade.stopLoss && (
                    <ReferenceLine 
                        y={trade.stopLoss} 
                        stroke="#ef4444" 
                        strokeDasharray="5 5"
                        label={{ position: 'right', value: 'SL', fill: '#ef4444', fontSize: 10 }} 
                    />
                )}

                {/* Take Profit */}
                {trade.takeProfit && (
                    <ReferenceLine 
                        y={trade.takeProfit} 
                        stroke="#10b981" 
                        strokeDasharray="5 5"
                        label={{ position: 'right', value: 'TP', fill: '#10b981', fontSize: 10 }} 
                    />
                )}
              </React.Fragment>
            ))}

          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
